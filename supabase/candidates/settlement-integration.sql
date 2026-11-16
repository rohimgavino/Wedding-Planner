-- OFFLINE INTEGRATION CANDIDATE ONLY. No migration activation.
BEGIN;
CREATE TABLE public.package_settlement_revocations (
 invoice text PRIMARY KEY REFERENCES public.package_settlements(invoice),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 255),
 revoked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.package_settlement_revocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.package_settlement_revocations FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER revocations_immutable BEFORE UPDATE OR DELETE ON public.package_settlement_revocations FOR EACH ROW EXECUTE FUNCTION public.s2_immutable();
CREATE FUNCTION public.revoke_package_settlement(p_invoice text,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM 1 FROM public.doku_orders WHERE invoice=p_invoice FOR UPDATE;
 INSERT INTO public.package_settlement_revocations(invoice,reason) VALUES(p_invoice,p_reason) ON CONFLICT DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.revoke_package_settlement(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_package_settlement(text,text) TO service_role;
CREATE FUNCTION public.revoke_core_settlements() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.feature='core' AND NEW.revoked_at IS NOT NULL THEN
  INSERT INTO public.package_settlement_revocations(invoice,reason)
  SELECT invoice,'core operator revocation' FROM public.package_settlements WHERE workspace_id=NEW.workspace_id ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER revoke_core_settlements AFTER INSERT OR UPDATE ON public.workspace_entitlements FOR EACH ROW EXECUTE FUNCTION public.revoke_core_settlements();
REVOKE ALL ON FUNCTION public.revoke_core_settlements() FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.has_workspace_capability_v1(p_workspace_id uuid,p_capability text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.s1_has_workspace_capability_v1(p_workspace_id,p_capability) OR coalesce(
 auth.uid() IS NOT NULL AND public.is_workspace_member(p_workspace_id) AND EXISTS(
 SELECT 1 FROM public.package_settlements s WHERE s.workspace_id=p_workspace_id AND s.verified_at<=now() AND s.expires_at>now()
 AND NOT EXISTS(SELECT 1 FROM public.package_settlement_revocations r WHERE r.invoice=s.invoice)
 AND s.terms->'benefits' ? p_capability),false)
$$;

ALTER FUNCTION public.has_workspace_entitlement(uuid,text) RENAME TO legacy_has_workspace_entitlement;
REVOKE ALL ON FUNCTION public.legacy_has_workspace_entitlement(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.has_workspace_entitlement(ws_id uuid,feature_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT public.legacy_has_workspace_entitlement(ws_id,feature_key) OR
 public.has_workspace_capability_v1(ws_id,CASE WHEN feature_key='core' THEN 'collaboration' ELSE feature_key END)
$$;
REVOKE ALL ON FUNCTION public.has_workspace_entitlement(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_workspace_entitlement(uuid,text) TO authenticated;
ALTER FUNCTION public.s2_settle_verified(text,bigint,text) RENAME TO canonical_settle_locked;
REVOKE ALL ON FUNCTION public.canonical_settle_locked(text,bigint,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE public.package_settlement_events (
 event_key text PRIMARY KEY REFERENCES public.doku_webhook_events(event_key),
 invoice text NOT NULL REFERENCES public.package_settlements(invoice)
);
ALTER TABLE public.package_settlement_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.package_settlement_events FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER settlement_event_immutable BEFORE UPDATE OR DELETE ON public.package_settlement_events FOR EACH ROW EXECUTE FUNCTION public.s2_immutable();
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

  -- Canonical writer order: order row, then event advisory, then settlement.
  -- The status/settlement wrapper and revocation already take this row first.
  -- Never acquire a doku-ev advisory lock before entering this writer.
  SELECT * INTO v_ord
  FROM public.doku_orders
  WHERE invoice = p_invoice
  FOR UPDATE;

  -- Keep event-key serialization across invoices, including unmatched deliveries.
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

  IF v_ord.invoice IS NULL THEN
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

    INSERT INTO public.doku_webhook_events (
      event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
    ) VALUES (
      p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'paid', v_now
    )
    ON CONFLICT (event_key) DO NOTHING;

    -- Same transaction: authenticated adapter event -> immutable terms -> settlement.
    PERFORM public.canonical_settle_locked(p_invoice,p_amount_idr,
      coalesce((SELECT evidence_hash FROM public.package_settlements WHERE invoice=p_invoice),p_payload_hash));
    INSERT INTO public.package_settlement_events VALUES(p_event_key,p_invoice) ON CONFLICT DO NOTHING;
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


CREATE FUNCTION public.s2_settle_verified(p_invoice text,p_amount bigint,p_evidence_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.package_settlements; r jsonb;
BEGIN
 IF p_evidence_hash IS NULL OR length(p_evidence_hash) NOT BETWEEN 8 AND 255 OR p_evidence_hash<>btrim(p_evidence_hash) THEN RAISE EXCEPTION 'invalid evidence'; END IF;
 PERFORM 1 FROM public.doku_orders WHERE invoice=p_invoice FOR UPDATE;
 SELECT * INTO s FROM public.package_settlements WHERE invoice=p_invoice;
 IF FOUND THEN
  IF s.evidence_hash<>p_evidence_hash OR s.amount_idr<>p_amount THEN RAISE EXCEPTION 'settlement conflict'; END IF;
  RETURN to_jsonb(s);
 END IF;
 r:=public.doku_apply_notification('s2:'||p_invoice||':'||p_evidence_hash,p_evidence_hash,p_invoice,p_amount,'S2-TRUSTED','SUCCESS','SALE');
 IF r->>'outcome'<>'paid' THEN RAISE EXCEPTION 'settlement rejected %',r->>'outcome'; END IF;
 SELECT * INTO s FROM public.package_settlements WHERE invoice=p_invoice;
 RETURN to_jsonb(s);
END $$;
REVOKE ALL ON FUNCTION public.s2_settle_verified(text,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.s2_settle_verified(text,bigint,text) TO service_role;
COMMIT;
