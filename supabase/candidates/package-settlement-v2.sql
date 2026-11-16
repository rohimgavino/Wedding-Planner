-- OFFLINE S2 CANDIDATE ONLY: no policy attachment, backfill, provider verification or deployment.
BEGIN;
CREATE TABLE public.package_order_terms (
 invoice text PRIMARY KEY REFERENCES public.doku_orders(invoice),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
 tier text NOT NULL, price_version bigint NOT NULL, amount_idr bigint NOT NULL,
 contract_version integer NOT NULL CHECK(contract_version IN (0,1)),
 benefits jsonb NOT NULL CHECK(jsonb_typeof(benefits)='array'),
 duration_months integer, duration_days integer,
 CHECK((duration_months IS NOT NULL AND duration_days IS NULL AND duration_months IN (6,12)) OR
       (duration_days IS NOT NULL AND duration_months IS NULL AND duration_days>0))
);
ALTER TABLE public.package_order_terms ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.package_order_terms FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.s2_freeze_order() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b jsonb := '["collaboration","rundown","budget_expenses","checklist","vendors"]';
BEGIN
 IF NEW.package_id IN ('premium','wedding_pro') THEN b:=b || '["shared_savings","moodboard","digital_invitation"]'::jsonb; END IF;
 IF NEW.package_id='wedding_pro' THEN b:=b || '["honeymoon","engagement"]'::jsonb; END IF;
 INSERT INTO public.package_order_terms VALUES(NEW.invoice,NEW.workspace_id,NEW.package_id,NEW.price_version,NEW.amount_idr,1,b,CASE WHEN NEW.package_id='starter' THEN 6 ELSE 12 END,NULL);
 RETURN NEW;
