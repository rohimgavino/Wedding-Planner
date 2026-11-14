-- Emergency rollback of Tahap A only. Does NOT delete or modify customer data.
-- Restores membership-only planner access; this deliberately removes paid protection.
-- Requires separate DBA approval; never tied to sales toggles or public RPC.
BEGIN;
DROP POLICY IF EXISTS paid_core_access ON public.budgets;
DROP POLICY IF EXISTS paid_core_access ON public.tasks;
DROP POLICY IF EXISTS paid_core_access ON public.guests;
DROP POLICY IF EXISTS paid_core_access ON public.savings_accounts;
DROP POLICY IF EXISTS paid_core_access ON public.savings_contributions;
DROP POLICY IF EXISTS paid_core_access ON public.vendors;
DROP POLICY IF EXISTS paid_core_access ON public.vendor_installments;
DROP POLICY IF EXISTS paid_core_access ON public.vendor_payments;
COMMIT;
