-- Local stage only: three independent draft prices. No entitlement or checkout activation.
BEGIN;
CREATE TABLE public.tier_price_versions(
 package_id text NOT NULL CHECK(package_id IN ('starter','premium','wedding_pro')),
 version bigint NOT NULL CHECK(version BETWEEN 1 AND 999999999999999999),
 config jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
 PRIMARY KEY(package_id,version)
);
CREATE TABLE public.tier_price_current(
 package_id text PRIMARY KEY,
 version bigint NOT NULL,
 FOREIGN KEY(package_id,version) REFERENCES public.tier_price_versions(package_id,version)
);
INSERT INTO public.tier_price_versions(package_id,version,config)
 SELECT p,1,'{"amount_idr":null,"promo":null}'::jsonb FROM unnest(ARRAY['starter','premium','wedding_pro']) p;
INSERT INTO public.tier_price_current SELECT package_id,version FROM public.tier_price_versions;
ALTER TABLE public.tier_price_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_price_current ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tier_price_versions,public.tier_price_current FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tier_price_immutable BEFORE UPDATE OR DELETE ON public.tier_price_versions FOR EACH ROW EXECUTE FUNCTION public.audit_immutable();
-- Pure private evaluator; no caller-controlled time accepted by any API RPC.
CREATE FUNCTION public.tier_price_at(c jsonb,t timestamptz) RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT jsonb_build_object('effective_amount_idr',CASE WHEN c->>'amount_idr' IS NULL THEN NULL WHEN c->'promo' <> 'null'::jsonb AND t >= (c->'promo'->>'starts_at')::timestamptz AND t < (c->'promo'->>'ends_at')::timestamptz THEN c->'promo'->>'amount_idr' ELSE c->>'amount_idr' END,
 'promo_active',coalesce(c->>'amount_idr' IS NOT NULL AND c->'promo' <> 'null'::jsonb AND t >= (c->'promo'->>'starts_at')::timestamptz AND t < (c->'promo'->>'ends_at')::timestamptz,false),
 'price_eligible',c->>'amount_idr' IS NOT NULL,'checkout_eligible',false)
$$;
REVOKE ALL ON FUNCTION public.tier_price_at(jsonb,timestamptz) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.admin_tier_catalog() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE t timestamptz:=statement_timestamp();
BEGIN
 IF NOT public.is_site_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
 RETURN jsonb_build_object('server_now',t,'packages',(SELECT jsonb_agg(jsonb_build_object('package_id',v.package_id,'version',v.version::text,'config',v.config,'created_at',v.created_at)||public.tier_price_at(v.config,t) ORDER BY CASE v.package_id WHEN 'starter' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END) FROM public.tier_price_current c JOIN public.tier_price_versions v USING(package_id,version)));