END $$;
CREATE TRIGGER s2_reservation AFTER INSERT ON public.doku_orders FOR EACH ROW EXECUTE FUNCTION public.s2_freeze_order();
REVOKE ALL ON FUNCTION public.s2_freeze_order() FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE public.package_settlements (
 invoice text PRIMARY KEY REFERENCES public.package_order_terms(invoice),
 evidence_hash text NOT NULL, amount_idr bigint NOT NULL,
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
 terms jsonb NOT NULL, verified_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
 CHECK(isfinite(verified_at) AND isfinite(expires_at) AND expires_at>verified_at)
);
ALTER TABLE public.package_settlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.package_settlements FROM PUBLIC,anon,authenticated,service_role;
-- Only a separately authenticated, trusted verifier may call this candidate RPC.
-- It does not authenticate provider evidence. No HTTP/provider adapter is installed.
CREATE FUNCTION public.s2_settle_verified(p_invoice text,p_amount bigint,p_evidence_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.doku_orders; t public.package_order_terms; s public.package_settlements; v_now timestamptz:=now(); v_exp timestamptz;
BEGIN
 IF p_evidence_hash IS NULL OR length(p_evidence_hash) NOT BETWEEN 8 AND 255 OR p_evidence_hash<>btrim(p_evidence_hash) THEN RAISE EXCEPTION 'invalid evidence'; END IF;
 SELECT * INTO o FROM public.doku_orders WHERE invoice=p_invoice FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'unknown order'; END IF;
 IF p_amount IS DISTINCT FROM o.amount_idr THEN RAISE EXCEPTION 'amount conflict'; END IF;
 SELECT * INTO s FROM public.package_settlements WHERE invoice=p_invoice;
 IF FOUND THEN
  IF s.evidence_hash<>p_evidence_hash OR s.amount_idr<>p_amount THEN RAISE EXCEPTION 'settlement conflict'; END IF;
  RETURN to_jsonb(s);
 END IF;
 IF o.status NOT IN ('pending','checkout_ready','unknown') THEN RAISE EXCEPTION 'ineligible order'; END IF;
 SELECT * INTO t FROM public.package_order_terms WHERE invoice=p_invoice;
 IF NOT FOUND THEN
  -- Old orders have historical core benefits, not newly inferred premium modules.
  INSERT INTO public.package_order_terms VALUES(o.invoice,o.workspace_id,o.package_id,o.price_version,o.amount_idr,0,
   '["collaboration","budget_expenses","checklist","shared_savings","budgets","tasks","guests","savings_accounts","savings_contributions","vendors","vendor_installments","vendor_payments"]',NULL,o.duration_days) RETURNING * INTO t;
 END IF;
 IF (t.workspace_id,t.tier,t.price_version,t.amount_idr) IS DISTINCT FROM (o.workspace_id,o.package_id,o.price_version,o.amount_idr) THEN RAISE EXCEPTION 'terms conflict'; END IF;
 -- Calendar months, UTC, PostgreSQL end-of-month clamp; old terms use exact UTC days.
 v_exp:=((v_now AT TIME ZONE 'UTC') + CASE WHEN t.duration_months IS NOT NULL THEN make_interval(months=>t.duration_months) ELSE make_interval(days=>t.duration_days) END) AT TIME ZONE 'UTC';
 INSERT INTO public.package_settlements VALUES(o.invoice,p_evidence_hash,p_amount,o.workspace_id,to_jsonb(t),v_now,v_exp) RETURNING * INTO s;
 UPDATE public.doku_orders SET status='paid',paid_at=v_now,updated_at=v_now WHERE invoice=o.invoice;
 RETURN to_jsonb(s);
END $$;
REVOKE ALL ON FUNCTION public.s2_settle_verified(text,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.s2_settle_verified(text,bigint,text) TO service_role;
ALTER FUNCTION public.has_workspace_capability_v1(uuid,text) RENAME TO s1_has_workspace_capability_v1;
REVOKE ALL ON FUNCTION public.s1_has_workspace_capability_v1(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.has_workspace_capability_v1(p_workspace_id uuid,p_capability text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.s1_has_workspace_capability_v1(p_workspace_id,p_capability) OR coalesce(
 auth.uid() IS NOT NULL AND public.is_workspace_member(p_workspace_id) AND EXISTS(
 SELECT 1 FROM public.package_settlements s WHERE s.workspace_id=p_workspace_id AND s.verified_at<=now() AND s.expires_at>now()
 AND s.terms->'benefits' ? p_capability),false)
$$;
REVOKE ALL ON FUNCTION public.has_workspace_capability_v1(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_workspace_capability_v1(uuid,text) TO authenticated;
CREATE FUNCTION public.s2_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'immutable evidence'; END $$;
CREATE TRIGGER s2_terms_immutable BEFORE UPDATE OR DELETE ON public.package_order_terms FOR EACH ROW EXECUTE FUNCTION public.s2_immutable();
CREATE TRIGGER s2_settlement_immutable BEFORE UPDATE OR DELETE ON public.package_settlements FOR EACH ROW EXECUTE FUNCTION public.s2_immutable();
CREATE FUNCTION public.s2_order_identity() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF (NEW.invoice,NEW.workspace_id,NEW.payer_id,NEW.package_id,NEW.price_version,NEW.amount_idr,NEW.duration_days,NEW.request_id,NEW.created_at)
 IS DISTINCT FROM (OLD.invoice,OLD.workspace_id,OLD.payer_id,OLD.package_id,OLD.price_version,OLD.amount_idr,OLD.duration_days,OLD.request_id,OLD.created_at)
 THEN RAISE EXCEPTION 'immutable order identity'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER s2_order_identity BEFORE UPDATE ON public.doku_orders FOR EACH ROW EXECUTE FUNCTION public.s2_order_identity();
REVOKE ALL ON FUNCTION public.s2_immutable(),public.s2_order_identity() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER s2_capture_immutable BEFORE UPDATE OR DELETE ON public.workspace_legacy_capability_captures FOR EACH ROW EXECUTE FUNCTION public.s2_immutable();
CREATE TABLE public.package_capture_invalidations (
 workspace_id uuid NOT NULL, source_feature text NOT NULL, invalidated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(workspace_id,source_feature)
);
ALTER TABLE public.package_capture_invalidations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.package_capture_invalidations FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER s2_invalidation_immutable BEFORE UPDATE OR DELETE ON public.package_capture_invalidations FOR EACH ROW EXECUTE FUNCTION public.s2_immutable();
CREATE FUNCTION public.s2_invalidate_capture() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' OR (NEW.payment_provider,NEW.payment_reference,NEW.workspace_id,NEW.feature) IS DISTINCT FROM (OLD.payment_provider,OLD.payment_reference,OLD.workspace_id,OLD.feature) THEN
 INSERT INTO public.package_capture_invalidations(workspace_id,source_feature)
 SELECT OLD.workspace_id,OLD.feature WHERE EXISTS(SELECT 1 FROM public.workspace_legacy_capability_captures WHERE workspace_id=OLD.workspace_id AND source_feature=OLD.feature) ON CONFLICT DO NOTHING;
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER s2_invalidate_capture BEFORE UPDATE OR DELETE ON public.workspace_entitlements FOR EACH ROW EXECUTE FUNCTION public.s2_invalidate_capture();
REVOKE ALL ON FUNCTION public.s2_invalidate_capture() FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE f text; BEGIN
 SELECT pg_get_functiondef('public.s1_has_workspace_capability_v1(uuid,text)'::regprocedure) INTO f;
 f:=replace(f,'WHERE c.workspace_id=p_workspace_id','WHERE NOT EXISTS (SELECT 1 FROM public.package_capture_invalidations i WHERE i.workspace_id=c.workspace_id AND i.source_feature=c.source_feature) AND c.workspace_id=p_workspace_id');
 EXECUTE f;
END $$;
ALTER TABLE public.package_settlements ADD CONSTRAINT s2_evidence_unique UNIQUE(evidence_hash);
CREATE FUNCTION public.s2_validate_capture() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s jsonb;
BEGIN
 SELECT to_jsonb(e) INTO s FROM public.workspace_entitlements e WHERE workspace_id=NEW.workspace_id AND feature=NEW.source_feature FOR UPDATE;
 IF s IS NULL OR s IS DISTINCT FROM NEW.source_snapshot OR EXISTS(SELECT 1 FROM public.package_capture_invalidations WHERE workspace_id=NEW.workspace_id AND source_feature=NEW.source_feature) THEN RAISE EXCEPTION 'snapshot conflict'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER s2_validate_capture BEFORE INSERT ON public.workspace_legacy_capability_captures FOR EACH ROW EXECUTE FUNCTION public.s2_validate_capture();
REVOKE ALL ON FUNCTION public.s2_validate_capture() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.s2_capture_reviewed(p_workspace uuid,p_feature text,p_snapshot jsonb,p_reference text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.workspace_legacy_capability_captures;
BEGIN
 PERFORM 1 FROM public.workspace_entitlements WHERE workspace_id=p_workspace AND feature=p_feature FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'snapshot conflict: missing source'; END IF;
 SELECT * INTO c FROM public.workspace_legacy_capability_captures WHERE workspace_id=p_workspace AND source_feature=p_feature;
 IF FOUND THEN
 IF c.source_snapshot IS DISTINCT FROM p_snapshot OR c.capture_reference IS DISTINCT FROM p_reference THEN RAISE EXCEPTION 'capture conflict'; END IF;
 RETURN to_jsonb(c);
 END IF;
 INSERT INTO public.workspace_legacy_capability_captures(workspace_id,source_feature,source_snapshot,capture_reference) VALUES(p_workspace,p_feature,p_snapshot,p_reference) RETURNING * INTO c;
 RETURN to_jsonb(c);
END $$;
REVOKE ALL ON FUNCTION public.s2_capture_reviewed(uuid,text,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.s2_capture_reviewed(uuid,text,jsonb,text) TO service_role;
COMMIT;
