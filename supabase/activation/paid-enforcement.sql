-- NOT an automatic migration. Separate approval, inventory/access manifest and restore gate required.
BEGIN;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['budgets','tasks','guests','savings_accounts'] LOOP
 EXECUTE format('CREATE POLICY paid_core ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(public.has_workspace_entitlement(workspace_id,''core'')) WITH CHECK(public.has_workspace_entitlement(workspace_id,''core''))',t);
 END LOOP;
END $$;
CREATE POLICY savings_paid ON public.savings_contributions AS RESTRICTIVE FOR ALL TO authenticated
 USING(public.has_workspace_entitlement(workspace_id,'core')) WITH CHECK(public.has_workspace_entitlement(workspace_id,'core'));
COMMIT;