END $$;
REVOKE ALL ON FUNCTION public.admin_tier_catalog() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_tier_catalog() TO authenticated;
CREATE FUNCTION public.admin_update_tier_price(p_package_id text,p_expected_version text,p_config jsonb,p_reason text,p_confirmed boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old_version bigint; old_config jsonb; promo jsonb; a text; b text; starts timestamptz; ends timestamptz;
BEGIN
 LOCK TABLE public.site_admins IN SHARE ROW EXCLUSIVE MODE;
 IF NOT public.is_site_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
 IF p_confirmed IS DISTINCT FROM true THEN RAISE EXCEPTION 'confirmation required'; END IF;
 IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'reason required (1-500)'; END IF;
 IF p_package_id IS NULL OR p_package_id NOT IN ('starter','premium','wedding_pro') THEN RAISE EXCEPTION 'invalid package'; END IF;
 IF p_expected_version IS NULL OR p_expected_version !~ '^[1-9][0-9]{0,17}$' THEN RAISE EXCEPTION 'invalid version'; END IF;
 IF p_config IS NULL OR jsonb_typeof(p_config)<>'object' THEN RAISE EXCEPTION 'invalid config'; END IF;
 IF NOT p_config ?& ARRAY['amount_idr','promo'] OR (p_config - ARRAY['amount_idr','promo']) <> '{}'::jsonb THEN RAISE EXCEPTION 'invalid config keys'; END IF;
 a:=p_config->>'amount_idr';
 IF p_config->'amount_idr'<>'null'::jsonb THEN
  IF jsonb_typeof(p_config->'amount_idr')<>'string' OR a !~ '^[1-9][0-9]{0,15}$' THEN RAISE EXCEPTION 'invalid price'; END IF;
  IF a::numeric>9007199254740991 THEN RAISE EXCEPTION 'invalid price'; END IF;
 END IF;
 promo:=p_config->'promo';
 IF promo<>'null'::jsonb THEN
  IF jsonb_typeof(promo)<>'object' OR a IS NULL THEN RAISE EXCEPTION 'invalid promo'; END IF;
  IF NOT promo ?& ARRAY['amount_idr','title','starts_at','ends_at'] OR (promo - ARRAY['amount_idr','title','starts_at','ends_at'])<>'{}'::jsonb THEN RAISE EXCEPTION 'invalid promo keys'; END IF;
  b:=promo->>'amount_idr';
  IF jsonb_typeof(promo->'amount_idr') IS DISTINCT FROM 'string' OR b !~ '^[1-9][0-9]{0,15}$' THEN RAISE EXCEPTION 'invalid promo price'; END IF;
  IF b::numeric>=a::numeric THEN RAISE EXCEPTION 'invalid promo price'; END IF;
  IF jsonb_typeof(promo->'title') IS DISTINCT FROM 'string' OR length(btrim(promo->>'title')) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'invalid promo title'; END IF;
  IF jsonb_typeof(promo->'starts_at') IS DISTINCT FROM 'string' OR jsonb_typeof(promo->'ends_at') IS DISTINCT FROM 'string' OR (promo->>'starts_at') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' OR (promo->>'ends_at') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' THEN RAISE EXCEPTION 'invalid UTC schedule'; END IF;
  BEGIN starts:=(promo->>'starts_at')::timestamptz; ends:=(promo->>'ends_at')::timestamptz; EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'invalid UTC schedule'; END;
  -- PostgreSQL can normalize values such as 24:00:00; require exact canonical UTC.
  IF to_char(starts AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') IS DISTINCT FROM promo->>'starts_at'
     OR to_char(ends AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') IS DISTINCT FROM promo->>'ends_at' THEN RAISE EXCEPTION 'invalid UTC schedule'; END IF;
  IF starts>=ends THEN RAISE EXCEPTION 'invalid promo interval'; END IF;
 END IF;
 SELECT version INTO old_version FROM public.tier_price_current WHERE package_id=p_package_id FOR UPDATE;
 IF old_version IS NULL OR old_version::text<>p_expected_version THEN RAISE EXCEPTION 'version conflict; reload'; END IF;
 SELECT config INTO old_config FROM public.tier_price_versions WHERE package_id=p_package_id AND version=old_version;
 IF old_config=p_config THEN RAISE EXCEPTION 'price unchanged'; END IF;
 IF old_version=999999999999999999 THEN RAISE EXCEPTION 'invalid version exhausted'; END IF;
 INSERT INTO public.tier_price_versions(package_id,version,config) VALUES(p_package_id,old_version+1,p_config);
 UPDATE public.tier_price_current SET version=old_version+1 WHERE package_id=p_package_id;
 INSERT INTO public.admin_audit(actor_id,action,details) VALUES(auth.uid(),'settings.updated',jsonb_build_object('kind','package.tier_price','package_id',p_package_id,'previous_version',old_version::text,'version',(old_version+1)::text,'previous_config',old_config,'config',p_config,'reason',btrim(p_reason),'sales_activation',false));
 RETURN public.admin_tier_catalog();
END $$;
REVOKE ALL ON FUNCTION public.admin_update_tier_price(text,text,jsonb,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_update_tier_price(text,text,jsonb,text,boolean) TO authenticated;
-- Private trusted-server groundwork only. No API/service-role adapter or payment activation.
ALTER TABLE public.tier_price_versions ADD CONSTRAINT tier_version_config UNIQUE(package_id,version,config);
CREATE TABLE public.tier_invoice_snapshots(
 invoice text PRIMARY KEY CHECK(invoice ~ '^[A-Za-z0-9._-]{1,30}$'),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
 package_id text NOT NULL,
 version bigint NOT NULL,
 config jsonb NOT NULL,
 amount_idr bigint NOT NULL CHECK(amount_idr BETWEEN 1 AND 9007199254740991),
 promo_applied boolean NOT NULL,
 reserved_at timestamptz NOT NULL,
 FOREIGN KEY(package_id,version,config) REFERENCES public.tier_price_versions(package_id,version,config),
 CHECK((public.tier_price_at(config,reserved_at)->>'effective_amount_idr') IS NOT NULL AND amount_idr::text=(public.tier_price_at(config,reserved_at)->>'effective_amount_idr')),
 CHECK(promo_applied=(public.tier_price_at(config,reserved_at)->>'promo_active')::boolean)
);
ALTER TABLE public.tier_invoice_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tier_invoice_snapshots FROM PUBLIC,anon,authenticated;
CREATE TRIGGER tier_invoice_immutable BEFORE UPDATE OR DELETE ON public.tier_invoice_snapshots FOR EACH ROW EXECUTE FUNCTION public.audit_immutable();
CREATE FUNCTION public.reserve_tier_invoice(p_invoice text,p_workspace uuid,p_package text) RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $$
DECLARE v bigint; c jsonb; t timestamptz; evaluated jsonb; existing public.tier_invoice_snapshots;
BEGIN
 IF p_invoice IS NULL OR p_invoice !~ '^[A-Za-z0-9._-]{1,30}$' OR p_workspace IS NULL OR p_package IS NULL OR p_package NOT IN ('starter','premium','wedding_pro') THEN RAISE EXCEPTION 'invalid reservation'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('tier-invoice:'||p_invoice,0));
 SELECT * INTO existing FROM public.tier_invoice_snapshots WHERE invoice=p_invoice;
 IF FOUND THEN
  IF existing.workspace_id IS DISTINCT FROM p_workspace OR existing.package_id IS DISTINCT FROM p_package THEN RAISE EXCEPTION 'invoice conflict'; END IF;
  RETURN to_jsonb(existing)||jsonb_build_object('version',existing.version::text,'amount_idr',existing.amount_idr::text);
 END IF;
 -- Two statements: after a pointer lock wait READ COMMITTED must see the new version.
 SELECT version INTO v FROM public.tier_price_current WHERE package_id=p_package FOR SHARE;
 SELECT config INTO c FROM public.tier_price_versions WHERE package_id=p_package AND version=v;
 t:=clock_timestamp(); evaluated:=public.tier_price_at(c,t);
 IF c IS NULL OR evaluated->>'effective_amount_idr' IS NULL THEN RAISE EXCEPTION 'package unpriced'; END IF;
 INSERT INTO public.tier_invoice_snapshots VALUES(p_invoice,p_workspace,p_package,v,c,(evaluated->>'effective_amount_idr')::bigint,(evaluated->>'promo_active')::boolean,t) RETURNING * INTO existing;
 RETURN to_jsonb(existing)||jsonb_build_object('version',existing.version::text,'amount_idr',existing.amount_idr::text);
END $$;
REVOKE ALL ON FUNCTION public.reserve_tier_invoice(text,uuid,text) FROM PUBLIC,anon,authenticated;
COMMIT;
