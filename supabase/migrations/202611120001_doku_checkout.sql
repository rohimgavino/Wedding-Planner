-- DOKU Checkout Non-SNAP Production schema (clean, minimal, fail-closed)

CREATE TABLE IF NOT EXISTS public.doku_orders (
  invoice text PRIMARY KEY CHECK (invoice ~ '^[A-Za-z0-9._-]{1,30}$'),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES auth.users(id),
  package_id text NOT NULL CHECK (package_id IN ('starter', 'premium', 'wedding_pro')),
  price_version bigint NOT NULL,
  amount_idr bigint NOT NULL CHECK (amount_idr > 0),
  duration_days integer NOT NULL DEFAULT 365 CHECK (duration_days > 0),
  request_id text NOT NULL UNIQUE CHECK (request_id ~ '^[A-Za-z0-9._-]{1,128}$'),
  status text NOT NULL CHECK (status IN ('pending', 'checkout_ready', 'unknown', 'paid', 'failed', 'expired')),
  checkout_url text,
  payment_channel text,
  doku_http_status integer,
  error_code text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS doku_orders_workspace_created_idx
  ON public.doku_orders (workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.doku_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  invoice_number text NOT NULL,
  payload_hash text NOT NULL,
  channel_id text,
  transaction_status text,
  amount_idr bigint,
  action text NOT NULL CHECK (action IN ('paid', 'ignored', 'unmatched', 'amount_mismatch')),
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doku_webhook_events_invoice_idx
  ON public.doku_webhook_events (invoice_number, received_at DESC);

ALTER TABLE public.doku_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doku_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.doku_orders FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.doku_webhook_events FROM PUBLIC, anon, authenticated;

-- Public & authenticated catalog read (price authority always comes from DB)
CREATE OR REPLACE FUNCTION public.public_tier_catalog()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := statement_timestamp();
  v_sales boolean := false;
  v_email text := null;
  v_packages jsonb := '[]'::jsonb;
BEGIN
  SELECT COALESCE(r.sales_activation, false) INTO v_sales
  FROM public.release_controls r
  WHERE r.id = true
  LIMIT 1;

  SELECT s.support_email INTO v_email
  FROM public.site_settings s
  WHERE s.id = true
  LIMIT 1;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'package_id', v.package_id,
        'version', v.version::text,
        'duration_days', 365,
        'base_amount_idr', v.config->>'amount_idr'
      ) || public.tier_price_at(v.config, v_now)
      ORDER BY CASE v.package_id WHEN 'starter' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END
    ),
    '[]'::jsonb
  )
  INTO v_packages
  FROM public.tier_price_current c
  JOIN public.tier_price_versions v USING (package_id, version);

  RETURN jsonb_build_object(
    'sales_enabled', v_sales,
    'support_email', v_email,
    'server_now', v_now,
    'packages', v_packages
  );
END $$;

REVOKE ALL ON FUNCTION public.public_tier_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_tier_catalog() TO anon, authenticated, service_role;

-- Reserve or reuse an order before dispatching DOKU Checkout v1
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
      AND e.feature = p_package_id
      AND e.revoked_at IS NULL
      AND e.expires_at > v_now
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

-- Record DOKU Checkout initiation result (never downgrade paid or unknown)
CREATE OR REPLACE FUNCTION public.doku_set_order_result(
  p_invoice text,
  p_status text,
  p_checkout_url text DEFAULT NULL,
  p_http_status integer DEFAULT NULL,
  p_error_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ord public.doku_orders;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_status NOT IN ('checkout_ready', 'unknown', 'failed') THEN
    RAISE EXCEPTION 'invalid_target_status';
  END IF;

  SELECT * INTO v_ord
  FROM public.doku_orders
  WHERE invoice = p_invoice
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_ord.status = 'paid' THEN
    RETURN jsonb_build_object('outcome', 'already_paid', 'order', to_jsonb(v_ord));
  END IF;

  IF v_ord.status = 'unknown' THEN
    RETURN jsonb_build_object('outcome', 'already_unknown', 'order', to_jsonb(v_ord));
  END IF;

  IF p_status = 'checkout_ready' THEN
    IF p_checkout_url IS NULL OR p_checkout_url !~ '^https://(jokul|checkout|pay|staging|sandbox)\.doku\.com/checkout(?:-link(?:-v2)?|/link)/[A-Za-z0-9_-]+$' THEN
      RAISE EXCEPTION 'invalid_checkout_url';
    END IF;
    UPDATE public.doku_orders
    SET status = 'checkout_ready',
        checkout_url = p_checkout_url,
        doku_http_status = p_http_status,
        error_code = NULL,
        updated_at = v_now
    WHERE invoice = p_invoice
    RETURNING * INTO v_ord;
  ELSIF p_status = 'unknown' THEN
    UPDATE public.doku_orders
    SET status = 'unknown',
        doku_http_status = p_http_status,
        error_code = left(COALESCE(p_error_code, 'UNKNOWN'), 64),
        updated_at = v_now
    WHERE invoice = p_invoice
    RETURNING * INTO v_ord;
  ELSE
    UPDATE public.doku_orders
    SET status = 'failed',
        doku_http_status = p_http_status,
        error_code = left(COALESCE(p_error_code, 'FAILED'), 64),
        updated_at = v_now
    WHERE invoice = p_invoice
    RETURNING * INTO v_ord;
  END IF;

  RETURN jsonb_build_object('outcome', v_ord.status, 'order', to_jsonb(v_ord));
END $$;

REVOKE ALL ON FUNCTION public.doku_set_order_result(text, text, text, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.doku_set_order_result(text, text, text, integer, text) TO service_role;

-- Idempotent settlement from verified DOKU HTTP Notification webhook
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
BEGIN
  IF p_event_key IS NULL OR p_payload_hash IS NULL OR p_invoice IS NULL THEN
    RAISE EXCEPTION 'invalid_notification_args';
  END IF;

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
    );
    RETURN jsonb_build_object('outcome', 'unmatched');
  END IF;

  IF p_tx_status = 'SUCCESS' AND (p_tx_type IS NULL OR p_tx_type = 'SALE') THEN
    IF p_amount_idr IS DISTINCT FROM v_ord.amount_idr THEN
      INSERT INTO public.doku_webhook_events (
        event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
      ) VALUES (
        p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'amount_mismatch', v_now
      );
      RETURN jsonb_build_object('outcome', 'amount_mismatch');
    END IF;

    IF v_ord.status <> 'paid' THEN
      UPDATE public.doku_orders
      SET status = 'paid',
          paid_at = v_now,
          payment_channel = COALESCE(NULLIF(p_channel_id, ''), payment_channel),
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
    );

    RETURN jsonb_build_object(
      'outcome', 'paid',
      'workspace_id', v_ord.workspace_id,
      'package_id', v_ord.package_id,
      'invoice', v_ord.invoice
    );
  END IF;

  IF p_tx_status = 'EXPIRED' AND v_ord.status IN ('pending', 'checkout_ready') THEN
    UPDATE public.doku_orders
    SET status = 'expired', updated_at = v_now
    WHERE invoice = p_invoice;
  END IF;

  INSERT INTO public.doku_webhook_events (
    event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
  ) VALUES (
    p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'ignored', v_now
  );

  RETURN jsonb_build_object('outcome', 'ignored');
