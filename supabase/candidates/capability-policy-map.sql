-- OFFLINE attachment candidate; must follow verified hosted policies. Not activation authority.
BEGIN;
-- Snapshot once, before changing policy definitions. Private rollback evidence only.
CREATE TABLE IF NOT EXISTS public.integration_helper_baseline(id boolean PRIMARY KEY CHECK(id), definition text NOT NULL);
REVOKE ALL ON public.integration_helper_baseline FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE public.integration_helper_baseline ENABLE ROW LEVEL SECURITY;
INSERT INTO public.integration_helper_baseline SELECT true,pg_catalog.pg_get_functiondef('public.has_workspace_entitlement(uuid,text)'::regprocedure) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.integration_policy_baseline(table_name text PRIMARY KEY, definition text NOT NULL);
REVOKE ALL ON public.integration_policy_baseline FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE public.integration_policy_baseline ENABLE ROW LEVEL SECURITY;
INSERT INTO public.integration_policy_baseline
SELECT tablename,format('CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s) WITH CHECK (%s)',policyname,tablename,permissive,cmd,array_to_string(roles,','),qual,with_check)
FROM pg_catalog.pg_policies WHERE schemaname='public' AND policyname='paid_core_access'
AND tablename IN ('budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments')
ON CONFLICT DO NOTHING;
DO $$ BEGIN IF (SELECT count(*) FROM public.integration_policy_baseline)<>8 THEN RAISE EXCEPTION 'eight original paid policies required'; END IF; END $$;

CREATE OR REPLACE FUNCTION public.has_workspace_entitlement(ws_id uuid,feature_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT public.legacy_has_workspace_entitlement(ws_id,feature_key) OR public.has_workspace_capability_v1(ws_id,CASE WHEN feature_key='core' THEN 'collaboration' ELSE feature_key END)
$$;
DO $$ DECLARE target text; cap text; BEGIN
FOREACH target IN ARRAY ARRAY['budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments'] LOOP
cap:=CASE WHEN target IN ('savings_accounts','savings_contributions') THEN 'shared_savings' ELSE 'collaboration' END;
EXECUTE format('DROP POLICY IF EXISTS paid_core_access ON public.%I',target);
EXECUTE format('CREATE POLICY paid_core_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(public.is_workspace_member(workspace_id) AND (public.legacy_has_workspace_entitlement(workspace_id,''core'') OR public.has_workspace_capability_v1(workspace_id,%L))) WITH CHECK(public.is_workspace_member(workspace_id) AND (public.legacy_has_workspace_entitlement(workspace_id,''core'') OR public.has_workspace_capability_v1(workspace_id,%L)))',target,cap,cap);
END LOOP;
END $$;
-- SECURITY DEFINER wrapper avoids granting the internal legacy helper directly.
CREATE OR REPLACE FUNCTION public.integration_policy_access(ws uuid,cap text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT public.is_workspace_member(ws) AND (public.legacy_has_workspace_entitlement(ws,'core') OR public.has_workspace_capability_v1(ws,cap)) $$;
REVOKE ALL ON FUNCTION public.integration_policy_access(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.integration_policy_access(uuid,text) TO authenticated;
DO $$ DECLARE target text; cap text; BEGIN
FOREACH target IN ARRAY ARRAY['budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments'] LOOP
cap:=CASE WHEN target IN ('savings_accounts','savings_contributions') THEN 'shared_savings' ELSE 'collaboration' END;
EXECUTE format('DROP POLICY paid_core_access ON public.%I',target);
EXECUTE format('CREATE POLICY paid_core_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(public.integration_policy_access(workspace_id,%L)) WITH CHECK(public.integration_policy_access(workspace_id,%L))',target,cap,cap);
END LOOP; END $$;
COMMIT;
