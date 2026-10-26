-- LOKAL / BELUM DITERAPKAN. Tidak bootstrap identitas dari email atau metadata.
BEGIN;
-- Existing grants remain operators; first developer requires verified Auth UUID out-of-band.
ALTER TABLE public.site_admins ADD COLUMN role text NOT NULL DEFAULT 'operator' CHECK(role IN ('operator','developer'));
CREATE FUNCTION public.site_role() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT role FROM public.site_admins WHERE user_id=auth.uid();
$$;
REVOKE ALL ON FUNCTION public.site_role() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.site_role() TO authenticated;
CREATE FUNCTION public.protect_last_developer() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 LOCK TABLE public.site_admins IN SHARE ROW EXCLUSIVE MODE;
 IF OLD.role='developer' AND (TG_OP='DELETE' OR NEW.role<>'developer')
 AND NOT EXISTS(SELECT 1 FROM public.site_admins WHERE role='developer' AND user_id<>OLD.user_id)
 THEN RAISE EXCEPTION 'cannot remove last developer'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_last_developer() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER last_developer BEFORE UPDATE OR DELETE ON public.site_admins FOR EACH ROW EXECUTE FUNCTION public.protect_last_developer();
CREATE FUNCTION public.set_site_admin(p_user_id uuid,p_role text,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 LOCK TABLE public.site_admins IN SHARE ROW EXCLUSIVE MODE;
 IF public.site_role() IS DISTINCT FROM 'developer' THEN RAISE EXCEPTION 'developer required'; END IF;
 IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'reason required'; END IF;
 IF p_user_id IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_user_id) THEN RAISE EXCEPTION 'verified auth identity required'; END IF;
 IF p_role IS NOT NULL AND p_role NOT IN ('developer','operator') THEN RAISE EXCEPTION 'invalid role'; END IF;
 IF p_role IS NULL THEN
 DELETE FROM public.site_admins WHERE user_id=p_user_id;
 ELSE
 INSERT INTO public.site_admins(user_id,role) VALUES(p_user_id,p_role) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role;
 END IF;
 INSERT INTO public.admin_audit(actor_id,action,subject_id,details) VALUES(auth.uid(),CASE WHEN p_role IS NULL THEN 'admin.revoked' ELSE 'admin.granted' END,p_user_id,jsonb_build_object('role',p_role,'reason',btrim(p_reason)));
END $$;
CREATE FUNCTION public.list_site_admins() RETURNS TABLE(user_id uuid,role text,created_at timestamptz) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF public.site_role() IS DISTINCT FROM 'developer' THEN RAISE EXCEPTION 'developer required'; END IF;
 RETURN QUERY SELECT a.user_id,a.role,a.created_at FROM public.site_admins a ORDER BY a.created_at;
END $$;
REVOKE ALL ON FUNCTION public.set_site_admin(uuid,text,text),public.list_site_admins() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_site_admin(uuid,text,text),public.list_site_admins() TO authenticated;
DROP POLICY audit_read ON public.admin_audit;
CREATE POLICY audit_read ON public.admin_audit FOR SELECT TO authenticated USING(
 public.site_role()='developer' OR (public.site_role()='operator' AND action IN ('settings.updated','purchase.requested','purchase.verified','purchase.rejected')));
CREATE TABLE public.developer_test_grants (
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id), user_id uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, revoked_at timestamptz,
 PRIMARY KEY(workspace_id,user_id)
);
ALTER TABLE public.developer_test_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.developer_test_grants FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.developer_test_grants TO authenticated;
CREATE POLICY test_grant_read ON public.developer_test_grants FOR SELECT TO authenticated USING(user_id=auth.uid() AND public.is_workspace_member(workspace_id));
CREATE FUNCTION public.has_developer_test_access(p_workspace_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.site_role()='developer' AND EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=auth.uid() AND role='owner')
 AND EXISTS(SELECT 1 FROM public.developer_test_grants WHERE workspace_id=p_workspace_id AND user_id=auth.uid() AND revoked_at IS NULL AND expires_at>now());
$$;
CREATE FUNCTION public.grant_developer_test_access(p_workspace_id uuid,p_days integer,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF public.site_role() IS DISTINCT FROM 'developer' THEN RAISE EXCEPTION 'developer required'; END IF;
 PERFORM 1 FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=auth.uid() AND role='owner') THEN RAISE EXCEPTION 'owner required'; END IF;
 IF p_days IS NULL OR p_days NOT BETWEEN 1 AND 30 OR p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'invalid test grant'; END IF;
 INSERT INTO public.developer_test_grants(workspace_id,user_id,expires_at) VALUES(p_workspace_id,auth.uid(),now()+make_interval(days=>p_days))
 ON CONFLICT(workspace_id,user_id) DO UPDATE SET expires_at=excluded.expires_at,revoked_at=null;
 INSERT INTO public.admin_audit(actor_id,action,subject_id,details) VALUES(auth.uid(),'developer.test.granted',p_workspace_id,jsonb_build_object('days',p_days,'reason',btrim(p_reason),'payment',false));
END $$;
CREATE FUNCTION public.revoke_developer_test_access(p_workspace_id uuid,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF public.site_role() IS DISTINCT FROM 'developer' THEN RAISE EXCEPTION 'developer required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=auth.uid() AND role='owner') THEN RAISE EXCEPTION 'owner required'; END IF;
 IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'reason required'; END IF;
 UPDATE public.developer_test_grants SET revoked_at=now() WHERE workspace_id=p_workspace_id AND user_id=auth.uid();
 INSERT INTO public.admin_audit(actor_id,action,subject_id,details) VALUES(auth.uid(),'developer.test.revoked',p_workspace_id,jsonb_build_object('reason',btrim(p_reason),'payment',false));
END $$;
REVOKE ALL ON FUNCTION public.has_developer_test_access(uuid),public.grant_developer_test_access(uuid,integer,text),public.revoke_developer_test_access(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_developer_test_access(uuid),public.grant_developer_test_access(uuid,integer,text),public.revoke_developer_test_access(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.has_workspace_entitlement(ws_id uuid,feature_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.is_workspace_member(ws_id) AND (
 EXISTS(SELECT 1 FROM public.workspace_entitlements WHERE workspace_id=ws_id AND feature=feature_key AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>now()))
 OR (feature_key='core' AND public.has_developer_test_access(ws_id)));
$$;
COMMIT;
