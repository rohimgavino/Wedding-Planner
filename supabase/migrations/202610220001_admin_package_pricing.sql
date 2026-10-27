-- LOCAL additive design only. No activation, legacy settings/role function replacement or entitlement writes.
BEGIN;
CREATE TABLE public.package_price_versions (
 version bigint PRIMARY KEY CHECK(version>0),
 amount_idr bigint NOT NULL CHECK(amount_idr BETWEEN 1 AND 9007199254740991),
 currency text NOT NULL DEFAULT 'IDR' CHECK(currency='IDR'),
 duration_unit text NOT NULL DEFAULT 'calendar_year' CHECK(duration_unit='calendar_year'),
 duration_count integer NOT NULL DEFAULT 1 CHECK(duration_count=1),
 workspace_count integer NOT NULL DEFAULT 1 CHECK(workspace_count=1),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(version,amount_idr)
);
INSERT INTO public.package_price_versions(version,amount_idr) VALUES(1,250000);
CREATE TABLE public.package_price_current (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 version bigint NOT NULL REFERENCES public.package_price_versions(version)
);
INSERT INTO public.package_price_current VALUES(true,1);
-- Reserved durable invoices for a future trusted server adapter. No API role may insert.
-- Legacy purchase_requests retain their original day-based terms, untouched.
CREATE TABLE public.package_invoice_snapshots (
 invoice text PRIMARY KEY CHECK(length(invoice) BETWEEN 1 AND 30 AND invoice ~ '^[A-Za-z0-9._-]+$'),
 environment text NOT NULL CHECK(environment='sandbox'),
 request_id text NOT NULL UNIQUE,
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
 version bigint NOT NULL,
 amount_idr bigint NOT NULL,
 currency text NOT NULL DEFAULT 'IDR' CHECK(currency='IDR'),
 duration_unit text NOT NULL DEFAULT 'calendar_year' CHECK(duration_unit='calendar_year'),
 duration_count integer NOT NULL DEFAULT 1 CHECK(duration_count=1),
 workspace_count integer NOT NULL DEFAULT 1 CHECK(workspace_count=1),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(version,amount_idr) REFERENCES public.package_price_versions(version,amount_idr)
);
ALTER TABLE public.package_price_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_price_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_invoice_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.package_price_versions,public.package_price_current,public.package_invoice_snapshots FROM PUBLIC,anon,authenticated;
CREATE TRIGGER package_version_immutable BEFORE UPDATE OR DELETE ON public.package_price_versions FOR EACH ROW EXECUTE FUNCTION public.audit_immutable();
CREATE TRIGGER package_invoice_immutable BEFORE UPDATE OR DELETE ON public.package_invoice_snapshots FOR EACH ROW EXECUTE FUNCTION public.audit_immutable();
CREATE FUNCTION public.admin_package_pricing() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.is_site_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
 RETURN (SELECT jsonb_build_object('version',v.version::text,'amount_idr',v.amount_idr::text,'currency',v.currency,'duration_unit',v.duration_unit,'duration_count',v.duration_count,'workspace_count',v.workspace_count,'created_at',v.created_at)
 FROM public.package_price_current c JOIN public.package_price_versions v ON v.version=c.version WHERE c.id);
END $$;
CREATE FUNCTION public.admin_update_package_price(p_amount_idr text,p_expected_version text,p_reason text,p_confirmed boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old_version bigint; new_version bigint;
BEGIN
 -- Same lock as current hosted role/settings contract; hold authorization through commit.
 -- Do not replay stale role migration definitions to obtain this lock.
 LOCK TABLE public.site_admins IN SHARE ROW EXCLUSIVE MODE;
 IF NOT public.is_site_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
 IF p_confirmed IS DISTINCT FROM true THEN RAISE EXCEPTION 'confirmation required'; END IF;
 IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'reason required (1-500)'; END IF;
 IF p_amount_idr IS NULL OR p_amount_idr !~ '^[1-9][0-9]{0,15}$' OR length(p_amount_idr)>16 THEN RAISE EXCEPTION 'invalid price'; END IF;
 IF p_amount_idr::numeric>9007199254740991 THEN RAISE EXCEPTION 'invalid price'; END IF;
 IF p_expected_version IS NULL OR p_expected_version !~ '^[1-9][0-9]{0,17}$' THEN RAISE EXCEPTION 'invalid version'; END IF;
 SELECT version INTO old_version FROM public.package_price_current WHERE id FOR UPDATE;
 IF old_version IS NULL OR old_version::text<>p_expected_version THEN RAISE EXCEPTION 'version conflict; reload current price'; END IF;
 IF EXISTS(SELECT 1 FROM public.package_price_versions WHERE version=old_version AND amount_idr=p_amount_idr::bigint) THEN RAISE EXCEPTION 'price unchanged'; END IF;
 new_version:=old_version+1;
 INSERT INTO public.package_price_versions(version,amount_idr) VALUES(new_version,p_amount_idr::bigint);
 UPDATE public.package_price_current SET version=new_version WHERE id;
 INSERT INTO public.admin_audit(actor_id,action,details) VALUES(auth.uid(),'settings.updated',jsonb_build_object('kind','package.price','previous_version',old_version::text,'version',new_version::text,'previous_amount_idr',(SELECT amount_idr::text FROM public.package_price_versions WHERE version=old_version),'amount_idr',p_amount_idr,'reason',btrim(p_reason),'duration_unit','calendar_year','duration_count',1,'workspace_count',1,'sales_activation',false));
 RETURN public.admin_package_pricing();
END $$;
REVOKE ALL ON FUNCTION public.admin_package_pricing(),public.admin_update_package_price(text,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_package_pricing(),public.admin_update_package_price(text,text,text,boolean) TO authenticated;
COMMIT;
