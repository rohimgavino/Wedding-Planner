-- DOKU Checkout hardening: atomic webhook deduplication, non-SUCCESS resolution for unknown/pending orders,
-- safe admin resolution for stuck unknown orders, core+package entitlement guard, and operator audit visibility.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_entitlements_feature_check') THEN
    ALTER TABLE public.workspace_entitlements DROP CONSTRAINT workspace_entitlements_feature_check;
  END IF;
  ALTER TABLE public.workspace_entitlements
    ADD CONSTRAINT workspace_entitlements_feature_check
    CHECK (feature IN ('core', 'lamaran', 'honeymoon', 'starter', 'premium', 'wedding_pro'));

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_entitlements_payment_provider_check') THEN
    ALTER TABLE public.workspace_entitlements DROP CONSTRAINT workspace_entitlements_payment_provider_check;
  END IF;
  ALTER TABLE public.workspace_entitlements
    ADD CONSTRAINT workspace_entitlements_payment_provider_check
    CHECK (payment_provider IN ('lynk.id', 'doku', 'doku_sandbox'));
END $$;

CREATE OR REPLACE FUNCTION public.doku_reserve_order(
  p_workspace_id uuid,
  p_payer_id uuid,
  p_package_id text,
  p_invoice text,
  p_request_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sales boolean := false;
  v_existing public.doku_orders;
  v_snap jsonb;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_workspace_id IS NULL OR p_payer_id IS NULL THEN
    RAISE EXCEPTION 'workspace_and_payer_required';
  END IF;
  IF p_package_id IS NULL OR p_package_id NOT IN ('starter', 'premium', 'wedding_pro') THEN
    RAISE EXCEPTION 'invalid_package';
  END IF;
  IF p_invoice IS NULL OR p_invoice !~ '^[A-Za-z0-9._-]{1,30}$' THEN
    RAISE EXCEPTION 'invalid_invoice';
  END IF;
  IF p_request_id IS NULL OR p_request_id !~ '^[A-Za-z0-9._-]{1,128}$' THEN
    RAISE EXCEPTION 'invalid_request_id';
  END IF;

  SELECT COALESCE(r.sales_activation, false) INTO v_sales
  FROM public.release_controls r
  WHERE r.id = true
  LIMIT 1;

  IF NOT v_sales THEN
    RAISE EXCEPTION 'sales_disabled';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members m
    WHERE m.workspace_id = p_workspace_id AND m.user_id = p_payer_id
  ) THEN
    RAISE EXCEPTION 'workspace_membership_required';
  END IF;

  -- Serialize order reservation per workspace to prevent double-click races
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('doku-ws:' || p_workspace_id::text, 0)
  );

  IF EXISTS (
    SELECT 1 FROM public.workspace_entitlements e
    WHERE e.workspace_id = p_workspace_id
      AND e.feature IN ('core', p_package_id)
      AND e.revoked_at IS NULL
      AND (e.expires_at IS NULL OR e.expires_at > v_now)
  ) THEN
    RETURN jsonb_build_object('outcome', 'already_active');
  END IF;

  -- Quarantine any unresolved ambiguous dispatch so user never double-pays
  SELECT * INTO v_existing
  FROM public.doku_orders o
  WHERE o.workspace_id = p_workspace_id AND o.status = 'unknown'
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'outcome', 'unresolved_unknown',
      'order', to_jsonb(v_existing)
    );
  END IF;

  -- Reuse active unexpired checkout URL for the same workspace & package
  SELECT * INTO v_existing
  FROM public.doku_orders o
  WHERE o.workspace_id = p_workspace_id
    AND o.package_id = p_package_id
    AND o.status = 'checkout_ready'
    AND o.checkout_url IS NOT NULL
    AND (o.expires_at IS NULL OR o.expires_at > v_now)
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'outcome', 'existing',
      'order', to_jsonb(v_existing)
    );
  END IF;

  -- Expire older pending/checkout_ready rows for this workspace if stale
  UPDATE public.doku_orders
  SET status = 'expired', updated_at = v_now
  WHERE workspace_id = p_workspace_id
    AND status IN ('pending', 'checkout_ready')
    AND expires_at IS NOT NULL
    AND expires_at <= v_now;

  -- Authoritative server-side price snapshot
  v_snap := public.reserve_tier_invoice(p_invoice, p_workspace_id, p_package_id);

  INSERT INTO public.doku_orders (
    invoice, workspace_id, payer_id, package_id,
    price_version, amount_idr, duration_days,
    request_id, status, expires_at, created_at, updated_at
  )
  VALUES (
    p_invoice,
    p_workspace_id,
    p_payer_id,
    p_package_id,
    (v_snap->>'version')::bigint,
    (v_snap->>'amount_idr')::bigint,
    365,
    p_request_id,
    'pending',
    v_now + interval '60 minutes',
    v_now,
    v_now
  )
  RETURNING * INTO v_existing;

  RETURN jsonb_build_object(
    'outcome', 'reserved',
    'order', to_jsonb(v_existing)
  );
