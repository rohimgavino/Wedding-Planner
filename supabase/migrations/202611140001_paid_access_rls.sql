-- Tahap A: enforcement only. LOCAL REVIEW; NOT APPLIED TO PRODUCTION.
-- Prerequisites: all eight public tables must already exist: budgets, tasks, guests,
-- savings_accounts, savings_contributions, vendors, vendor_installments, vendor_payments.
-- Require workspace_id, enabled RLS, existing authenticated permissive member CRUD
-- policies and their table privileges; this restrictive policy cannot supply access.
-- Require trusted public.is_workspace_member(uuid) and
-- public.has_workspace_entitlement(uuid,text), executable by authenticated, with
-- the reviewed membership/core semantics (including installed developer-own rules).
-- secure_foundation + workspace_entitlements_savings alone are NOT sufficient.
-- Hosted vendor/reset/starter/WhatsApp migration history is missing locally:
-- reconcile actual schema/helpers/policies/ACL and hosted ledger with the release
-- owner before targeted application. Full fresh migration-chain replay is NOT
-- supported or proven; the schema-only test fixture is not a migration/restore.
-- Preserves existing membership policies; no sales/settings/entitlement/data mutation.
-- Developer test access, when installed, is governed by the existing trusted helper.
BEGIN;
DO $paid_rls$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments'] LOOP
    -- Only replace this migration's own policy, never the permissive member policy.
    EXECUTE format('DROP POLICY IF EXISTS paid_core_access ON public.%I', target);
    EXECUTE format(
      'CREATE POLICY paid_core_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
       USING (public.is_workspace_member(workspace_id) AND public.has_workspace_entitlement(workspace_id, ''core''))
       WITH CHECK (public.is_workspace_member(workspace_id) AND public.has_workspace_entitlement(workspace_id, ''core''))',
      target
    );
  END LOOP;
END
$paid_rls$;
COMMIT;
