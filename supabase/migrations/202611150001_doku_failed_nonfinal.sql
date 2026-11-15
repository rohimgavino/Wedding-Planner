-- OFFLINE REVIEW CANDIDATE ONLY: additive replacement; not an applied migration.
-- No historical row reclassification: failed rows need operator/provider review.
-- No pricing, duration, reservation, or entitlement-upsert changes.

BEGIN;

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

  -- Checkout FAILED is a non-final attempt failure: audit only, preserving
  -- pending/checkout_ready/unknown for later authenticated SUCCESS reconciliation.
  -- Retain the existing whole-order expiry/cancellation policy unchanged.
  IF p_amount_idr IS NOT DISTINCT FROM v_ord.amount_idr
     AND v_ord.status IN ('pending', 'checkout_ready', 'unknown') THEN
    IF v_norm_status = 'EXPIRED' THEN
      UPDATE public.doku_orders
      SET status = 'expired', updated_at = v_now
      WHERE invoice = p_invoice;
    ELSIF v_norm_status IN ('CANCELLED', 'CANCELED') THEN
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

COMMIT;
