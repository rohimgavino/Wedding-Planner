-- BELUM DITERAPKAN: provisioning admin hanya SQL operator tepercaya.
BEGIN;
CREATE TABLE public.site_admins(user_id uuid PRIMARY KEY REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.site_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_admins FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.is_site_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.site_admins WHERE user_id=auth.uid()) $$;
REVOKE ALL ON FUNCTION public.is_site_admin() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_site_admin() TO authenticated;
CREATE TABLE public.site_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 support_email text CHECK(support_email IS NULL OR (length(support_email)<=254 AND support_email ~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9]+([.-][A-Za-z0-9]+)*\.[A-Za-z]{2,}$')),
 price_idr bigint CHECK(price_idr BETWEEN 1 AND 9007199254740991),
 duration_days integer CHECK(duration_days BETWEEN 1 AND 3650),
 lynk_url text CHECK(lynk_url IS NULL OR lynk_url ~ '^https://lynk\.id/[A-Za-z0-9_-]+/[A-Za-z0-9_/-]+$'),
 sales_enabled boolean NOT NULL DEFAULT false,
 CHECK(NOT sales_enabled OR (price_idr IS NOT NULL AND duration_days IS NOT NULL AND lynk_url IS NOT NULL AND support_email IS NOT NULL))
);
INSERT INTO public.site_settings(id) VALUES(true);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_settings FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.site_settings TO anon,authenticated;
CREATE POLICY settings_read ON public.site_settings FOR SELECT TO anon,authenticated USING(true);
CREATE TABLE public.admin_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid NOT NULL,
 action text NOT NULL, subject_id uuid, details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.admin_audit TO authenticated;
