-- OFFLINE CANDIDATE ONLY. Not an automatic migration, activation or capture script.
-- Explicit reviewed capture is mandatory; never infer legacy status from time/tier.
BEGIN;
CREATE TABLE public.workspace_legacy_capability_captures (
  workspace_id uuid NOT NULL,
  source_feature text NOT NULL,
  source_snapshot jsonb NOT NULL CHECK(jsonb_typeof(source_snapshot)='object'),
  capture_reference text NOT NULL CHECK(length(btrim(capture_reference)) BETWEEN 1 AND 255),
  captured_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(workspace_id,source_feature),
  FOREIGN KEY(workspace_id,source_feature) REFERENCES public.workspace_entitlements(workspace_id,feature),
  CHECK((source_snapshot->>'workspace_id'=workspace_id::text) IS TRUE),
  CHECK((source_snapshot->>'feature'=source_feature) IS TRUE)
);
ALTER TABLE public.workspace_legacy_capability_captures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workspace_legacy_capability_captures FROM PUBLIC,anon,authenticated,service_role;

-- Server-settled provenance only; no checkout writer or public self-grant path in S1.
CREATE TABLE public.workspace_package_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  contract_version integer NOT NULL,
  tier text NOT NULL,
  source_reference text NOT NULL UNIQUE CHECK(length(btrim(source_reference)) BETWEEN 1 AND 255),
  verified_by text NOT NULL CHECK(length(btrim(verified_by)) BETWEEN 1 AND 255),
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CHECK(isfinite(verified_at) AND isfinite(expires_at) AND expires_at>verified_at)
);
CREATE INDEX workspace_package_grants_workspace ON public.workspace_package_grants(workspace_id);
ALTER TABLE public.workspace_package_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workspace_package_grants FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.has_workspace_capability_v1(p_workspace_id uuid,p_capability text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT coalesce(auth.uid() IS NOT NULL AND public.is_workspace_member(p_workspace_id) AND EXISTS (
    SELECT 1 FROM public.workspace_legacy_capability_captures c
    JOIN public.workspace_entitlements e ON e.workspace_id=c.workspace_id AND e.feature=c.source_feature
    WHERE c.workspace_id=p_workspace_id
      -- Current source lifecycle remains authoritative; snapshot is audit evidence,
      -- not an equality gate that revokes access after harmless metadata repair.
      AND c.source_snapshot->>'payment_reference'=e.payment_reference
      AND c.source_snapshot->>'payment_provider'=e.payment_provider
      AND e.revoked_at IS NULL AND (e.expires_at IS NULL OR (isfinite(e.expires_at) AND e.expires_at>now()))
      AND ((c.source_feature='core' AND p_capability IN (
        'collaboration','budget_expenses','checklist','shared_savings',
        'budgets','tasks','guests','savings_accounts','savings_contributions',
        'vendors','vendor_installments','vendor_payments'))
        OR (c.source_feature='honeymoon' AND p_capability='honeymoon')
        OR (c.source_feature='lamaran' AND p_capability='engagement'))
  ) OR (auth.uid() IS NOT NULL AND public.is_workspace_member(p_workspace_id) AND EXISTS (
    SELECT 1 FROM public.workspace_package_grants g
    WHERE g.workspace_id=p_workspace_id AND g.contract_version=1
      AND g.revoked_at IS NULL AND g.verified_at<=now() AND g.expires_at>now()
      AND (
        (g.tier IN ('starter','premium','wedding_pro') AND p_capability IN ('collaboration','rundown','budget_expenses','checklist','vendors'))
        OR (g.tier IN ('premium','wedding_pro') AND p_capability IN ('shared_savings','moodboard','digital_invitation'))
        OR (g.tier='wedding_pro' AND p_capability IN ('honeymoon','engagement'))
      )
  )) OR (auth.uid() IS NOT NULL AND public.is_workspace_member(p_workspace_id)
    AND public.has_developer_test_access(p_workspace_id)
    AND p_capability IN ('collaboration','budget_expenses','checklist','shared_savings',
      'budgets','tasks','guests','savings_accounts','savings_contributions',
      'vendors','vendor_installments','vendor_payments')),false);
$$;
REVOKE ALL ON FUNCTION public.has_workspace_capability_v1(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_workspace_capability_v1(uuid,text) TO authenticated;
COMMIT;