END $$;

REVOKE ALL ON FUNCTION public.doku_reserve_order(uuid, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.doku_reserve_order(uuid, uuid, text, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.doku_apply_notification(
  p_event_key text,
  p_payload_hash text,
  p_invoice text,
  p_amount_idr bigint,
  p_channel_id text,
  p_tx_status text,
  p_tx_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing_ev public.doku_webhook_events;
  v_ord public.doku_orders;
  v_now timestamptz := clock_timestamp();
  v_exp timestamptz;
  v_norm_status text := upper(btrim(coalesce(p_tx_status, '')));
  v_norm_type text := upper(btrim(coalesce(p_tx_type, 'SALE')));
BEGIN
  IF p_event_key IS NULL OR p_payload_hash IS NULL OR p_invoice IS NULL THEN
    RAISE EXCEPTION 'invalid_notification_args';
  END IF;

  -- Serialize concurrent identical webhook deliveries by event_key before checking/inserting
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('doku-ev:' || p_event_key, 0)
  );

  SELECT * INTO v_existing_ev
  FROM public.doku_webhook_events
  WHERE event_key = p_event_key;

  IF FOUND THEN
    IF v_existing_ev.payload_hash = p_payload_hash THEN
      RETURN jsonb_build_object('outcome', 'duplicate');
    END IF;
    RETURN jsonb_build_object('outcome', 'conflict');
  END IF;

  SELECT * INTO v_ord
  FROM public.doku_orders
  WHERE invoice = p_invoice
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.doku_webhook_events (
      event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
    ) VALUES (
      p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'unmatched', v_now
    )
    ON CONFLICT (event_key) DO NOTHING;
    RETURN jsonb_build_object('outcome', 'unmatched');
  END IF;

  IF v_norm_status = 'SUCCESS' AND (p_tx_type IS NULL OR v_norm_type IN ('SALE', 'PAYMENT', '')) THEN
    IF p_amount_idr IS DISTINCT FROM v_ord.amount_idr THEN
      INSERT INTO public.doku_webhook_events (
        event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
      ) VALUES (
        p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'amount_mismatch', v_now
      )
      ON CONFLICT (event_key) DO NOTHING;
      RETURN jsonb_build_object('outcome', 'amount_mismatch');
    END IF;

    IF v_ord.status <> 'paid' THEN
      UPDATE public.doku_orders
      SET status = 'paid',
          paid_at = v_now,
          payment_channel = COALESCE(NULLIF(p_channel_id, ''), payment_channel),
          error_code = NULL,
          updated_at = v_now
      WHERE invoice = p_invoice
      RETURNING * INTO v_ord;

      v_exp := v_now + make_interval(days => v_ord.duration_days);

      -- Activate both 'core' (required by existing RLS/dashboard) and specific package tier
      INSERT INTO public.workspace_entitlements (
        workspace_id, feature, payment_provider, payment_reference, verified_by, verified_at, expires_at, revoked_at
      )
      VALUES
        (v_ord.workspace_id, 'core', 'doku', v_ord.invoice, 'doku-webhook', v_now, v_exp, NULL),
        (v_ord.workspace_id, v_ord.package_id, 'doku', v_ord.invoice, 'doku-webhook', v_now, v_exp, NULL)
      ON CONFLICT (workspace_id, feature) DO UPDATE
      SET payment_provider = CASE
            WHEN public.workspace_entitlements.expires_at > v_now + interval '400 days' THEN public.workspace_entitlements.payment_provider
            ELSE 'doku'
          END,
          payment_reference = CASE
            WHEN public.workspace_entitlements.expires_at > v_now + interval '400 days' THEN public.workspace_entitlements.payment_reference
            ELSE EXCLUDED.payment_reference
          END,
          verified_by = 'doku-webhook',
          verified_at = v_now,
          expires_at = (CASE
            WHEN public.workspace_entitlements.revoked_at IS NULL THEN GREATEST(COALESCE(public.workspace_entitlements.expires_at, v_now), v_now)
            ELSE v_now
          END) + make_interval(days => v_ord.duration_days),
          revoked_at = NULL;

      INSERT INTO public.admin_audit (actor_id, action, subject_id, details)
      VALUES (
        v_ord.payer_id,
        'doku.payment_verified',
        v_ord.workspace_id,
        jsonb_build_object(
          'invoice', v_ord.invoice,
          'package_id', v_ord.package_id,
          'amount_idr', v_ord.amount_idr,
          'channel_id', p_channel_id,
          'duration_days', v_ord.duration_days
        )
      );
    END IF;

    INSERT INTO public.doku_webhook_events (
      event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
    ) VALUES (
      p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'paid', v_now
    )
    ON CONFLICT (event_key) DO NOTHING;

    RETURN jsonb_build_object(
      'outcome', 'paid',
      'workspace_id', v_ord.workspace_id,
      'package_id', v_ord.package_id,
      'invoice', v_ord.invoice
    );
  END IF;

  -- Terminal failure/expiry webhooks transition pending/checkout_ready/unknown out of deadlock
  IF p_amount_idr IS NOT DISTINCT FROM v_ord.amount_idr
     AND v_ord.status IN ('pending', 'checkout_ready', 'unknown') THEN
    IF v_norm_status = 'EXPIRED' THEN
      UPDATE public.doku_orders
      SET status = 'expired', updated_at = v_now
      WHERE invoice = p_invoice;
    ELSIF v_norm_status IN ('FAILED', 'CANCELLED', 'CANCELED') THEN
      UPDATE public.doku_orders
      SET status = 'failed',
          error_code = left('DOKU_WEBHOOK_' || v_norm_status, 64),
          updated_at = v_now
      WHERE invoice = p_invoice;
    END IF;
  END IF;

  INSERT INTO public.doku_webhook_events (
    event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
  ) VALUES (
    p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'ignored', v_now
  )
  ON CONFLICT (event_key) DO NOTHING;

  RETURN jsonb_build_object('outcome', 'ignored');
END $$;

REVOKE ALL ON FUNCTION public.doku_apply_notification(text, text, text, bigint, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.doku_apply_notification(text, text, text, bigint, text, text, text) TO service_role;

-- Audited admin resolution for stuck unknown/pending orders (never grants 'paid' unilaterally)
CREATE OR REPLACE FUNCTION public.admin_resolve_doku_order(
  p_invoice text,
  p_target_status text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_ord public.doku_orders;
BEGIN
  IF NOT public.is_site_admin() THEN
    RAISE EXCEPTION 'admin required' USING ERRCODE = '42501';
  END IF;
  IF p_target_status IS NULL OR p_target_status NOT IN ('failed', 'expired') THEN
    RAISE EXCEPTION 'invalid target status';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 8 AND 240 THEN
    RAISE EXCEPTION 'reason must be 8..240 chars';
  END IF;

  SELECT * INTO v_ord
  FROM public.doku_orders
  WHERE invoice = p_invoice
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;
  IF v_ord.status NOT IN ('unknown', 'pending', 'checkout_ready') THEN
    RAISE EXCEPTION 'order_not_resolvable';
  END IF;

  UPDATE public.doku_orders
  SET status = p_target_status,
      error_code = 'ADMIN_RESOLVED_' || upper(p_target_status),
      updated_at = v_now
  WHERE invoice = v_ord.invoice
  RETURNING * INTO v_ord;

  INSERT INTO public.admin_audit (actor_id, action, subject_id, details)
  VALUES (
    auth.uid(),
    'doku.order_resolved',
    v_ord.workspace_id,
    jsonb_build_object(
      'invoice', v_ord.invoice,
      'target_status', p_target_status,
      'reason', btrim(p_reason)
    )
  );

  RETURN jsonb_build_object('outcome', 'resolved', 'order', to_jsonb(v_ord));
END $$;

REVOKE ALL ON FUNCTION public.admin_resolve_doku_order(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_doku_order(text, text, text) TO authenticated;

DROP POLICY IF EXISTS audit_read ON public.admin_audit;
CREATE POLICY audit_read ON public.admin_audit FOR SELECT TO authenticated USING (
  public.site_role() = 'developer'
  OR (
    public.site_role() = 'operator'
    AND action IN (
      'settings.updated',
      'purchase.requested',
      'purchase.verified',
      'purchase.rejected',
      'sales.activation_updated',
      'doku.order_resolved'
    )
  )
);
