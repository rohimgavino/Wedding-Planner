-- BELUM DITERAPKAN. Audit/backfill workspace lama wajib sebelum rollout berbayar.
BEGIN;
CREATE TABLE public.workspace_entitlements (
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 feature text NOT NULL CHECK(feature IN ('core','lamaran','honeymoon')),
 payment_provider text NOT NULL DEFAULT 'lynk.id' CHECK(payment_provider='lynk.id'),
 payment_reference text NOT NULL CHECK(length(btrim(payment_reference)) BETWEEN 1 AND 255),
 verified_by text NOT NULL CHECK(length(btrim(verified_by)) BETWEEN 1 AND 255),
 verified_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz,
 revoked_at timestamptz,
 PRIMARY KEY(workspace_id,feature)
);
ALTER TABLE public.workspace_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workspace_entitlements FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.workspace_entitlements TO authenticated;
CREATE POLICY entitlement_read ON public.workspace_entitlements FOR SELECT TO authenticated USING(public.is_workspace_member(workspace_id));
-- Trusted database administrator only provisions verified purchases. No public grant RPC.
CREATE FUNCTION public.has_workspace_entitlement(ws_id uuid, feature_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.is_workspace_member(ws_id) AND EXISTS(
 SELECT 1 FROM public.workspace_entitlements WHERE workspace_id=ws_id AND feature=feature_key
 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>now()));
$$;
REVOKE ALL ON FUNCTION public.has_workspace_entitlement(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_workspace_entitlement(uuid,text) TO authenticated;
-- Expand only: restrictive policies are held in supabase/activation/paid-enforcement.sql.
-- No client can mutate the release gate. Sales activation requires a reviewed DBA step.
CREATE TABLE public.release_controls(id boolean PRIMARY KEY DEFAULT true CHECK(id), sales_activation boolean NOT NULL DEFAULT false);
INSERT INTO public.release_controls(id) VALUES(true);
ALTER TABLE public.release_controls ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.release_controls FROM PUBLIC,anon,authenticated;
CREATE TABLE public.savings_contributions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 contributor_id uuid NOT NULL,
 amount bigint NOT NULL CHECK(amount BETWEEN 1 AND 9007199254740991),
 contributed_on date NOT NULL,
 notes text NOT NULL DEFAULT '' CHECK(length(notes)<=500),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(workspace_id,contributor_id) REFERENCES public.workspace_members(workspace_id,user_id)
);
CREATE INDEX savings_contributions_workspace ON public.savings_contributions(workspace_id);
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.savings_contributions FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.savings_contributions TO authenticated;
CREATE POLICY savings_member ON public.savings_contributions FOR ALL TO authenticated
 USING(public.is_workspace_member(workspace_id)) WITH CHECK(public.is_workspace_member(workspace_id));
-- savings_paid is installed only by deliberate paid activation.
-- Prevent moving a ledger row between workspaces even when caller belongs to both.
CREATE FUNCTION public.keep_savings_workspace() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.workspace_id<>OLD.workspace_id THEN RAISE EXCEPTION 'immutable workspace'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.keep_savings_workspace() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER savings_workspace_immutable BEFORE UPDATE ON public.savings_contributions
 FOR EACH ROW EXECUTE FUNCTION public.keep_savings_workspace();
COMMIT;
