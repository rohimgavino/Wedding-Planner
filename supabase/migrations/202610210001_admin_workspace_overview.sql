-- LOCAL ONLY: additive operational metadata, no payment activation or planner bypass.
BEGIN;
CREATE FUNCTION public.admin_workspace_overview(p_limit integer DEFAULT 50,p_offset integer DEFAULT 0)
RETURNS TABLE(workspace_id uuid,member_count integer,access_status text,expires_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF public.site_role() IS NULL THEN RAISE EXCEPTION 'admin required'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 100000 THEN RAISE EXCEPTION 'invalid pagination'; END IF;
 RETURN QUERY SELECT w.id,(SELECT count(*)::integer FROM public.workspace_members m WHERE m.workspace_id=w.id),
 CASE WHEN e.workspace_id IS NULL THEN 'unentitled' WHEN e.revoked_at IS NOT NULL THEN 'revoked' WHEN e.expires_at IS NOT NULL AND e.expires_at<=now() THEN 'expired' ELSE 'active' END,
 e.expires_at FROM public.workspaces w LEFT JOIN public.workspace_entitlements e ON e.workspace_id=w.id AND e.feature='core'
 ORDER BY w.id LIMIT p_limit OFFSET p_offset;
END $$;
REVOKE ALL ON FUNCTION public.admin_workspace_overview(integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_workspace_overview(integer,integer) TO authenticated;
COMMENT ON FUNCTION public.admin_workspace_overview(integer,integer) IS 'Operational metadata only. Historical paid entitlement, not DOKU or effective staged planner access. No couple identity/contact or planner content.';
COMMIT;