CREATE POLICY audit_read ON public.admin_audit FOR SELECT TO authenticated USING(public.is_site_admin());
CREATE FUNCTION public.audit_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN RAISE EXCEPTION 'append-only audit'; END $$;
REVOKE ALL ON FUNCTION public.audit_immutable() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER audit_no_change BEFORE UPDATE OR DELETE ON public.admin_audit FOR EACH ROW EXECUTE FUNCTION public.audit_immutable();
CREATE FUNCTION public.save_site_settings(email text, price bigint, days integer, url text, enabled boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 -- Serialize authorization through commit with role grants/revocations.
 LOCK TABLE public.site_admins IN SHARE ROW EXCLUSIVE MODE;
 IF NOT public.is_site_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
 IF enabled AND NOT (SELECT sales_activation FROM public.release_controls WHERE id) THEN RAISE EXCEPTION 'sales activation required'; END IF;
 UPDATE public.site_settings SET support_email=nullif(btrim(email),''),price_idr=price,duration_days=days,lynk_url=nullif(btrim(url),''),sales_enabled=enabled WHERE id;
 INSERT INTO public.admin_audit(actor_id,action,details) VALUES(auth.uid(),'settings.updated',jsonb_build_object('price_idr',price,'duration_days',days,'sales_enabled',enabled));
END $$;
REVOKE ALL ON FUNCTION public.save_site_settings(text,bigint,integer,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_site_settings(text,bigint,integer,text,boolean) TO authenticated;
CREATE TABLE public.purchase_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
 requested_by uuid NOT NULL REFERENCES auth.users(id), feature text NOT NULL DEFAULT 'core' CHECK(feature='core'),
 price_idr bigint NOT NULL CHECK(price_idr BETWEEN 1 AND 9007199254740991), duration_days integer NOT NULL CHECK(duration_days BETWEEN 1 AND 3650), lynk_url text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected')),
 transaction_reference text UNIQUE CHECK(transaction_reference IS NULL OR transaction_reference ~ '^[A-Z0-9][A-Z0-9._:/-]{0,254}$'),
 verified_by uuid REFERENCES auth.users(id), verified_at timestamptz, review_note text CHECK(length(review_note)<=500),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_pending_core_purchase ON public.purchase_requests(workspace_id) WHERE status='pending';
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.purchase_requests FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.purchase_requests TO authenticated;
CREATE POLICY purchase_read ON public.purchase_requests FOR SELECT TO authenticated USING(public.is_workspace_member(workspace_id) OR public.is_site_admin());
-- Permanent registry also reserves audited legacy entitlement references. Duplicate legacy
-- references deliberately block migration: reconcile approved backfill before rollout.
CREATE TABLE public.verified_transactions (
 reference text PRIMARY KEY CHECK(reference ~ '^[A-Z0-9][A-Z0-9._:/-]{0,254}$'),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
 request_id uuid UNIQUE REFERENCES public.purchase_requests(id), created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.verified_transactions(reference,workspace_id)
 SELECT upper(btrim(payment_reference)),workspace_id FROM public.workspace_entitlements;
ALTER TABLE public.verified_transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.verified_transactions FROM PUBLIC,anon,authenticated;
CREATE TRIGGER transaction_no_change BEFORE UPDATE OR DELETE ON public.verified_transactions FOR EACH ROW EXECUTE FUNCTION public.audit_immutable();
CREATE FUNCTION public.request_core_purchase(ws_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.site_settings; result uuid;
BEGIN
 IF NOT public.is_workspace_member(ws_id) THEN RAISE EXCEPTION 'membership required'; END IF;
 PERFORM 1 FROM public.workspaces WHERE id=ws_id FOR UPDATE;
 SELECT * INTO s FROM public.site_settings WHERE id;
 IF NOT s.sales_enabled OR NOT (SELECT sales_activation FROM public.release_controls WHERE id) THEN RAISE EXCEPTION 'sales unavailable'; END IF;
 SELECT id INTO result FROM public.purchase_requests WHERE workspace_id=ws_id AND status='pending';
 IF result IS NOT NULL THEN RETURN result; END IF;
 INSERT INTO public.purchase_requests(workspace_id,requested_by,price_idr,duration_days,lynk_url) VALUES(ws_id,auth.uid(),s.price_idr,s.duration_days,s.lynk_url) RETURNING id INTO result;
 INSERT INTO public.admin_audit(actor_id,action,subject_id,details) VALUES(auth.uid(),'purchase.requested',result,jsonb_build_object('workspace_id',ws_id));
 RETURN result;
END $$;
CREATE FUNCTION public.verify_core_purchase(request_id uuid, reference text, paid_amount bigint, dashboard_confirmed boolean, note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.purchase_requests; ref text := upper(btrim(reference));
BEGIN
 -- Serialize authorization through commit with role grants/revocations.
 LOCK TABLE public.site_admins IN SHARE ROW EXCLUSIVE MODE;
 IF NOT public.is_site_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
 IF NOT (SELECT sales_activation FROM public.release_controls WHERE id) THEN RAISE EXCEPTION 'sales activation required'; END IF;
 IF dashboard_confirmed IS DISTINCT FROM true THEN RAISE EXCEPTION 'dashboard confirmation required'; END IF;
 IF ref IS NULL OR ref !~ '^[A-Z0-9][A-Z0-9._:/-]{0,254}$' OR note IS NULL OR length(btrim(note)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'invalid verification'; END IF;
 SELECT * INTO r FROM public.purchase_requests WHERE id=request_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'request not found'; END IF;
 IF paid_amount IS DISTINCT FROM r.price_idr THEN RAISE EXCEPTION 'amount mismatch'; END IF;
 IF r.status='verified' AND r.transaction_reference=ref THEN RETURN; END IF;
 IF r.status<>'pending' THEN RAISE EXCEPTION 'request already reviewed'; END IF;
 PERFORM 1 FROM public.workspaces WHERE id=r.workspace_id FOR UPDATE;
 INSERT INTO public.verified_transactions(reference,workspace_id,request_id) VALUES(ref,r.workspace_id,r.id);
 UPDATE public.purchase_requests SET status='verified',transaction_reference=ref,verified_by=auth.uid(),verified_at=now(),review_note=btrim(note) WHERE id=r.id;
 INSERT INTO public.workspace_entitlements(workspace_id,feature,payment_reference,verified_by,expires_at)
 VALUES(r.workspace_id,'core',ref,auth.uid()::text,now()+make_interval(days=>r.duration_days))
 ON CONFLICT(workspace_id,feature) DO UPDATE SET payment_reference=excluded.payment_reference,verified_by=excluded.verified_by,verified_at=now(),revoked_at=null,
 expires_at=greatest(now(),CASE WHEN public.workspace_entitlements.revoked_at IS NULL THEN public.workspace_entitlements.expires_at ELSE now() END)+make_interval(days=>r.duration_days);
 INSERT INTO public.admin_audit(actor_id,action,subject_id,details) VALUES(auth.uid(),'purchase.verified',r.id,jsonb_build_object('workspace_id',r.workspace_id,'reference',ref,'amount',paid_amount,'note',btrim(note)));
END $$;
REVOKE ALL ON FUNCTION public.request_core_purchase(uuid),public.verify_core_purchase(uuid,text,bigint,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_core_purchase(uuid),public.verify_core_purchase(uuid,text,bigint,boolean,text) TO authenticated;
CREATE FUNCTION public.reject_core_purchase(request_id uuid, note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.purchase_requests;
BEGIN
 -- Serialize authorization through commit with role grants/revocations.
 LOCK TABLE public.site_admins IN SHARE ROW EXCLUSIVE MODE;
 IF NOT public.is_site_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
 IF note IS NULL OR length(btrim(note)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'review note required'; END IF;
 SELECT * INTO r FROM public.purchase_requests WHERE id=request_id FOR UPDATE;
 IF NOT FOUND OR r.status<>'pending' THEN RAISE EXCEPTION 'request already reviewed'; END IF;
 UPDATE public.purchase_requests SET status='rejected',verified_by=auth.uid(),verified_at=now(),review_note=btrim(note) WHERE id=r.id;
 INSERT INTO public.admin_audit(actor_id,action,subject_id,details) VALUES(auth.uid(),'purchase.rejected',r.id,jsonb_build_object('workspace_id',r.workspace_id,'note',btrim(note)));
END $$;
REVOKE ALL ON FUNCTION public.reject_core_purchase(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reject_core_purchase(uuid,text) TO authenticated;
COMMIT;