END $$;

REVOKE ALL ON FUNCTION public.doku_apply_notification(text, text, text, bigint, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.doku_apply_notification(text, text, text, bigint, text, text, text) TO service_role;

-- Read billing status & order history for a workspace (authenticated member or service_role)
CREATE OR REPLACE FUNCTION public.doku_workspace_orders(p_workspace_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NOT NULL AND NOT public.is_workspace_member(p_workspace_id) THEN
    RAISE EXCEPTION 'workspace_membership_required' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'orders', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'invoice', o.invoice,
        'package_id', o.package_id,
        'amount_idr', o.amount_idr,
        'duration_days', o.duration_days,
        'status', o.status,
        'checkout_url', o.checkout_url,
        'payment_channel', o.payment_channel,
        'expires_at', o.expires_at,
        'created_at', o.created_at,
        'paid_at', o.paid_at
      ) ORDER BY o.created_at DESC)
      FROM (
        SELECT * FROM public.doku_orders
        WHERE workspace_id = p_workspace_id
        ORDER BY created_at DESC
        LIMIT 20
      ) o
    ), '[]'::jsonb),
    'entitlements', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'feature', e.feature,
        'payment_provider', e.payment_provider,
        'payment_reference', e.payment_reference,
        'expires_at', e.expires_at,
        'revoked_at', e.revoked_at
      ) ORDER BY e.feature)
      FROM public.workspace_entitlements e
      WHERE e.workspace_id = p_workspace_id
    ), '[]'::jsonb)
  );
END $$;

REVOKE ALL ON FUNCTION public.doku_workspace_orders(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.doku_workspace_orders(uuid) TO authenticated, service_role;

-- Admin read recent DOKU orders
CREATE OR REPLACE FUNCTION public.admin_doku_orders()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_site_admin() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(o) ORDER BY o.created_at DESC)
    FROM (
      SELECT invoice, workspace_id, payer_id, package_id, amount_idr, duration_days,
             status, payment_channel, doku_http_status, error_code, created_at, paid_at
      FROM public.doku_orders
      ORDER BY created_at DESC
      LIMIT 100
    ) o
  ), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.admin_doku_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_doku_orders() TO authenticated;

-- Admin toggle sales activation & support email without requiring Lynk.id URL
CREATE OR REPLACE FUNCTION public.admin_set_sales_activation(
  p_enabled boolean,
  p_support_email text,
  p_reason text,
  p_confirmed boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text := NULLIF(btrim(COALESCE(p_support_email, '')), '');
BEGIN
  IF NOT public.is_site_admin() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;
  IF p_confirmed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'confirmation_required';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF v_email IS NOT NULL AND (length(v_email) > 254 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RAISE EXCEPTION 'invalid_support_email';
  END IF;

  UPDATE public.release_controls
  SET sales_activation = COALESCE(p_enabled, false)
  WHERE id = true;

  IF v_email IS NOT NULL THEN
    UPDATE public.site_settings
    SET support_email = v_email
    WHERE id = true;
  END IF;

  INSERT INTO public.admin_audit (actor_id, action, details)
  VALUES (
    v_actor,
    'sales.activation_updated',
    jsonb_build_object(
      'sales_enabled', COALESCE(p_enabled, false),
      'support_email', v_email,
      'reason', btrim(p_reason)
    )
  );

  RETURN public.public_tier_catalog();
END $$;

REVOKE ALL ON FUNCTION public.admin_set_sales_activation(boolean, text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_sales_activation(boolean, text, text, boolean) TO authenticated;
