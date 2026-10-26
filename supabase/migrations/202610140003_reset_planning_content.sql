-- BELUM DITERAPKAN. Requires paid/admin migrations; no hosted writes in development.
BEGIN;
-- Deliberate SECURITY DEFINER cleanup: active entitlement is not required to delete
-- one's own planning data. Membership ownership is checked server-side, never admin.
CREATE FUNCTION public.reset_planning_content(p_workspace_id uuid, p_confirmation text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); b bigint; t bigint; g bigint; s bigint; counts jsonb;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_confirmation IS DISTINCT FROM 'RESET RENCANA' THEN RAISE EXCEPTION 'confirmation required' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=uid AND role='owner' FOR UPDATE) THEN
  RAISE EXCEPTION 'owner required' USING ERRCODE='42501';
 END IF;
 -- Only these four tables. Do not cascade-delete workspace, identity, legacy
 -- savings accounts, invitations, purchase references, entitlements or audit.
 DELETE FROM public.budgets WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS b=ROW_COUNT;
 DELETE FROM public.tasks WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS t=ROW_COUNT;
 DELETE FROM public.guests WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS g=ROW_COUNT;
 DELETE FROM public.savings_contributions WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS s=ROW_COUNT;
 counts:=jsonb_build_object('budgets',b,'tasks',t,'guests',g,'savings_contributions',s);
 INSERT INTO public.admin_audit(actor_id,action,subject_id,details)
 VALUES(uid,'planning.reset',p_workspace_id,jsonb_build_object('deleted',counts));
 RETURN counts;
END $$;
-- Expand installs the function but nobody in the public API can execute it.
REVOKE ALL ON FUNCTION public.reset_planning_content(uuid,text) FROM PUBLIC,anon,authenticated;
COMMIT;
