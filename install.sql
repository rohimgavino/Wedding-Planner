-- INTEGRATED OFFLINE RELEASE CANDIDATE 20261117 (NON-DEPLOYABLE)
-- Baseline: 766d98dd1f7dc295661f7d1e0b50425230f8e878
-- Section 0 is a synthetic auth/role prelude for the offline harness only.
-- Section 4b (fixture reconstruction) is HARNESS ONLY; everything else is the
-- release SQL set.  Stage 4 is applied exactly once: it is the reviewed
-- settlement-integration body carrying the lock-order fix, and the file is
-- non-idempotent (CREATE TABLE / ALTER FUNCTION ... RENAME).
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
INSERT INTO auth.users VALUES('00000000-0000-0000-0000-000000000001','fixture@example.test','{}'),('00000000-0000-0000-0000-000000000002','partner@example.test','{}');

-- ===== STAGE 1: baseline historical migrations (10 applied, sorted; paid_access_rls excluded) =====

-- >>> 202610120001_secure_foundation.sql sha256=e44da19cbe1f3381aa83ebb2c2d72e3e82e3ffaabfdd8d2d274058433bb8b592
-- ==============================================================================
-- SKEMA DATABASE WEDDING PLANNER PWA (SUPABASE POSTGRESQL) - TAHAP 1 (MVP)
-- ==============================================================================

-- 1. EXTENSIONS
BEGIN;
-- gen_random_uuid and sha256 are PostgreSQL built-ins; no extension search_path dependency.

-- 2. TABEL WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    groom_name VARCHAR(100),
    bride_name VARCHAR(100),
    wedding_date DATE NOT NULL,
    target_budget BIGINT DEFAULT 0,
    target_savings BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL WORKSPACE_MEMBERS (Pairing Pengantin Pria & Wanita)
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'partner' CHECK (role IN ('owner', 'partner')),
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workspace_id, user_id)
);

-- 4. TABEL INVITATIONS (Token Pairing Pasangan)
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    invited_email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'partner',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL SAVINGS_ACCOUNTS (Pos Rekening Tabungan Bersama)
CREATE TABLE IF NOT EXISTS public.savings_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL, -- Contoh: "BCA Bersama", "Bank Jago Wedding"
    target_amount BIGINT DEFAULT 0,
    current_balance BIGINT DEFAULT 0,
    account_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABEL BUDGETS (Plafon Kategori & Realisasi Pengeluaran)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'Venue', 'Katering', 'MUA & Busana', 'Dekorasi', 'Dokumentasi', 'Souvenir', 'Lain-lain'
    title VARCHAR(150) NOT NULL,
    allocated_amount BIGINT DEFAULT 0,
    spent_amount BIGINT DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'dp', 'paid')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABEL TASKS (Checklist & Timeline Persiapan Nikah)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    phase VARCHAR(50) NOT NULL, -- 'H-6 Bulan', 'H-3 Bulan', 'H-1 Bulan', 'H-1 Minggu', 'Hari H', 'Dokumen KUA'
    pic VARCHAR(20) DEFAULT 'both' CHECK (pic IN ('groom', 'bride', 'both')),
    is_completed BOOLEAN DEFAULT false,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABEL GUESTS (Daftar Tamu & RSVP WhatsApp)
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'teman_kantor' CHECK (category IN ('keluarga_pria', 'keluarga_wanita', 'teman_kantor', 'sahabat', 'vip', 'lainnya')),
    pax INT DEFAULT 1,
    phone VARCHAR(30),
    rsvp_status VARCHAR(20) DEFAULT 'uncontacted' CHECK (rsvp_status IN ('uncontacted', 'sent', 'attending', 'declined')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Hash and invalidate legacy bearer tokens; never retain their plaintext.
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS token_hash text;
UPDATE public.invitations SET token_hash=encode(sha256(convert_to(token,'UTF8')),'hex'), status='expired';
ALTER TABLE public.invitations DROP COLUMN token;
ALTER TABLE public.invitations ALTER COLUMN token_hash SET NOT NULL;
ALTER TABLE public.invitations ADD CONSTRAINT invitations_token_hash_unique UNIQUE(token_hash);
ALTER TABLE public.invitations ADD COLUMN accepted_by uuid REFERENCES auth.users(id);
ALTER TABLE public.invitations ADD COLUMN accepted_at timestamptz;
ALTER TABLE public.invitations ADD CONSTRAINT invitations_partner_only CHECK(role='partner');
ALTER TABLE public.workspace_members ALTER COLUMN role SET NOT NULL;
CREATE UNIQUE INDEX workspace_single_owner ON public.workspace_members(workspace_id) WHERE role='owner';
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.workspace_members GROUP BY workspace_id HAVING count(*)>2) THEN
 RAISE EXCEPTION 'existing workspace exceeds capacity; audit memberships before migration';
 END IF;
END $$;
CREATE FUNCTION public.enforce_workspace_capacity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 PERFORM 1 FROM public.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF (SELECT count(*) FROM public.workspace_members WHERE workspace_id=NEW.workspace_id AND id<>NEW.id)>=2 THEN
 RAISE EXCEPTION 'workspace full';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_workspace_capacity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER membership_capacity BEFORE INSERT OR UPDATE OF workspace_id ON public.workspace_members FOR EACH ROW EXECUTE FUNCTION public.enforce_workspace_capacity();

CREATE FUNCTION public.create_partner_invitation(p_workspace_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE uid uuid:=auth.uid(); bearer text;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=uid AND role='owner') THEN RAISE EXCEPTION 'owner required' USING ERRCODE='42501'; END IF;
 IF (SELECT count(*) FROM public.workspace_members WHERE workspace_id=p_workspace_id)>=2 THEN RAISE EXCEPTION 'workspace full'; END IF;
 -- Two cryptographically random UUIDv4s provide 244 random bits; token is returned only once.
 bearer:=replace(gen_random_uuid()::text || gen_random_uuid()::text,'-','');
 UPDATE public.invitations SET status='expired' WHERE workspace_id=p_workspace_id AND status='pending';
 INSERT INTO public.invitations(workspace_id,token_hash,role,status,expires_at) VALUES(p_workspace_id,encode(sha256(convert_to(bearer,'UTF8')),'hex'),'partner','pending',clock_timestamp()+interval '24 hours');
 RETURN bearer;
END $$;
CREATE FUNCTION public.accept_partner_invitation(p_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE uid uuid:=auth.uid(); invite public.invitations%ROWTYPE; ws uuid;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'invalid or expired invitation'; END IF;
 SELECT workspace_id INTO ws FROM public.invitations WHERE token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
 -- Lock order is always workspace then invitation; all issuing/accepting paths serialize on the same workspace.
 PERFORM 1 FROM public.workspaces WHERE id=ws FOR UPDATE;
 SELECT * INTO invite FROM public.invitations WHERE token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') FOR UPDATE;
 IF NOT FOUND OR invite.status<>'pending' OR invite.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'invalid or expired invitation'; END IF;
 IF EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=ws AND user_id=uid) THEN RAISE EXCEPTION 'already a member'; END IF;
 IF (SELECT count(*) FROM public.workspace_members WHERE workspace_id=ws)>=2 THEN RAISE EXCEPTION 'workspace full'; END IF;
 INSERT INTO public.workspace_members(workspace_id,user_id,role) VALUES(ws,uid,'partner');
 UPDATE public.invitations SET status='accepted',accepted_by=uid,accepted_at=clock_timestamp() WHERE id=invite.id;
 RETURN ws;
END $$;
REVOKE ALL ON FUNCTION public.create_partner_invitation(uuid), public.accept_partner_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_partner_invitation(uuid), public.accept_partner_invitation(text) TO authenticated;

-- All private tables are RLS-protected before grants are exposed.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['workspaces','workspace_members','invitations','budgets','tasks','guests','savings_accounts'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.create_workspace(p_title text, p_wedding_date date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE uid uuid := auth.uid(); ws uuid;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_title IS NULL OR length(btrim(p_title)) NOT BETWEEN 1 AND 255 OR p_wedding_date IS NULL THEN RAISE EXCEPTION 'invalid workspace'; END IF;
 INSERT INTO public.workspaces(title,wedding_date) VALUES(btrim(p_title),p_wedding_date) RETURNING id INTO ws;
 INSERT INTO public.workspace_members(workspace_id,user_id,role) VALUES(ws,uid,'owner');
 RETURN ws;
END $$;
REVOKE ALL ON FUNCTION public.create_workspace(text,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_workspace(text,date) TO authenticated;

-- Remove all inherited permissive policies; rebuild an explicit allowlist.
DO $$ DECLARE p record; BEGIN
 FOR p IN SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' AND tablename IN ('workspaces','workspace_members','invitations','budgets','tasks','guests','savings_accounts') LOOP
 EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename);
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=ws_id AND user_id=auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_workspace_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;
REVOKE ALL ON public.workspaces, public.workspace_members, public.invitations, public.budgets, public.tasks, public.guests, public.savings_accounts FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON public.workspaces TO authenticated;
GRANT SELECT ON public.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets, public.tasks, public.guests, public.savings_accounts TO authenticated;
CREATE POLICY workspace_read ON public.workspaces FOR SELECT TO authenticated USING(public.is_workspace_member(id));
CREATE POLICY workspace_update ON public.workspaces FOR UPDATE TO authenticated USING(public.is_workspace_member(id)) WITH CHECK(public.is_workspace_member(id));
CREATE POLICY membership_read ON public.workspace_members FOR SELECT TO authenticated USING(public.is_workspace_member(workspace_id));
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['budgets','tasks','guests','savings_accounts'] LOOP
 EXECUTE format('CREATE POLICY member_crud ON public.%I FOR ALL TO authenticated USING(public.is_workspace_member(workspace_id)) WITH CHECK(public.is_workspace_member(workspace_id))',t);
 END LOOP;
END $$;
COMMIT;

-- >>> 202610140001_workspace_entitlements_savings.sql sha256=debc2b25d460588346b546bb906c6d9f07aac9fe93d7040d81cc9ca0d9a9c8bf
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

-- >>> 202610140002_admin_manual_purchases.sql sha256=3d437038574c0c72f5a0806bcaa2cf1368c22ec2ef9cc35fd0b63808b2208e7b
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

-- >>> 202610140003_reset_planning_content.sql sha256=099ac1c503a043a916d27663fc451a614edf7f7ec8b3e8a49536c3bd032fe5d3
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

-- >>> 202610140004_developer_operator_roles.sql sha256=17d0429770f607b655dc063fffb564bef1a0a7ac0dafef7bdb8ba5a558857ac2
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

-- >>> 202610220002_tier_pricing.sql sha256=fdd24313df71e586538c8e7878b8fa9986ef57b1273d6ad800825616187862a9
-- Tier pricing catalog, immutable price versions, and atomic invoice snapshot reservation.
-- Restored from historical commit e37e8b7 in idempotent form so clean migrations match Production.

CREATE TABLE IF NOT EXISTS public.tier_price_versions (
  package_id text NOT NULL CHECK (package_id IN ('starter', 'premium', 'wedding_pro')),
  version bigint NOT NULL CHECK (version BETWEEN 1 AND 999999999999999999),
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  PRIMARY KEY (package_id, version)
);

CREATE TABLE IF NOT EXISTS public.tier_price_current (
  package_id text PRIMARY KEY,
  version bigint NOT NULL,
  FOREIGN KEY (package_id, version) REFERENCES public.tier_price_versions (package_id, version)
);

INSERT INTO public.tier_price_versions (package_id, version, config)
SELECT p, 1, '{"amount_idr":null,"promo":null}'::jsonb
FROM unnest(ARRAY['starter', 'premium', 'wedding_pro']) p
ON CONFLICT (package_id, version) DO NOTHING;

INSERT INTO public.tier_price_current (package_id, version)
SELECT package_id, version
FROM public.tier_price_versions
WHERE version = 1
ON CONFLICT (package_id) DO NOTHING;

ALTER TABLE public.tier_price_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_price_current ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tier_price_versions, public.tier_price_current FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tier_price_immutable'
      AND tgrelid = 'public.tier_price_versions'::regclass
  ) THEN
    CREATE TRIGGER tier_price_immutable
      BEFORE UPDATE OR DELETE ON public.tier_price_versions
      FOR EACH ROW EXECUTE FUNCTION public.audit_immutable();
  END IF;
END $$;

-- Pure private evaluator; no caller-controlled time accepted by any API RPC.
CREATE OR REPLACE FUNCTION public.tier_price_at(c jsonb, t timestamptz)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'effective_amount_idr',
    CASE
      WHEN c->>'amount_idr' IS NULL THEN NULL
      WHEN c->'promo' <> 'null'::jsonb
        AND t >= (c->'promo'->>'starts_at')::timestamptz
        AND t < (c->'promo'->>'ends_at')::timestamptz
        THEN c->'promo'->>'amount_idr'
      ELSE c->>'amount_idr'
    END,
    'promo_active',
    coalesce(
      c->>'amount_idr' IS NOT NULL
      AND c->'promo' <> 'null'::jsonb
      AND t >= (c->'promo'->>'starts_at')::timestamptz
      AND t < (c->'promo'->>'ends_at')::timestamptz,
      false
    ),
    'price_eligible', c->>'amount_idr' IS NOT NULL,
    'checkout_eligible', false
  )
$$;

REVOKE ALL ON FUNCTION public.tier_price_at(jsonb, timestamptz) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_tier_catalog()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  t timestamptz := statement_timestamp();
BEGIN
  IF NOT public.is_site_admin() THEN
    RAISE EXCEPTION 'admin required';
  END IF;
  RETURN jsonb_build_object(
    'server_now', t,
    'packages', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'package_id', v.package_id,
          'version', v.version::text,
          'config', v.config,
          'created_at', v.created_at
        ) || public.tier_price_at(v.config, t)
        ORDER BY CASE v.package_id WHEN 'starter' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END
      )
      FROM public.tier_price_current c
      JOIN public.tier_price_versions v USING (package_id, version)
    )
  );
END $$;

REVOKE ALL ON FUNCTION public.admin_tier_catalog() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_tier_catalog() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_tier_price(
  p_package_id text,
  p_expected_version text,
  p_config jsonb,
  p_reason text,
  p_confirmed boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  old_version bigint;
  old_config jsonb;
  promo jsonb;
  a text;
  b text;
  starts timestamptz;
  ends timestamptz;
BEGIN
  LOCK TABLE public.site_admins IN SHARE ROW EXCLUSIVE MODE;
  IF NOT public.is_site_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
  IF p_confirmed IS DISTINCT FROM true THEN RAISE EXCEPTION 'confirmation required'; END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'reason required (1-500)'; END IF;
  IF p_package_id IS NULL OR p_package_id NOT IN ('starter', 'premium', 'wedding_pro') THEN RAISE EXCEPTION 'invalid package'; END IF;
  IF p_expected_version IS NULL OR p_expected_version !~ '^[1-9][0-9]{0,17}$' THEN RAISE EXCEPTION 'invalid version'; END IF;
  IF p_config IS NULL OR jsonb_typeof(p_config) <> 'object' THEN RAISE EXCEPTION 'invalid config'; END IF;
  IF NOT p_config ?& ARRAY['amount_idr', 'promo'] OR (p_config - ARRAY['amount_idr', 'promo']) <> '{}'::jsonb THEN
    RAISE EXCEPTION 'invalid config keys';
  END IF;
  a := p_config->>'amount_idr';
  IF p_config->'amount_idr' <> 'null'::jsonb THEN
    IF jsonb_typeof(p_config->'amount_idr') <> 'string' OR a !~ '^[1-9][0-9]{0,15}$' THEN RAISE EXCEPTION 'invalid price'; END IF;
    IF a::numeric > 9007199254740991 THEN RAISE EXCEPTION 'invalid price'; END IF;
  END IF;
  promo := p_config->'promo';
  IF promo <> 'null'::jsonb THEN
    IF jsonb_typeof(promo) <> 'object' OR a IS NULL THEN RAISE EXCEPTION 'invalid promo'; END IF;
    IF NOT promo ?& ARRAY['amount_idr', 'title', 'starts_at', 'ends_at']
      OR (promo - ARRAY['amount_idr', 'title', 'starts_at', 'ends_at']) <> '{}'::jsonb THEN
      RAISE EXCEPTION 'invalid promo keys';
    END IF;
    b := promo->>'amount_idr';
    IF jsonb_typeof(promo->'amount_idr') IS DISTINCT FROM 'string' OR b !~ '^[1-9][0-9]{0,15}$' THEN
      RAISE EXCEPTION 'invalid promo price';
    END IF;
    IF b::numeric >= a::numeric THEN RAISE EXCEPTION 'invalid promo price'; END IF;
    IF jsonb_typeof(promo->'title') IS DISTINCT FROM 'string' OR length(btrim(promo->>'title')) NOT BETWEEN 1 AND 120 THEN
      RAISE EXCEPTION 'invalid promo title';
    END IF;
    IF jsonb_typeof(promo->'starts_at') IS DISTINCT FROM 'string'
      OR jsonb_typeof(promo->'ends_at') IS DISTINCT FROM 'string'
      OR (promo->>'starts_at') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$'
      OR (promo->>'ends_at') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' THEN
      RAISE EXCEPTION 'invalid UTC schedule';
    END IF;
    BEGIN
      starts := (promo->>'starts_at')::timestamptz;
      ends := (promo->>'ends_at')::timestamptz;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'invalid UTC schedule';
    END;
    IF to_char(starts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') IS DISTINCT FROM promo->>'starts_at'
      OR to_char(ends AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') IS DISTINCT FROM promo->>'ends_at' THEN
      RAISE EXCEPTION 'invalid UTC schedule';
    END IF;
    IF starts >= ends THEN RAISE EXCEPTION 'invalid promo interval'; END IF;
  END IF;

  SELECT version INTO old_version FROM public.tier_price_current WHERE package_id = p_package_id FOR UPDATE;
  IF old_version IS NULL OR old_version::text <> p_expected_version THEN RAISE EXCEPTION 'version conflict; reload'; END IF;
  SELECT config INTO old_config FROM public.tier_price_versions WHERE package_id = p_package_id AND version = old_version;
  IF old_config = p_config THEN RAISE EXCEPTION 'price unchanged'; END IF;
  IF old_version = 999999999999999999 THEN RAISE EXCEPTION 'invalid version exhausted'; END IF;

  INSERT INTO public.tier_price_versions (package_id, version, config) VALUES (p_package_id, old_version + 1, p_config);
  UPDATE public.tier_price_current SET version = old_version + 1 WHERE package_id = p_package_id;
  INSERT INTO public.admin_audit (actor_id, action, details)
  VALUES (
    auth.uid(),
    'settings.updated',
    jsonb_build_object(
      'kind', 'package.tier_price',
      'package_id', p_package_id,
      'previous_version', old_version::text,
      'version', (old_version + 1)::text,
      'previous_config', old_config,
      'config', p_config,
      'reason', btrim(p_reason),
      'sales_activation', false
    )
  );
  RETURN public.admin_tier_catalog();
END $$;

REVOKE ALL ON FUNCTION public.admin_update_tier_price(text, text, jsonb, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_tier_price(text, text, jsonb, text, boolean) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tier_version_config'
      AND conrelid = 'public.tier_price_versions'::regclass
  ) THEN
    ALTER TABLE public.tier_price_versions
      ADD CONSTRAINT tier_version_config UNIQUE (package_id, version, config);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tier_invoice_snapshots (
  invoice text PRIMARY KEY CHECK (invoice ~ '^[A-Za-z0-9._-]{1,30}$'),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id),
  package_id text NOT NULL,
  version bigint NOT NULL,
  config jsonb NOT NULL,
  amount_idr bigint NOT NULL CHECK (amount_idr BETWEEN 1 AND 9007199254740991),
  promo_applied boolean NOT NULL,
  reserved_at timestamptz NOT NULL,
  FOREIGN KEY (package_id, version, config) REFERENCES public.tier_price_versions (package_id, version, config),
  CHECK ((public.tier_price_at(config, reserved_at)->>'effective_amount_idr') IS NOT NULL AND amount_idr::text = (public.tier_price_at(config, reserved_at)->>'effective_amount_idr')),
  CHECK (promo_applied = (public.tier_price_at(config, reserved_at)->>'promo_active')::boolean)
);

ALTER TABLE public.tier_invoice_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tier_invoice_snapshots FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'tier_invoice_immutable'
      AND tgrelid = 'public.tier_invoice_snapshots'::regclass
  ) THEN
    CREATE TRIGGER tier_invoice_immutable
      BEFORE UPDATE OR DELETE ON public.tier_invoice_snapshots
      FOR EACH ROW EXECUTE FUNCTION public.audit_immutable();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.reserve_tier_invoice(p_invoice text, p_workspace uuid, p_package text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v bigint;
  c jsonb;
  t timestamptz;
  evaluated jsonb;
  existing public.tier_invoice_snapshots;
BEGIN
  IF p_invoice IS NULL OR p_invoice !~ '^[A-Za-z0-9._-]{1,30}$' OR p_workspace IS NULL OR p_package IS NULL OR p_package NOT IN ('starter', 'premium', 'wedding_pro') THEN
    RAISE EXCEPTION 'invalid reservation';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('tier-invoice:' || p_invoice, 0));
  SELECT * INTO existing FROM public.tier_invoice_snapshots WHERE invoice = p_invoice;
  IF FOUND THEN
    IF existing.workspace_id IS DISTINCT FROM p_workspace OR existing.package_id IS DISTINCT FROM p_package THEN
      RAISE EXCEPTION 'invoice conflict';
    END IF;
    RETURN to_jsonb(existing) || jsonb_build_object('version', existing.version::text, 'amount_idr', existing.amount_idr::text);
  END IF;
  SELECT version INTO v FROM public.tier_price_current WHERE package_id = p_package FOR SHARE;
  SELECT config INTO c FROM public.tier_price_versions WHERE package_id = p_package AND version = v;
  t := clock_timestamp();
  evaluated := public.tier_price_at(c, t);
  IF c IS NULL OR evaluated->>'effective_amount_idr' IS NULL THEN
    RAISE EXCEPTION 'package unpriced';
  END IF;
  INSERT INTO public.tier_invoice_snapshots
  VALUES (p_invoice, p_workspace, p_package, v, c, (evaluated->>'effective_amount_idr')::bigint, (evaluated->>'promo_active')::boolean, t)
  RETURNING * INTO existing;
  RETURN to_jsonb(existing) || jsonb_build_object('version', existing.version::text, 'amount_idr', existing.amount_idr::text);
END $$;

REVOKE ALL ON FUNCTION public.reserve_tier_invoice(text, uuid, text) FROM PUBLIC, anon, authenticated;

-- >>> 202611120001_doku_checkout.sql sha256=be62671cb5df03c12e68d6f648bc70bb6fc23b27ee2eeb34545228f992365f91
-- DOKU Checkout Non-SNAP Production schema (clean, minimal, fail-closed)

CREATE TABLE IF NOT EXISTS public.doku_orders (
  invoice text PRIMARY KEY CHECK (invoice ~ '^[A-Za-z0-9._-]{1,30}$'),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES auth.users(id),
  package_id text NOT NULL CHECK (package_id IN ('starter', 'premium', 'wedding_pro')),
  price_version bigint NOT NULL,
  amount_idr bigint NOT NULL CHECK (amount_idr > 0),
  duration_days integer NOT NULL DEFAULT 365 CHECK (duration_days > 0),
  request_id text NOT NULL UNIQUE CHECK (request_id ~ '^[A-Za-z0-9._-]{1,128}$'),
  status text NOT NULL CHECK (status IN ('pending', 'checkout_ready', 'unknown', 'paid', 'failed', 'expired')),
  checkout_url text,
  payment_channel text,
  doku_http_status integer,
  error_code text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS doku_orders_workspace_created_idx
  ON public.doku_orders (workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.doku_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  invoice_number text NOT NULL,
  payload_hash text NOT NULL,
  channel_id text,
  transaction_status text,
  amount_idr bigint,
  action text NOT NULL CHECK (action IN ('paid', 'ignored', 'unmatched', 'amount_mismatch')),
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doku_webhook_events_invoice_idx
  ON public.doku_webhook_events (invoice_number, received_at DESC);

ALTER TABLE public.doku_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doku_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.doku_orders FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.doku_webhook_events FROM PUBLIC, anon, authenticated;

-- Public & authenticated catalog read (price authority always comes from DB)
CREATE OR REPLACE FUNCTION public.public_tier_catalog()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := statement_timestamp();
  v_sales boolean := false;
  v_email text := null;
  v_packages jsonb := '[]'::jsonb;
BEGIN
  SELECT COALESCE(r.sales_activation, false) INTO v_sales
  FROM public.release_controls r
  WHERE r.id = true
  LIMIT 1;

  SELECT s.support_email INTO v_email
  FROM public.site_settings s
  WHERE s.id = true
  LIMIT 1;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'package_id', v.package_id,
        'version', v.version::text,
        'duration_days', 365,
        'base_amount_idr', v.config->>'amount_idr'
      ) || public.tier_price_at(v.config, v_now)
      ORDER BY CASE v.package_id WHEN 'starter' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END
    ),
    '[]'::jsonb
  )
  INTO v_packages
  FROM public.tier_price_current c
  JOIN public.tier_price_versions v USING (package_id, version);

  RETURN jsonb_build_object(
    'sales_enabled', v_sales,
    'support_email', v_email,
    'server_now', v_now,
    'packages', v_packages
  );
END $$;

REVOKE ALL ON FUNCTION public.public_tier_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_tier_catalog() TO anon, authenticated, service_role;

-- Reserve or reuse an order before dispatching DOKU Checkout v1
CREATE OR REPLACE FUNCTION public.doku_reserve_order(
  p_workspace_id uuid,
  p_payer_id uuid,
  p_package_id text,
  p_invoice text,
  p_request_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sales boolean := false;
  v_existing public.doku_orders;
  v_snap jsonb;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_workspace_id IS NULL OR p_payer_id IS NULL THEN
    RAISE EXCEPTION 'workspace_and_payer_required';
  END IF;
  IF p_package_id IS NULL OR p_package_id NOT IN ('starter', 'premium', 'wedding_pro') THEN
    RAISE EXCEPTION 'invalid_package';
  END IF;
  IF p_invoice IS NULL OR p_invoice !~ '^[A-Za-z0-9._-]{1,30}$' THEN
    RAISE EXCEPTION 'invalid_invoice';
  END IF;
  IF p_request_id IS NULL OR p_request_id !~ '^[A-Za-z0-9._-]{1,128}$' THEN
    RAISE EXCEPTION 'invalid_request_id';
  END IF;

  SELECT COALESCE(r.sales_activation, false) INTO v_sales
  FROM public.release_controls r
  WHERE r.id = true
  LIMIT 1;

  IF NOT v_sales THEN
    RAISE EXCEPTION 'sales_disabled';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members m
    WHERE m.workspace_id = p_workspace_id AND m.user_id = p_payer_id
  ) THEN
    RAISE EXCEPTION 'workspace_membership_required';
  END IF;

  -- Serialize order reservation per workspace to prevent double-click races
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('doku-ws:' || p_workspace_id::text, 0)
  );

  IF EXISTS (
    SELECT 1 FROM public.workspace_entitlements e
    WHERE e.workspace_id = p_workspace_id
      AND e.feature = p_package_id
      AND e.revoked_at IS NULL
      AND e.expires_at > v_now
  ) THEN
    RETURN jsonb_build_object('outcome', 'already_active');
  END IF;

  -- Quarantine any unresolved ambiguous dispatch so user never double-pays
  SELECT * INTO v_existing
  FROM public.doku_orders o
  WHERE o.workspace_id = p_workspace_id AND o.status = 'unknown'
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'outcome', 'unresolved_unknown',
      'order', to_jsonb(v_existing)
    );
  END IF;

  -- Reuse active unexpired checkout URL for the same workspace & package
  SELECT * INTO v_existing
  FROM public.doku_orders o
  WHERE o.workspace_id = p_workspace_id
    AND o.package_id = p_package_id
    AND o.status = 'checkout_ready'
    AND o.checkout_url IS NOT NULL
    AND (o.expires_at IS NULL OR o.expires_at > v_now)
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'outcome', 'existing',
      'order', to_jsonb(v_existing)
    );
  END IF;

  -- Expire older pending/checkout_ready rows for this workspace if stale
  UPDATE public.doku_orders
  SET status = 'expired', updated_at = v_now
  WHERE workspace_id = p_workspace_id
    AND status IN ('pending', 'checkout_ready')
    AND expires_at IS NOT NULL
    AND expires_at <= v_now;

  -- Authoritative server-side price snapshot
  v_snap := public.reserve_tier_invoice(p_invoice, p_workspace_id, p_package_id);

  INSERT INTO public.doku_orders (
    invoice, workspace_id, payer_id, package_id,
    price_version, amount_idr, duration_days,
    request_id, status, expires_at, created_at, updated_at
  )
  VALUES (
    p_invoice,
    p_workspace_id,
    p_payer_id,
    p_package_id,
    (v_snap->>'version')::bigint,
    (v_snap->>'amount_idr')::bigint,
    365,
    p_request_id,
    'pending',
    v_now + interval '60 minutes',
    v_now,
    v_now
  )
  RETURNING * INTO v_existing;

  RETURN jsonb_build_object(
    'outcome', 'reserved',
    'order', to_jsonb(v_existing)
  );
END $$;

REVOKE ALL ON FUNCTION public.doku_reserve_order(uuid, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.doku_reserve_order(uuid, uuid, text, text, text) TO service_role;

-- Record DOKU Checkout initiation result (never downgrade paid or unknown)
CREATE OR REPLACE FUNCTION public.doku_set_order_result(
  p_invoice text,
  p_status text,
  p_checkout_url text DEFAULT NULL,
  p_http_status integer DEFAULT NULL,
  p_error_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ord public.doku_orders;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_status NOT IN ('checkout_ready', 'unknown', 'failed') THEN
    RAISE EXCEPTION 'invalid_target_status';
  END IF;

  SELECT * INTO v_ord
  FROM public.doku_orders
  WHERE invoice = p_invoice
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_ord.status = 'paid' THEN
    RETURN jsonb_build_object('outcome', 'already_paid', 'order', to_jsonb(v_ord));
  END IF;

  IF v_ord.status = 'unknown' THEN
    RETURN jsonb_build_object('outcome', 'already_unknown', 'order', to_jsonb(v_ord));
  END IF;

  IF p_status = 'checkout_ready' THEN
    IF p_checkout_url IS NULL OR p_checkout_url !~ '^https://(jokul|checkout|pay|staging|sandbox)\.doku\.com/checkout(?:-link(?:-v2)?|/link)/[A-Za-z0-9_-]+$' THEN
      RAISE EXCEPTION 'invalid_checkout_url';
    END IF;
    UPDATE public.doku_orders
    SET status = 'checkout_ready',
        checkout_url = p_checkout_url,
        doku_http_status = p_http_status,
        error_code = NULL,
        updated_at = v_now
    WHERE invoice = p_invoice
    RETURNING * INTO v_ord;
  ELSIF p_status = 'unknown' THEN
    UPDATE public.doku_orders
    SET status = 'unknown',
        doku_http_status = p_http_status,
        error_code = left(COALESCE(p_error_code, 'UNKNOWN'), 64),
        updated_at = v_now
    WHERE invoice = p_invoice
    RETURNING * INTO v_ord;
  ELSE
    UPDATE public.doku_orders
    SET status = 'failed',
        doku_http_status = p_http_status,
        error_code = left(COALESCE(p_error_code, 'FAILED'), 64),
        updated_at = v_now
    WHERE invoice = p_invoice
    RETURNING * INTO v_ord;
  END IF;

  RETURN jsonb_build_object('outcome', v_ord.status, 'order', to_jsonb(v_ord));
END $$;

REVOKE ALL ON FUNCTION public.doku_set_order_result(text, text, text, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.doku_set_order_result(text, text, text, integer, text) TO service_role;

-- Idempotent settlement from verified DOKU HTTP Notification webhook
CREATE OR REPLACE FUNCTION public.doku_apply_notification(
  p_event_key text,
  p_payload_hash text,
  p_invoice text,
  p_amount_idr bigint,
  p_channel_id text,
  p_tx_status text,
  p_tx_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing_ev public.doku_webhook_events;
  v_ord public.doku_orders;
  v_now timestamptz := clock_timestamp();
  v_exp timestamptz;
BEGIN
  IF p_event_key IS NULL OR p_payload_hash IS NULL OR p_invoice IS NULL THEN
    RAISE EXCEPTION 'invalid_notification_args';
  END IF;

  SELECT * INTO v_existing_ev
  FROM public.doku_webhook_events
  WHERE event_key = p_event_key;

  IF FOUND THEN
    IF v_existing_ev.payload_hash = p_payload_hash THEN
      RETURN jsonb_build_object('outcome', 'duplicate');
    END IF;
    RETURN jsonb_build_object('outcome', 'conflict');
  END IF;

  SELECT * INTO v_ord
  FROM public.doku_orders
  WHERE invoice = p_invoice
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.doku_webhook_events (
      event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
    ) VALUES (
      p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'unmatched', v_now
    );
    RETURN jsonb_build_object('outcome', 'unmatched');
  END IF;

  IF p_tx_status = 'SUCCESS' AND (p_tx_type IS NULL OR p_tx_type = 'SALE') THEN
    IF p_amount_idr IS DISTINCT FROM v_ord.amount_idr THEN
      INSERT INTO public.doku_webhook_events (
        event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
      ) VALUES (
        p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'amount_mismatch', v_now
      );
      RETURN jsonb_build_object('outcome', 'amount_mismatch');
    END IF;

    IF v_ord.status <> 'paid' THEN
      UPDATE public.doku_orders
      SET status = 'paid',
          paid_at = v_now,
          payment_channel = COALESCE(NULLIF(p_channel_id, ''), payment_channel),
          updated_at = v_now
      WHERE invoice = p_invoice
      RETURNING * INTO v_ord;

      v_exp := v_now + make_interval(days => v_ord.duration_days);

      -- Activate both 'core' (required by existing RLS/dashboard) and specific package tier
      INSERT INTO public.workspace_entitlements (
        workspace_id, feature, payment_provider, payment_reference, verified_by, verified_at, expires_at, revoked_at
      )
      VALUES
        (v_ord.workspace_id, 'core', 'doku', v_ord.invoice, 'doku-webhook', v_now, v_exp, NULL),
        (v_ord.workspace_id, v_ord.package_id, 'doku', v_ord.invoice, 'doku-webhook', v_now, v_exp, NULL)
      ON CONFLICT (workspace_id, feature) DO UPDATE
      SET payment_provider = CASE
            WHEN public.workspace_entitlements.expires_at > v_now + interval '400 days' THEN public.workspace_entitlements.payment_provider
            ELSE 'doku'
          END,
          payment_reference = CASE
            WHEN public.workspace_entitlements.expires_at > v_now + interval '400 days' THEN public.workspace_entitlements.payment_reference
            ELSE EXCLUDED.payment_reference
          END,
          verified_by = 'doku-webhook',
          verified_at = v_now,
          expires_at = (CASE
            WHEN public.workspace_entitlements.revoked_at IS NULL THEN GREATEST(COALESCE(public.workspace_entitlements.expires_at, v_now), v_now)
            ELSE v_now
          END) + make_interval(days => v_ord.duration_days),
          revoked_at = NULL;

      INSERT INTO public.admin_audit (actor_id, action, subject_id, details)
      VALUES (
        v_ord.payer_id,
        'doku.payment_verified',
        v_ord.workspace_id,
        jsonb_build_object(
          'invoice', v_ord.invoice,
          'package_id', v_ord.package_id,
          'amount_idr', v_ord.amount_idr,
          'channel_id', p_channel_id,
          'duration_days', v_ord.duration_days
        )
      );
    END IF;

    INSERT INTO public.doku_webhook_events (
      event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
    ) VALUES (
      p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'paid', v_now
    );

    RETURN jsonb_build_object(
      'outcome', 'paid',
      'workspace_id', v_ord.workspace_id,
      'package_id', v_ord.package_id,
      'invoice', v_ord.invoice
    );
  END IF;

  IF p_tx_status = 'EXPIRED' AND v_ord.status IN ('pending', 'checkout_ready') THEN
    UPDATE public.doku_orders
    SET status = 'expired', updated_at = v_now
    WHERE invoice = p_invoice;
  END IF;

  INSERT INTO public.doku_webhook_events (
    event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
  ) VALUES (
    p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'ignored', v_now
  );

  RETURN jsonb_build_object('outcome', 'ignored');
END $$;

REVOKE ALL ON FUNCTION public.doku_apply_notification(text, text, text, bigint, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.doku_apply_notification(text, text, text, bigint, text, text, text) TO service_role;

-- Read billing status & order history for a workspace (authenticated member or service_role)
CREATE OR REPLACE FUNCTION public.doku_workspace_orders(p_workspace_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NOT NULL AND NOT public.is_workspace_member(p_workspace_id) THEN
    RAISE EXCEPTION 'workspace_membership_required' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'orders', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'invoice', o.invoice,
        'package_id', o.package_id,
        'amount_idr', o.amount_idr,
        'duration_days', o.duration_days,
        'status', o.status,
        'checkout_url', o.checkout_url,
        'payment_channel', o.payment_channel,
        'expires_at', o.expires_at,
        'created_at', o.created_at,
        'paid_at', o.paid_at
      ) ORDER BY o.created_at DESC)
      FROM (
        SELECT * FROM public.doku_orders
        WHERE workspace_id = p_workspace_id
        ORDER BY created_at DESC
        LIMIT 20
      ) o
    ), '[]'::jsonb),
    'entitlements', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'feature', e.feature,
        'payment_provider', e.payment_provider,
        'payment_reference', e.payment_reference,
        'expires_at', e.expires_at,
        'revoked_at', e.revoked_at
      ) ORDER BY e.feature)
      FROM public.workspace_entitlements e
      WHERE e.workspace_id = p_workspace_id
    ), '[]'::jsonb)
  );
END $$;

REVOKE ALL ON FUNCTION public.doku_workspace_orders(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.doku_workspace_orders(uuid) TO authenticated, service_role;

-- Admin read recent DOKU orders
CREATE OR REPLACE FUNCTION public.admin_doku_orders()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_site_admin() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(o) ORDER BY o.created_at DESC)
    FROM (
      SELECT invoice, workspace_id, payer_id, package_id, amount_idr, duration_days,
             status, payment_channel, doku_http_status, error_code, created_at, paid_at
      FROM public.doku_orders
      ORDER BY created_at DESC
      LIMIT 100
    ) o
  ), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.admin_doku_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_doku_orders() TO authenticated;

-- Admin toggle sales activation & support email without requiring Lynk.id URL
CREATE OR REPLACE FUNCTION public.admin_set_sales_activation(
  p_enabled boolean,
  p_support_email text,
  p_reason text,
  p_confirmed boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text := NULLIF(btrim(COALESCE(p_support_email, '')), '');
BEGIN
  IF NOT public.is_site_admin() THEN
    RAISE EXCEPTION 'admin_required' USING ERRCODE = '42501';
  END IF;
  IF p_confirmed IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'confirmation_required';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;
  IF v_email IS NOT NULL AND (length(v_email) > 254 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RAISE EXCEPTION 'invalid_support_email';
  END IF;

  UPDATE public.release_controls
  SET sales_activation = COALESCE(p_enabled, false)
  WHERE id = true;

  IF v_email IS NOT NULL THEN
    UPDATE public.site_settings
    SET support_email = v_email
    WHERE id = true;
  END IF;

  INSERT INTO public.admin_audit (actor_id, action, details)
  VALUES (
    v_actor,
    'sales.activation_updated',
    jsonb_build_object(
      'sales_enabled', COALESCE(p_enabled, false),
      'support_email', v_email,
      'reason', btrim(p_reason)
    )
  );

  RETURN public.public_tier_catalog();
END $$;

REVOKE ALL ON FUNCTION public.admin_set_sales_activation(boolean, text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_sales_activation(boolean, text, text, boolean) TO authenticated;

-- >>> 202611120002_doku_checkout_hardening.sql sha256=910ac17fdc4fbbec61e6418dc5ea9489ae2563b89993d606ab1c9c02bf4aa3b9
-- DOKU Checkout hardening: atomic webhook deduplication, non-SUCCESS resolution for unknown/pending orders,
-- safe admin resolution for stuck unknown orders, core+package entitlement guard, and operator audit visibility.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_entitlements_feature_check') THEN
    ALTER TABLE public.workspace_entitlements DROP CONSTRAINT workspace_entitlements_feature_check;
  END IF;
  ALTER TABLE public.workspace_entitlements
    ADD CONSTRAINT workspace_entitlements_feature_check
    CHECK (feature IN ('core', 'lamaran', 'honeymoon', 'starter', 'premium', 'wedding_pro'));

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_entitlements_payment_provider_check') THEN
    ALTER TABLE public.workspace_entitlements DROP CONSTRAINT workspace_entitlements_payment_provider_check;
  END IF;
  ALTER TABLE public.workspace_entitlements
    ADD CONSTRAINT workspace_entitlements_payment_provider_check
    CHECK (payment_provider IN ('lynk.id', 'doku', 'doku_sandbox'));
END $$;

CREATE OR REPLACE FUNCTION public.doku_reserve_order(
  p_workspace_id uuid,
  p_payer_id uuid,
  p_package_id text,
  p_invoice text,
  p_request_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_sales boolean := false;
  v_existing public.doku_orders;
  v_snap jsonb;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_workspace_id IS NULL OR p_payer_id IS NULL THEN
    RAISE EXCEPTION 'workspace_and_payer_required';
  END IF;
  IF p_package_id IS NULL OR p_package_id NOT IN ('starter', 'premium', 'wedding_pro') THEN
    RAISE EXCEPTION 'invalid_package';
  END IF;
  IF p_invoice IS NULL OR p_invoice !~ '^[A-Za-z0-9._-]{1,30}$' THEN
    RAISE EXCEPTION 'invalid_invoice';
  END IF;
  IF p_request_id IS NULL OR p_request_id !~ '^[A-Za-z0-9._-]{1,128}$' THEN
    RAISE EXCEPTION 'invalid_request_id';
  END IF;

  SELECT COALESCE(r.sales_activation, false) INTO v_sales
  FROM public.release_controls r
  WHERE r.id = true
  LIMIT 1;

  IF NOT v_sales THEN
    RAISE EXCEPTION 'sales_disabled';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members m
    WHERE m.workspace_id = p_workspace_id AND m.user_id = p_payer_id
  ) THEN
    RAISE EXCEPTION 'workspace_membership_required';
  END IF;

  -- Serialize order reservation per workspace to prevent double-click races
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('doku-ws:' || p_workspace_id::text, 0)
  );

  IF EXISTS (
    SELECT 1 FROM public.workspace_entitlements e
    WHERE e.workspace_id = p_workspace_id
      AND e.feature IN ('core', p_package_id)
      AND e.revoked_at IS NULL
      AND (e.expires_at IS NULL OR e.expires_at > v_now)
  ) THEN
    RETURN jsonb_build_object('outcome', 'already_active');
  END IF;

  -- Quarantine any unresolved ambiguous dispatch so user never double-pays
  SELECT * INTO v_existing
  FROM public.doku_orders o
  WHERE o.workspace_id = p_workspace_id AND o.status = 'unknown'
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'outcome', 'unresolved_unknown',
      'order', to_jsonb(v_existing)
    );
  END IF;

  -- Reuse active unexpired checkout URL for the same workspace & package
  SELECT * INTO v_existing
  FROM public.doku_orders o
  WHERE o.workspace_id = p_workspace_id
    AND o.package_id = p_package_id
    AND o.status = 'checkout_ready'
    AND o.checkout_url IS NOT NULL
    AND (o.expires_at IS NULL OR o.expires_at > v_now)
  ORDER BY o.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'outcome', 'existing',
      'order', to_jsonb(v_existing)
    );
  END IF;

  -- Expire older pending/checkout_ready rows for this workspace if stale
  UPDATE public.doku_orders
  SET status = 'expired', updated_at = v_now
  WHERE workspace_id = p_workspace_id
    AND status IN ('pending', 'checkout_ready')
    AND expires_at IS NOT NULL
    AND expires_at <= v_now;

  -- Authoritative server-side price snapshot
  v_snap := public.reserve_tier_invoice(p_invoice, p_workspace_id, p_package_id);

  INSERT INTO public.doku_orders (
    invoice, workspace_id, payer_id, package_id,
    price_version, amount_idr, duration_days,
    request_id, status, expires_at, created_at, updated_at
  )
  VALUES (
    p_invoice,
    p_workspace_id,
    p_payer_id,
    p_package_id,
    (v_snap->>'version')::bigint,
    (v_snap->>'amount_idr')::bigint,
    365,
    p_request_id,
    'pending',
    v_now + interval '60 minutes',
    v_now,
    v_now
  )
  RETURNING * INTO v_existing;

  RETURN jsonb_build_object(
    'outcome', 'reserved',
    'order', to_jsonb(v_existing)
  );
END $$;

REVOKE ALL ON FUNCTION public.doku_reserve_order(uuid, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.doku_reserve_order(uuid, uuid, text, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.doku_apply_notification(
  p_event_key text,
  p_payload_hash text,
  p_invoice text,
  p_amount_idr bigint,
  p_channel_id text,
  p_tx_status text,
  p_tx_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing_ev public.doku_webhook_events;
  v_ord public.doku_orders;
  v_now timestamptz := clock_timestamp();
  v_exp timestamptz;
  v_norm_status text := upper(btrim(coalesce(p_tx_status, '')));
  v_norm_type text := upper(btrim(coalesce(p_tx_type, 'SALE')));
BEGIN
  IF p_event_key IS NULL OR p_payload_hash IS NULL OR p_invoice IS NULL THEN
    RAISE EXCEPTION 'invalid_notification_args';
  END IF;

  -- Serialize concurrent identical webhook deliveries by event_key before checking/inserting
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('doku-ev:' || p_event_key, 0)
  );

  SELECT * INTO v_existing_ev
  FROM public.doku_webhook_events
  WHERE event_key = p_event_key;

  IF FOUND THEN
    IF v_existing_ev.payload_hash = p_payload_hash THEN
      RETURN jsonb_build_object('outcome', 'duplicate');
    END IF;
    RETURN jsonb_build_object('outcome', 'conflict');
  END IF;

  SELECT * INTO v_ord
  FROM public.doku_orders
  WHERE invoice = p_invoice
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.doku_webhook_events (
      event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
    ) VALUES (
      p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'unmatched', v_now
    )
    ON CONFLICT (event_key) DO NOTHING;
    RETURN jsonb_build_object('outcome', 'unmatched');
  END IF;

  IF v_norm_status = 'SUCCESS' AND (p_tx_type IS NULL OR v_norm_type IN ('SALE', 'PAYMENT', '')) THEN
    IF p_amount_idr IS DISTINCT FROM v_ord.amount_idr THEN
      INSERT INTO public.doku_webhook_events (
        event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
      ) VALUES (
        p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'amount_mismatch', v_now
      )
      ON CONFLICT (event_key) DO NOTHING;
      RETURN jsonb_build_object('outcome', 'amount_mismatch');
    END IF;

    IF v_ord.status <> 'paid' THEN
      UPDATE public.doku_orders
      SET status = 'paid',
          paid_at = v_now,
          payment_channel = COALESCE(NULLIF(p_channel_id, ''), payment_channel),
          error_code = NULL,
          updated_at = v_now
      WHERE invoice = p_invoice
      RETURNING * INTO v_ord;

      v_exp := v_now + make_interval(days => v_ord.duration_days);

      -- Activate both 'core' (required by existing RLS/dashboard) and specific package tier
      INSERT INTO public.workspace_entitlements (
        workspace_id, feature, payment_provider, payment_reference, verified_by, verified_at, expires_at, revoked_at
      )
      VALUES
        (v_ord.workspace_id, 'core', 'doku', v_ord.invoice, 'doku-webhook', v_now, v_exp, NULL),
        (v_ord.workspace_id, v_ord.package_id, 'doku', v_ord.invoice, 'doku-webhook', v_now, v_exp, NULL)
      ON CONFLICT (workspace_id, feature) DO UPDATE
      SET payment_provider = CASE
            WHEN public.workspace_entitlements.expires_at > v_now + interval '400 days' THEN public.workspace_entitlements.payment_provider
            ELSE 'doku'
          END,
          payment_reference = CASE
            WHEN public.workspace_entitlements.expires_at > v_now + interval '400 days' THEN public.workspace_entitlements.payment_reference
            ELSE EXCLUDED.payment_reference
          END,
          verified_by = 'doku-webhook',
          verified_at = v_now,
          expires_at = (CASE
            WHEN public.workspace_entitlements.revoked_at IS NULL THEN GREATEST(COALESCE(public.workspace_entitlements.expires_at, v_now), v_now)
            ELSE v_now
          END) + make_interval(days => v_ord.duration_days),
          revoked_at = NULL;

      INSERT INTO public.admin_audit (actor_id, action, subject_id, details)
      VALUES (
        v_ord.payer_id,
        'doku.payment_verified',
        v_ord.workspace_id,
        jsonb_build_object(
          'invoice', v_ord.invoice,
          'package_id', v_ord.package_id,
          'amount_idr', v_ord.amount_idr,
          'channel_id', p_channel_id,
          'duration_days', v_ord.duration_days
        )
      );
    END IF;

    INSERT INTO public.doku_webhook_events (
      event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
    ) VALUES (
      p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'paid', v_now
    )
    ON CONFLICT (event_key) DO NOTHING;

    RETURN jsonb_build_object(
      'outcome', 'paid',
      'workspace_id', v_ord.workspace_id,
      'package_id', v_ord.package_id,
      'invoice', v_ord.invoice
    );
  END IF;

  -- Terminal failure/expiry webhooks transition pending/checkout_ready/unknown out of deadlock
  IF p_amount_idr IS NOT DISTINCT FROM v_ord.amount_idr
     AND v_ord.status IN ('pending', 'checkout_ready', 'unknown') THEN
    IF v_norm_status = 'EXPIRED' THEN
      UPDATE public.doku_orders
      SET status = 'expired', updated_at = v_now
      WHERE invoice = p_invoice;
    ELSIF v_norm_status IN ('FAILED', 'CANCELLED', 'CANCELED') THEN
      UPDATE public.doku_orders
      SET status = 'failed',
          error_code = left('DOKU_WEBHOOK_' || v_norm_status, 64),
          updated_at = v_now
      WHERE invoice = p_invoice;
    END IF;
  END IF;

  INSERT INTO public.doku_webhook_events (
    event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
  ) VALUES (
    p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'ignored', v_now
  )
  ON CONFLICT (event_key) DO NOTHING;

  RETURN jsonb_build_object('outcome', 'ignored');
END $$;

REVOKE ALL ON FUNCTION public.doku_apply_notification(text, text, text, bigint, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.doku_apply_notification(text, text, text, bigint, text, text, text) TO service_role;

-- Audited admin resolution for stuck unknown/pending orders (never grants 'paid' unilaterally)
CREATE OR REPLACE FUNCTION public.admin_resolve_doku_order(
  p_invoice text,
  p_target_status text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_ord public.doku_orders;
BEGIN
  IF NOT public.is_site_admin() THEN
    RAISE EXCEPTION 'admin required' USING ERRCODE = '42501';
  END IF;
  IF p_target_status IS NULL OR p_target_status NOT IN ('failed', 'expired') THEN
    RAISE EXCEPTION 'invalid target status';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 8 AND 240 THEN
    RAISE EXCEPTION 'reason must be 8..240 chars';
  END IF;

  SELECT * INTO v_ord
  FROM public.doku_orders
  WHERE invoice = p_invoice
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;
  IF v_ord.status NOT IN ('unknown', 'pending', 'checkout_ready') THEN
    RAISE EXCEPTION 'order_not_resolvable';
  END IF;

  UPDATE public.doku_orders
  SET status = p_target_status,
      error_code = 'ADMIN_RESOLVED_' || upper(p_target_status),
      updated_at = v_now
  WHERE invoice = v_ord.invoice
  RETURNING * INTO v_ord;

  INSERT INTO public.admin_audit (actor_id, action, subject_id, details)
  VALUES (
    auth.uid(),
    'doku.order_resolved',
    v_ord.workspace_id,
    jsonb_build_object(
      'invoice', v_ord.invoice,
      'target_status', p_target_status,
      'reason', btrim(p_reason)
    )
  );

  RETURN jsonb_build_object('outcome', 'resolved', 'order', to_jsonb(v_ord));
END $$;

REVOKE ALL ON FUNCTION public.admin_resolve_doku_order(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_doku_order(text, text, text) TO authenticated;

DROP POLICY IF EXISTS audit_read ON public.admin_audit;
CREATE POLICY audit_read ON public.admin_audit FOR SELECT TO authenticated USING (
  public.site_role() = 'developer'
  OR (
    public.site_role() = 'operator'
    AND action IN (
      'settings.updated',
      'purchase.requested',
      'purchase.verified',
      'purchase.rejected',
      'sales.activation_updated',
      'doku.order_resolved'
    )
  )
);

-- >>> 202611140002_editable_starter.sql sha256=820cdffe6984a7058b7252c484c970d65cb5beb8317e4335d0b3cdfdb0b5bc9f
-- NEW CANDIDATE ONLY. Not installed, not historical migration replay.
-- Requires public workspaces/workspace_members/budgets/tasks from reviewed schema.
BEGIN;
CREATE SCHEMA editable_starter_private;
REVOKE ALL ON SCHEMA editable_starter_private FROM PUBLIC, anon, authenticated;
CREATE TABLE editable_starter_private.receipts (
 workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
 applied_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 applied_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE editable_starter_private.receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON editable_starter_private.receipts FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.apply_editable_starter_v1(p_workspace_id uuid, p_confirmation text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE uid uuid := auth.uid();
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_confirmation IS DISTINCT FROM 'TAMBAH TEMPLATE' THEN RAISE EXCEPTION 'confirmation required' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=uid AND role='owner' FOR UPDATE) THEN
  RAISE EXCEPTION 'owner required' USING ERRCODE='42501';
 END IF;
 IF EXISTS(SELECT 1 FROM editable_starter_private.receipts WHERE workspace_id=p_workspace_id) THEN
  RETURN jsonb_build_object('already_applied',true);
 END IF;
 INSERT INTO public.budgets(workspace_id,category,title,allocated_amount,spent_amount,payment_status,notes)
 SELECT p_workspace_id,category,category,0,0,'unpaid','Template awal; isi alokasi sesuai kesepakatan dan penawaran nyata. Belum ada pengeluaran.'
 FROM (VALUES ('Katering'),('Venue'),('Dekorasi'),('MUA & Busana'),('Dokumentasi'),('Undangan & Souvenir'),('Mahar & Seserahan'),('Dana Darurat')) v(category);
 INSERT INTO public.tasks(workspace_id,title,phase,pic,is_completed,due_date,notes)
 SELECT p_workspace_id,title,phase,'both',false,NULL,'Template awal; sesuaikan tahap dan kebutuhan bersama pasangan. Tidak menetapkan tanggal atau persyaratan resmi.'
 FROM (VALUES
 ('Sepakati prioritas dan batas anggaran','H-6 Bulan'),
 ('Susun kebutuhan dan kapasitas acara','H-6 Bulan'),
 ('Periksa persyaratan pencatatan pada instansi resmi','Dokumen KUA'),
 ('Bandingkan penawaran dan kontrak vendor','H-3 Bulan'),
 ('Susun daftar tamu nyata bersama keluarga','H-3 Bulan'),
 ('Siapkan undangan dan kebutuhan acara','H-1 Bulan'),
 ('Susun rundown dan pembagian PIC','H-1 Bulan'),
 ('Konfirmasi kesiapan keluarga dan vendor','H-1 Minggu')) v(title,phase);
 INSERT INTO editable_starter_private.receipts(workspace_id,applied_by) VALUES(p_workspace_id,uid);
 RETURN jsonb_build_object('already_applied',false);
END $$;
REVOKE ALL ON FUNCTION public.apply_editable_starter_v1(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.apply_editable_starter_v1(uuid,text) TO authenticated;
COMMIT;

-- >>> 202611150001_doku_failed_nonfinal.sql sha256=d67c71337fdf1acc63686962f1073a6d97c968a25fe84f7d9d8c008b851cfec7
-- OFFLINE REVIEW CANDIDATE ONLY: additive replacement; not an applied migration.
-- No historical row reclassification: failed rows need operator/provider review.
-- No pricing, duration, reservation, or entitlement-upsert changes.

BEGIN;

CREATE OR REPLACE FUNCTION public.doku_apply_notification(
  p_event_key text,
  p_payload_hash text,
  p_invoice text,
  p_amount_idr bigint,
  p_channel_id text,
  p_tx_status text,
  p_tx_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing_ev public.doku_webhook_events;
  v_ord public.doku_orders;
  v_now timestamptz := clock_timestamp();
  v_exp timestamptz;
  v_norm_status text := upper(btrim(coalesce(p_tx_status, '')));
  v_norm_type text := upper(btrim(coalesce(p_tx_type, 'SALE')));
BEGIN
  IF p_event_key IS NULL OR p_payload_hash IS NULL OR p_invoice IS NULL THEN
    RAISE EXCEPTION 'invalid_notification_args';
  END IF;

  -- Serialize concurrent identical webhook deliveries by event_key before checking/inserting
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('doku-ev:' || p_event_key, 0)
  );

  SELECT * INTO v_existing_ev
  FROM public.doku_webhook_events
  WHERE event_key = p_event_key;

  IF FOUND THEN
    IF v_existing_ev.payload_hash = p_payload_hash THEN
      RETURN jsonb_build_object('outcome', 'duplicate');
    END IF;
    RETURN jsonb_build_object('outcome', 'conflict');
  END IF;

  SELECT * INTO v_ord
  FROM public.doku_orders
  WHERE invoice = p_invoice
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.doku_webhook_events (
      event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
    ) VALUES (
      p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'unmatched', v_now
    )
    ON CONFLICT (event_key) DO NOTHING;
    RETURN jsonb_build_object('outcome', 'unmatched');
  END IF;

  IF v_norm_status = 'SUCCESS' AND (p_tx_type IS NULL OR v_norm_type IN ('SALE', 'PAYMENT', '')) THEN
    IF p_amount_idr IS DISTINCT FROM v_ord.amount_idr THEN
      INSERT INTO public.doku_webhook_events (
        event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
      ) VALUES (
        p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'amount_mismatch', v_now
      )
      ON CONFLICT (event_key) DO NOTHING;
      RETURN jsonb_build_object('outcome', 'amount_mismatch');
    END IF;

    IF v_ord.status <> 'paid' THEN
      UPDATE public.doku_orders
      SET status = 'paid',
          paid_at = v_now,
          payment_channel = COALESCE(NULLIF(p_channel_id, ''), payment_channel),
          error_code = NULL,
          updated_at = v_now
      WHERE invoice = p_invoice
      RETURNING * INTO v_ord;

      v_exp := v_now + make_interval(days => v_ord.duration_days);

      -- Activate both 'core' (required by existing RLS/dashboard) and specific package tier
      INSERT INTO public.workspace_entitlements (
        workspace_id, feature, payment_provider, payment_reference, verified_by, verified_at, expires_at, revoked_at
      )
      VALUES
        (v_ord.workspace_id, 'core', 'doku', v_ord.invoice, 'doku-webhook', v_now, v_exp, NULL),
        (v_ord.workspace_id, v_ord.package_id, 'doku', v_ord.invoice, 'doku-webhook', v_now, v_exp, NULL)
      ON CONFLICT (workspace_id, feature) DO UPDATE
      SET payment_provider = CASE
            WHEN public.workspace_entitlements.expires_at > v_now + interval '400 days' THEN public.workspace_entitlements.payment_provider
            ELSE 'doku'
          END,
          payment_reference = CASE
            WHEN public.workspace_entitlements.expires_at > v_now + interval '400 days' THEN public.workspace_entitlements.payment_reference
            ELSE EXCLUDED.payment_reference
          END,
          verified_by = 'doku-webhook',
          verified_at = v_now,
          expires_at = (CASE
            WHEN public.workspace_entitlements.revoked_at IS NULL THEN GREATEST(COALESCE(public.workspace_entitlements.expires_at, v_now), v_now)
            ELSE v_now
          END) + make_interval(days => v_ord.duration_days),
          revoked_at = NULL;

      INSERT INTO public.admin_audit (actor_id, action, subject_id, details)
      VALUES (
        v_ord.payer_id,
        'doku.payment_verified',
        v_ord.workspace_id,
        jsonb_build_object(
          'invoice', v_ord.invoice,
          'package_id', v_ord.package_id,
          'amount_idr', v_ord.amount_idr,
          'channel_id', p_channel_id,
          'duration_days', v_ord.duration_days
        )
      );
    END IF;

    INSERT INTO public.doku_webhook_events (
      event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
    ) VALUES (
      p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'paid', v_now
    )
    ON CONFLICT (event_key) DO NOTHING;

    RETURN jsonb_build_object(
      'outcome', 'paid',
      'workspace_id', v_ord.workspace_id,
      'package_id', v_ord.package_id,
      'invoice', v_ord.invoice
    );
  END IF;

  -- Checkout FAILED is a non-final attempt failure: audit only, preserving
  -- pending/checkout_ready/unknown for later authenticated SUCCESS reconciliation.
  -- Retain the existing whole-order expiry/cancellation policy unchanged.
  IF p_amount_idr IS NOT DISTINCT FROM v_ord.amount_idr
     AND v_ord.status IN ('pending', 'checkout_ready', 'unknown') THEN
    IF v_norm_status = 'EXPIRED' THEN
      UPDATE public.doku_orders
      SET status = 'expired', updated_at = v_now
      WHERE invoice = p_invoice;
    ELSIF v_norm_status IN ('CANCELLED', 'CANCELED') THEN
      UPDATE public.doku_orders
      SET status = 'failed',
          error_code = left('DOKU_WEBHOOK_' || v_norm_status, 64),
          updated_at = v_now
      WHERE invoice = p_invoice;
    END IF;
  END IF;

  INSERT INTO public.doku_webhook_events (
    event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
  ) VALUES (
    p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'ignored', v_now
  )
  ON CONFLICT (event_key) DO NOTHING;

  RETURN jsonb_build_object('outcome', 'ignored');
END $$;

REVOKE ALL ON FUNCTION public.doku_apply_notification(text, text, text, bigint, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.doku_apply_notification(text, text, text, bigint, text, text, text) TO service_role;

COMMIT;

-- ===== STAGE 2 (S1): S1 capability capture / grant / resolver =====
-- >>> 02-s1-package-capabilities-v1.sql sha256=46907033702f1e4bacbe4fdbbafd5e443a433d16bba2fb6c233acfc21635cec8 source=supabase/candidates/package-capabilities-v1.sql
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

-- ===== STAGE 3 (S2): S2 immutable snapshots, atomic settlement, revocation =====
-- >>> 03-s2-package-settlement-v2.sql sha256=2d13d4435d811c5be2af9d00e4ae5a0122a43dbb2b39bdda4966260517f00d0a source=supabase/candidates/package-settlement-v2.sql
-- OFFLINE S2 CANDIDATE ONLY: no policy attachment, backfill, provider verification or deployment.
BEGIN;
CREATE TABLE public.package_order_terms (
 invoice text PRIMARY KEY REFERENCES public.doku_orders(invoice),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
 tier text NOT NULL, price_version bigint NOT NULL, amount_idr bigint NOT NULL,
 contract_version integer NOT NULL CHECK(contract_version IN (0,1)),
 benefits jsonb NOT NULL CHECK(jsonb_typeof(benefits)='array'),
 duration_months integer, duration_days integer,
 CHECK((duration_months IS NOT NULL AND duration_days IS NULL AND duration_months IN (6,12)) OR
       (duration_days IS NOT NULL AND duration_months IS NULL AND duration_days>0))
);
ALTER TABLE public.package_order_terms ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.package_order_terms FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.s2_freeze_order() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b jsonb := '["collaboration","rundown","budget_expenses","checklist","vendors"]';
BEGIN
 IF NEW.package_id IN ('premium','wedding_pro') THEN b:=b || '["shared_savings","moodboard","digital_invitation"]'::jsonb; END IF;
 IF NEW.package_id='wedding_pro' THEN b:=b || '["honeymoon","engagement"]'::jsonb; END IF;
 INSERT INTO public.package_order_terms VALUES(NEW.invoice,NEW.workspace_id,NEW.package_id,NEW.price_version,NEW.amount_idr,1,b,CASE WHEN NEW.package_id='starter' THEN 6 ELSE 12 END,NULL);
 RETURN NEW;
END $$;
CREATE TRIGGER s2_reservation AFTER INSERT ON public.doku_orders FOR EACH ROW EXECUTE FUNCTION public.s2_freeze_order();
REVOKE ALL ON FUNCTION public.s2_freeze_order() FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE public.package_settlements (
 invoice text PRIMARY KEY REFERENCES public.package_order_terms(invoice),
 evidence_hash text NOT NULL, amount_idr bigint NOT NULL,
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
 terms jsonb NOT NULL, verified_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
 CHECK(isfinite(verified_at) AND isfinite(expires_at) AND expires_at>verified_at)
);
ALTER TABLE public.package_settlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.package_settlements FROM PUBLIC,anon,authenticated,service_role;
-- Only a separately authenticated, trusted verifier may call this candidate RPC.
-- It does not authenticate provider evidence. No HTTP/provider adapter is installed.
CREATE FUNCTION public.s2_settle_verified(p_invoice text,p_amount bigint,p_evidence_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.doku_orders; t public.package_order_terms; s public.package_settlements; v_now timestamptz:=now(); v_exp timestamptz;
BEGIN
 IF p_evidence_hash IS NULL OR length(p_evidence_hash) NOT BETWEEN 8 AND 255 OR p_evidence_hash<>btrim(p_evidence_hash) THEN RAISE EXCEPTION 'invalid evidence'; END IF;
 SELECT * INTO o FROM public.doku_orders WHERE invoice=p_invoice FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'unknown order'; END IF;
 IF p_amount IS DISTINCT FROM o.amount_idr THEN RAISE EXCEPTION 'amount conflict'; END IF;
 SELECT * INTO s FROM public.package_settlements WHERE invoice=p_invoice;
 IF FOUND THEN
  IF s.evidence_hash<>p_evidence_hash OR s.amount_idr<>p_amount THEN RAISE EXCEPTION 'settlement conflict'; END IF;
  RETURN to_jsonb(s);
 END IF;
 IF o.status NOT IN ('pending','checkout_ready','unknown') THEN RAISE EXCEPTION 'ineligible order'; END IF;
 SELECT * INTO t FROM public.package_order_terms WHERE invoice=p_invoice;
 IF NOT FOUND THEN
  -- Old orders have historical core benefits, not newly inferred premium modules.
  INSERT INTO public.package_order_terms VALUES(o.invoice,o.workspace_id,o.package_id,o.price_version,o.amount_idr,0,
   '["collaboration","budget_expenses","checklist","shared_savings","budgets","tasks","guests","savings_accounts","savings_contributions","vendors","vendor_installments","vendor_payments"]',NULL,o.duration_days) RETURNING * INTO t;
 END IF;
 IF (t.workspace_id,t.tier,t.price_version,t.amount_idr) IS DISTINCT FROM (o.workspace_id,o.package_id,o.price_version,o.amount_idr) THEN RAISE EXCEPTION 'terms conflict'; END IF;
 -- Calendar months, UTC, PostgreSQL end-of-month clamp; old terms use exact UTC days.
 v_exp:=((v_now AT TIME ZONE 'UTC') + CASE WHEN t.duration_months IS NOT NULL THEN make_interval(months=>t.duration_months) ELSE make_interval(days=>t.duration_days) END) AT TIME ZONE 'UTC';
 INSERT INTO public.package_settlements VALUES(o.invoice,p_evidence_hash,p_amount,o.workspace_id,to_jsonb(t),v_now,v_exp) RETURNING * INTO s;
 UPDATE public.doku_orders SET status='paid',paid_at=v_now,updated_at=v_now WHERE invoice=o.invoice;
 RETURN to_jsonb(s);
END $$;
REVOKE ALL ON FUNCTION public.s2_settle_verified(text,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.s2_settle_verified(text,bigint,text) TO service_role;
ALTER FUNCTION public.has_workspace_capability_v1(uuid,text) RENAME TO s1_has_workspace_capability_v1;
REVOKE ALL ON FUNCTION public.s1_has_workspace_capability_v1(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.has_workspace_capability_v1(p_workspace_id uuid,p_capability text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.s1_has_workspace_capability_v1(p_workspace_id,p_capability) OR coalesce(
 auth.uid() IS NOT NULL AND public.is_workspace_member(p_workspace_id) AND EXISTS(
 SELECT 1 FROM public.package_settlements s WHERE s.workspace_id=p_workspace_id AND s.verified_at<=now() AND s.expires_at>now()
 AND s.terms->'benefits' ? p_capability),false)
$$;
REVOKE ALL ON FUNCTION public.has_workspace_capability_v1(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_workspace_capability_v1(uuid,text) TO authenticated;
CREATE FUNCTION public.s2_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'immutable evidence'; END $$;
CREATE TRIGGER s2_terms_immutable BEFORE UPDATE OR DELETE ON public.package_order_terms FOR EACH ROW EXECUTE FUNCTION public.s2_immutable();
CREATE TRIGGER s2_settlement_immutable BEFORE UPDATE OR DELETE ON public.package_settlements FOR EACH ROW EXECUTE FUNCTION public.s2_immutable();
CREATE FUNCTION public.s2_order_identity() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF (NEW.invoice,NEW.workspace_id,NEW.payer_id,NEW.package_id,NEW.price_version,NEW.amount_idr,NEW.duration_days,NEW.request_id,NEW.created_at)
 IS DISTINCT FROM (OLD.invoice,OLD.workspace_id,OLD.payer_id,OLD.package_id,OLD.price_version,OLD.amount_idr,OLD.duration_days,OLD.request_id,OLD.created_at)
 THEN RAISE EXCEPTION 'immutable order identity'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER s2_order_identity BEFORE UPDATE ON public.doku_orders FOR EACH ROW EXECUTE FUNCTION public.s2_order_identity();
REVOKE ALL ON FUNCTION public.s2_immutable(),public.s2_order_identity() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER s2_capture_immutable BEFORE UPDATE OR DELETE ON public.workspace_legacy_capability_captures FOR EACH ROW EXECUTE FUNCTION public.s2_immutable();
CREATE TABLE public.package_capture_invalidations (
 workspace_id uuid NOT NULL, source_feature text NOT NULL, invalidated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(workspace_id,source_feature)
);
ALTER TABLE public.package_capture_invalidations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.package_capture_invalidations FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER s2_invalidation_immutable BEFORE UPDATE OR DELETE ON public.package_capture_invalidations FOR EACH ROW EXECUTE FUNCTION public.s2_immutable();
CREATE FUNCTION public.s2_invalidate_capture() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' OR (NEW.payment_provider,NEW.payment_reference,NEW.workspace_id,NEW.feature) IS DISTINCT FROM (OLD.payment_provider,OLD.payment_reference,OLD.workspace_id,OLD.feature) THEN
 INSERT INTO public.package_capture_invalidations(workspace_id,source_feature)
 SELECT OLD.workspace_id,OLD.feature WHERE EXISTS(SELECT 1 FROM public.workspace_legacy_capability_captures WHERE workspace_id=OLD.workspace_id AND source_feature=OLD.feature) ON CONFLICT DO NOTHING;
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER s2_invalidate_capture BEFORE UPDATE OR DELETE ON public.workspace_entitlements FOR EACH ROW EXECUTE FUNCTION public.s2_invalidate_capture();
REVOKE ALL ON FUNCTION public.s2_invalidate_capture() FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE f text; BEGIN
 SELECT pg_get_functiondef('public.s1_has_workspace_capability_v1(uuid,text)'::regprocedure) INTO f;
 f:=replace(f,'WHERE c.workspace_id=p_workspace_id','WHERE NOT EXISTS (SELECT 1 FROM public.package_capture_invalidations i WHERE i.workspace_id=c.workspace_id AND i.source_feature=c.source_feature) AND c.workspace_id=p_workspace_id');
 EXECUTE f;
END $$;
ALTER TABLE public.package_settlements ADD CONSTRAINT s2_evidence_unique UNIQUE(evidence_hash);
CREATE FUNCTION public.s2_validate_capture() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s jsonb;
BEGIN
 SELECT to_jsonb(e) INTO s FROM public.workspace_entitlements e WHERE workspace_id=NEW.workspace_id AND feature=NEW.source_feature FOR UPDATE;
 IF s IS NULL OR s IS DISTINCT FROM NEW.source_snapshot OR EXISTS(SELECT 1 FROM public.package_capture_invalidations WHERE workspace_id=NEW.workspace_id AND source_feature=NEW.source_feature) THEN RAISE EXCEPTION 'snapshot conflict'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER s2_validate_capture BEFORE INSERT ON public.workspace_legacy_capability_captures FOR EACH ROW EXECUTE FUNCTION public.s2_validate_capture();
REVOKE ALL ON FUNCTION public.s2_validate_capture() FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.s2_capture_reviewed(p_workspace uuid,p_feature text,p_snapshot jsonb,p_reference text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.workspace_legacy_capability_captures;
BEGIN
 PERFORM 1 FROM public.workspace_entitlements WHERE workspace_id=p_workspace AND feature=p_feature FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'snapshot conflict: missing source'; END IF;
 SELECT * INTO c FROM public.workspace_legacy_capability_captures WHERE workspace_id=p_workspace AND source_feature=p_feature;
 IF FOUND THEN
 IF c.source_snapshot IS DISTINCT FROM p_snapshot OR c.capture_reference IS DISTINCT FROM p_reference THEN RAISE EXCEPTION 'capture conflict'; END IF;
 RETURN to_jsonb(c);
 END IF;
 INSERT INTO public.workspace_legacy_capability_captures(workspace_id,source_feature,source_snapshot,capture_reference) VALUES(p_workspace,p_feature,p_snapshot,p_reference) RETURNING * INTO c;
 RETURN to_jsonb(c);
END $$;
REVOKE ALL ON FUNCTION public.s2_capture_reviewed(uuid,text,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.s2_capture_reviewed(uuid,text,jsonb,text) TO service_role;
COMMIT;

-- ===== STAGE 4 (S2 integration + lockfix, once): S2 integration + lock-order fix (single definition; replaces the pre-fix body) =====
-- >>> 04-s2-settlement-integration-lockfix.sql sha256=9142f037ec1238d5fa60120031a78a89bb0fb02bf8484cf7bc795579f98d0545 source=supabase/candidates/settlement-integration.sql
-- OFFLINE INTEGRATION CANDIDATE ONLY. No migration activation.
BEGIN;
CREATE TABLE public.package_settlement_revocations (
 invoice text PRIMARY KEY REFERENCES public.package_settlements(invoice),
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 255),
 revoked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.package_settlement_revocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.package_settlement_revocations FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER revocations_immutable BEFORE UPDATE OR DELETE ON public.package_settlement_revocations FOR EACH ROW EXECUTE FUNCTION public.s2_immutable();
CREATE FUNCTION public.revoke_package_settlement(p_invoice text,p_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM 1 FROM public.doku_orders WHERE invoice=p_invoice FOR UPDATE;
 INSERT INTO public.package_settlement_revocations(invoice,reason) VALUES(p_invoice,p_reason) ON CONFLICT DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.revoke_package_settlement(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_package_settlement(text,text) TO service_role;
CREATE FUNCTION public.revoke_core_settlements() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.feature='core' AND NEW.revoked_at IS NOT NULL THEN
  INSERT INTO public.package_settlement_revocations(invoice,reason)
  SELECT invoice,'core operator revocation' FROM public.package_settlements WHERE workspace_id=NEW.workspace_id ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER revoke_core_settlements AFTER INSERT OR UPDATE ON public.workspace_entitlements FOR EACH ROW EXECUTE FUNCTION public.revoke_core_settlements();
REVOKE ALL ON FUNCTION public.revoke_core_settlements() FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.has_workspace_capability_v1(p_workspace_id uuid,p_capability text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.s1_has_workspace_capability_v1(p_workspace_id,p_capability) OR coalesce(
 auth.uid() IS NOT NULL AND public.is_workspace_member(p_workspace_id) AND EXISTS(
 SELECT 1 FROM public.package_settlements s WHERE s.workspace_id=p_workspace_id AND s.verified_at<=now() AND s.expires_at>now()
 AND NOT EXISTS(SELECT 1 FROM public.package_settlement_revocations r WHERE r.invoice=s.invoice)
 AND s.terms->'benefits' ? p_capability),false)
$$;

ALTER FUNCTION public.has_workspace_entitlement(uuid,text) RENAME TO legacy_has_workspace_entitlement;
REVOKE ALL ON FUNCTION public.legacy_has_workspace_entitlement(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.has_workspace_entitlement(ws_id uuid,feature_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT public.legacy_has_workspace_entitlement(ws_id,feature_key) OR
 public.has_workspace_capability_v1(ws_id,CASE WHEN feature_key='core' THEN 'collaboration' ELSE feature_key END)
$$;
REVOKE ALL ON FUNCTION public.has_workspace_entitlement(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_workspace_entitlement(uuid,text) TO authenticated;
ALTER FUNCTION public.s2_settle_verified(text,bigint,text) RENAME TO canonical_settle_locked;
REVOKE ALL ON FUNCTION public.canonical_settle_locked(text,bigint,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE public.package_settlement_events (
 event_key text PRIMARY KEY REFERENCES public.doku_webhook_events(event_key),
 invoice text NOT NULL REFERENCES public.package_settlements(invoice)
);
ALTER TABLE public.package_settlement_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.package_settlement_events FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER settlement_event_immutable BEFORE UPDATE OR DELETE ON public.package_settlement_events FOR EACH ROW EXECUTE FUNCTION public.s2_immutable();
CREATE OR REPLACE FUNCTION public.doku_apply_notification(
  p_event_key text,
  p_payload_hash text,
  p_invoice text,
  p_amount_idr bigint,
  p_channel_id text,
  p_tx_status text,
  p_tx_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing_ev public.doku_webhook_events;
  v_ord public.doku_orders;
  v_now timestamptz := clock_timestamp();
  v_exp timestamptz;
  v_norm_status text := upper(btrim(coalesce(p_tx_status, '')));
  v_norm_type text := upper(btrim(coalesce(p_tx_type, 'SALE')));
BEGIN
  IF p_event_key IS NULL OR p_payload_hash IS NULL OR p_invoice IS NULL THEN
    RAISE EXCEPTION 'invalid_notification_args';
  END IF;

  -- Canonical writer order: order row, then event advisory, then settlement.
  -- The status/settlement wrapper and revocation already take this row first.
  -- Never acquire a doku-ev advisory lock before entering this writer.
  SELECT * INTO v_ord
  FROM public.doku_orders
  WHERE invoice = p_invoice
  FOR UPDATE;

  -- Keep event-key serialization across invoices, including unmatched deliveries.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('doku-ev:' || p_event_key, 0)
  );

  SELECT * INTO v_existing_ev
  FROM public.doku_webhook_events
  WHERE event_key = p_event_key;

  IF FOUND THEN
    IF v_existing_ev.payload_hash = p_payload_hash THEN
      RETURN jsonb_build_object('outcome', 'duplicate');
    END IF;
    RETURN jsonb_build_object('outcome', 'conflict');
  END IF;

  IF v_ord.invoice IS NULL THEN
    INSERT INTO public.doku_webhook_events (
      event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
    ) VALUES (
      p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'unmatched', v_now
    )
    ON CONFLICT (event_key) DO NOTHING;
    RETURN jsonb_build_object('outcome', 'unmatched');
  END IF;

  IF v_norm_status = 'SUCCESS' AND (p_tx_type IS NULL OR v_norm_type IN ('SALE', 'PAYMENT', '')) THEN
    IF p_amount_idr IS DISTINCT FROM v_ord.amount_idr THEN
      INSERT INTO public.doku_webhook_events (
        event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
      ) VALUES (
        p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'amount_mismatch', v_now
      )
      ON CONFLICT (event_key) DO NOTHING;
      RETURN jsonb_build_object('outcome', 'amount_mismatch');
    END IF;

    INSERT INTO public.doku_webhook_events (
      event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
    ) VALUES (
      p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'paid', v_now
    )
    ON CONFLICT (event_key) DO NOTHING;

    -- Same transaction: authenticated adapter event -> immutable terms -> settlement.
    PERFORM public.canonical_settle_locked(p_invoice,p_amount_idr,
      coalesce((SELECT evidence_hash FROM public.package_settlements WHERE invoice=p_invoice),p_payload_hash));
    INSERT INTO public.package_settlement_events VALUES(p_event_key,p_invoice) ON CONFLICT DO NOTHING;
    RETURN jsonb_build_object(
      'outcome', 'paid',
      'workspace_id', v_ord.workspace_id,
      'package_id', v_ord.package_id,
      'invoice', v_ord.invoice
    );
  END IF;

  -- Checkout FAILED is a non-final attempt failure: audit only, preserving
  -- pending/checkout_ready/unknown for later authenticated SUCCESS reconciliation.
  -- Retain the existing whole-order expiry/cancellation policy unchanged.
  IF p_amount_idr IS NOT DISTINCT FROM v_ord.amount_idr
     AND v_ord.status IN ('pending', 'checkout_ready', 'unknown') THEN
    IF v_norm_status = 'EXPIRED' THEN
      UPDATE public.doku_orders
      SET status = 'expired', updated_at = v_now
      WHERE invoice = p_invoice;
    ELSIF v_norm_status IN ('CANCELLED', 'CANCELED') THEN
      UPDATE public.doku_orders
      SET status = 'failed',
          error_code = left('DOKU_WEBHOOK_' || v_norm_status, 64),
          updated_at = v_now
      WHERE invoice = p_invoice;
    END IF;
  END IF;

  INSERT INTO public.doku_webhook_events (
    event_key, invoice_number, payload_hash, channel_id, transaction_status, amount_idr, action, received_at
  ) VALUES (
    p_event_key, p_invoice, p_payload_hash, p_channel_id, p_tx_status, p_amount_idr, 'ignored', v_now
  )
  ON CONFLICT (event_key) DO NOTHING;

  RETURN jsonb_build_object('outcome', 'ignored');
END $$;

REVOKE ALL ON FUNCTION public.doku_apply_notification(text, text, text, bigint, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.doku_apply_notification(text, text, text, bigint, text, text, text) TO service_role;


CREATE FUNCTION public.s2_settle_verified(p_invoice text,p_amount bigint,p_evidence_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.package_settlements; r jsonb;
BEGIN
 IF p_evidence_hash IS NULL OR length(p_evidence_hash) NOT BETWEEN 8 AND 255 OR p_evidence_hash<>btrim(p_evidence_hash) THEN RAISE EXCEPTION 'invalid evidence'; END IF;
 PERFORM 1 FROM public.doku_orders WHERE invoice=p_invoice FOR UPDATE;
 SELECT * INTO s FROM public.package_settlements WHERE invoice=p_invoice;
 IF FOUND THEN
  IF s.evidence_hash<>p_evidence_hash OR s.amount_idr<>p_amount THEN RAISE EXCEPTION 'settlement conflict'; END IF;
  RETURN to_jsonb(s);
 END IF;
 r:=public.doku_apply_notification('s2:'||p_invoice||':'||p_evidence_hash,p_evidence_hash,p_invoice,p_amount,'S2-TRUSTED','SUCCESS','SALE');
 IF r->>'outcome'<>'paid' THEN RAISE EXCEPTION 'settlement rejected %',r->>'outcome'; END IF;
 SELECT * INTO s FROM public.package_settlements WHERE invoice=p_invoice;
 RETURN to_jsonb(s);
END $$;
REVOKE ALL ON FUNCTION public.s2_settle_verified(text,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.s2_settle_verified(text,bigint,text) TO service_role;
COMMIT;

-- ===== STAGE 4b: HARNESS-ONLY hosted planner fixture reconstruction =====
-- >>> 05-harness-fixture-reconstruction.sql sha256=035d19fdb18d79ce6affb42d5798f7fe453047100a5d56e2dd1fcfefdc5108ab (NOT RELEASE SQL)
-- HARNESS FIXTURE RECONSTRUCTION ONLY. Not release SQL, not a restore.
CREATE SCHEMA starter_private; REVOKE ALL ON SCHEMA starter_private FROM PUBLIC;
DROP TABLE public.budgets,public.tasks,public.guests,public.savings_accounts,public.savings_contributions CASCADE;
CREATE TABLE "public"."budgets" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,"workspace_id" uuid NOT NULL,"category" character varying(50) NOT NULL,"title" character varying(150) NOT NULL,"allocated_amount" bigint DEFAULT 0,"spent_amount" bigint DEFAULT 0,"payment_status" character varying(20) DEFAULT 'unpaid'::character varying,"notes" text,"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL);
ALTER TABLE "public"."budgets" ADD CONSTRAINT "budgets_payment_status_check" CHECK (payment_status::text = ANY (ARRAY['unpaid'::character varying, 'dp'::character varying, 'paid'::character varying]::text[]));
ALTER TABLE "public"."budgets" ADD CONSTRAINT "budgets_pkey" PRIMARY KEY (id);
CREATE TABLE "public"."tasks" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,"workspace_id" uuid NOT NULL,"title" character varying(255) NOT NULL,"phase" character varying(50) NOT NULL,"pic" character varying(20) DEFAULT 'both'::character varying,"is_completed" boolean DEFAULT false,"due_date" date,"notes" text,"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL);
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_pic_check" CHECK (pic::text = ANY (ARRAY['groom'::character varying, 'bride'::character varying, 'both'::character varying]::text[]));
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_pkey" PRIMARY KEY (id);
CREATE TABLE "public"."guests" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,"workspace_id" uuid NOT NULL,"name" character varying(150) NOT NULL,"category" character varying(50) DEFAULT 'teman_kantor'::character varying,"pax" integer DEFAULT 1,"phone" character varying(30),"rsvp_status" character varying(20) DEFAULT 'uncontacted'::character varying,"notes" text,"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL);
ALTER TABLE "public"."guests" ADD CONSTRAINT "guests_category_check" CHECK (category::text = ANY (ARRAY['keluarga_pria'::character varying, 'keluarga_wanita'::character varying, 'teman_kantor'::character varying, 'sahabat'::character varying, 'vip'::character varying, 'lainnya'::character varying]::text[]));
ALTER TABLE "public"."guests" ADD CONSTRAINT "guests_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."guests" ADD CONSTRAINT "guests_rsvp_status_check" CHECK (rsvp_status::text = ANY (ARRAY['uncontacted'::character varying, 'sent'::character varying, 'attending'::character varying, 'declined'::character varying]::text[]));
CREATE TABLE "public"."savings_accounts" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,"workspace_id" uuid NOT NULL,"account_name" character varying(100) NOT NULL,"target_amount" bigint DEFAULT 0,"current_balance" bigint DEFAULT 0,"account_number" character varying(50),"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL);
ALTER TABLE "public"."savings_accounts" ADD CONSTRAINT "savings_accounts_pkey" PRIMARY KEY (id);
CREATE TABLE "public"."savings_contributions" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,"workspace_id" uuid NOT NULL,"contributor_id" uuid NOT NULL,"amount" bigint NOT NULL,"contributed_on" date NOT NULL,"notes" text DEFAULT ''::text NOT NULL,"created_at" timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE "public"."savings_contributions" ADD CONSTRAINT "savings_contributions_amount_check" CHECK (amount >= 1 AND amount <= '9007199254740991'::bigint);
ALTER TABLE "public"."savings_contributions" ADD CONSTRAINT "savings_contributions_notes_check" CHECK (length(notes) <= 500);
ALTER TABLE "public"."savings_contributions" ADD CONSTRAINT "savings_contributions_pkey" PRIMARY KEY (id);
CREATE TABLE "public"."vendors" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,"workspace_id" uuid NOT NULL,"name" text NOT NULL,"contact_name" text DEFAULT ''::text NOT NULL,"contact_phone" text DEFAULT ''::text NOT NULL,"contract_notes" text DEFAULT ''::text NOT NULL,"contract_total" bigint DEFAULT 0 NOT NULL,"created_at" timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE "public"."vendors" ADD CONSTRAINT "vendors_contact_name_check" CHECK (length(contact_name) <= 200);
ALTER TABLE "public"."vendors" ADD CONSTRAINT "vendors_contact_phone_check" CHECK (length(contact_phone) <= 100);
ALTER TABLE "public"."vendors" ADD CONSTRAINT "vendors_contract_notes_check" CHECK (length(contract_notes) <= 4000);
ALTER TABLE "public"."vendors" ADD CONSTRAINT "vendors_contract_total_check" CHECK (contract_total >= 0 AND contract_total <= '9007199254740991'::bigint);
ALTER TABLE "public"."vendors" ADD CONSTRAINT "vendors_name_check" CHECK (length(btrim(name)) >= 1 AND length(btrim(name)) <= 200);
ALTER TABLE "public"."vendors" ADD CONSTRAINT "vendors_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."vendors" ADD CONSTRAINT "vendors_workspace_id_id_key" UNIQUE (workspace_id, id);
CREATE TABLE "public"."vendor_installments" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,"workspace_id" uuid NOT NULL,"vendor_id" uuid NOT NULL,"title" text NOT NULL,"amount" bigint NOT NULL,"due_date" date NOT NULL,"created_at" timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE "public"."vendor_installments" ADD CONSTRAINT "vendor_installments_amount_check" CHECK (amount >= 1 AND amount <= '9007199254740991'::bigint);
ALTER TABLE "public"."vendor_installments" ADD CONSTRAINT "vendor_installments_due_date_check" CHECK (due_date >= '1900-01-01'::date AND due_date <= '9999-12-31'::date);
ALTER TABLE "public"."vendor_installments" ADD CONSTRAINT "vendor_installments_pkey" PRIMARY KEY (id);
ALTER TABLE "public"."vendor_installments" ADD CONSTRAINT "vendor_installments_title_check" CHECK (length(btrim(title)) >= 1 AND length(btrim(title)) <= 200);
ALTER TABLE "public"."vendor_installments" ADD CONSTRAINT "vendor_installments_workspace_id_id_key" UNIQUE (workspace_id, id);
CREATE TABLE "public"."vendor_payments" ("id" uuid DEFAULT gen_random_uuid() NOT NULL,"workspace_id" uuid NOT NULL,"installment_id" uuid NOT NULL,"amount" bigint NOT NULL,"paid_on" date NOT NULL,"notes" text DEFAULT ''::text NOT NULL,"created_at" timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE "public"."vendor_payments" ADD CONSTRAINT "vendor_payments_amount_check" CHECK (amount >= 1 AND amount <= '9007199254740991'::bigint);
ALTER TABLE "public"."vendor_payments" ADD CONSTRAINT "vendor_payments_notes_check" CHECK (length(notes) <= 4000);
ALTER TABLE "public"."vendor_payments" ADD CONSTRAINT "vendor_payments_paid_on_check" CHECK (paid_on >= '1900-01-01'::date AND paid_on <= '9999-12-31'::date);
ALTER TABLE "public"."vendor_payments" ADD CONSTRAINT "vendor_payments_pkey" PRIMARY KEY (id);
CREATE TABLE "starter_private"."applied" ("workspace_id" uuid NOT NULL,"applied_at" timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE "starter_private"."applied" ADD CONSTRAINT "applied_pkey" PRIMARY KEY (workspace_id);
CREATE TABLE "starter_private"."requests" ("request_id" uuid NOT NULL,"owner_id" uuid NOT NULL,"workspace_id" uuid NOT NULL);
ALTER TABLE "starter_private"."requests" ADD CONSTRAINT "requests_pkey" PRIMARY KEY (request_id);
ALTER TABLE "public"."budgets" ADD CONSTRAINT "budgets_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS budgets_pkey ON public.budgets USING btree (id);
ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."budgets" TO authenticated; GRANT ALL ON "public"."budgets" TO service_role;
CREATE POLICY "member_crud" ON "public"."budgets" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS tasks_pkey ON public.tasks USING btree (id);
ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."tasks" TO authenticated; GRANT ALL ON "public"."tasks" TO service_role;
CREATE POLICY "member_crud" ON "public"."tasks" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
ALTER TABLE "public"."guests" ADD CONSTRAINT "guests_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS guests_pkey ON public.guests USING btree (id);
ALTER TABLE "public"."guests" ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."guests" TO authenticated; GRANT ALL ON "public"."guests" TO service_role;
CREATE POLICY "member_crud" ON "public"."guests" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
ALTER TABLE "public"."savings_accounts" ADD CONSTRAINT "savings_accounts_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS savings_accounts_pkey ON public.savings_accounts USING btree (id);
ALTER TABLE "public"."savings_accounts" ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."savings_accounts" TO authenticated; GRANT ALL ON "public"."savings_accounts" TO service_role;
CREATE POLICY "member_crud" ON "public"."savings_accounts" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
ALTER TABLE "public"."savings_contributions" ADD CONSTRAINT "savings_contributions_workspace_id_contributor_id_fkey" FOREIGN KEY (workspace_id, contributor_id) REFERENCES workspace_members(workspace_id, user_id);
ALTER TABLE "public"."savings_contributions" ADD CONSTRAINT "savings_contributions_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS savings_contributions_pkey ON public.savings_contributions USING btree (id);
CREATE INDEX IF NOT EXISTS savings_contributions_workspace ON public.savings_contributions USING btree (workspace_id);
ALTER TABLE "public"."savings_contributions" ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."savings_contributions" TO authenticated; GRANT ALL ON "public"."savings_contributions" TO service_role;
CREATE POLICY "savings_member" ON "public"."savings_contributions" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
ALTER TABLE "public"."vendors" ADD CONSTRAINT "vendors_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS vendors_pkey ON public.vendors USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS vendors_workspace_id_id_key ON public.vendors USING btree (workspace_id, id);
CREATE INDEX IF NOT EXISTS vendors_workspace_id_idx ON public.vendors USING btree (workspace_id);
ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendors" TO authenticated; GRANT ALL ON "public"."vendors" TO service_role;
CREATE POLICY "member_crud" ON "public"."vendors" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
ALTER TABLE "public"."vendor_installments" ADD CONSTRAINT "vendor_installments_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE "public"."vendor_installments" ADD CONSTRAINT "vendor_installments_workspace_id_vendor_id_fkey" FOREIGN KEY (workspace_id, vendor_id) REFERENCES vendors(workspace_id, id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS vendor_installments_pkey ON public.vendor_installments USING btree (id);
CREATE UNIQUE INDEX IF NOT EXISTS vendor_installments_workspace_id_id_key ON public.vendor_installments USING btree (workspace_id, id);
CREATE INDEX IF NOT EXISTS vendor_installments_workspace_id_vendor_id_idx ON public.vendor_installments USING btree (workspace_id, vendor_id);
ALTER TABLE "public"."vendor_installments" ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_installments" TO authenticated; GRANT ALL ON "public"."vendor_installments" TO service_role;
CREATE POLICY "member_crud" ON "public"."vendor_installments" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
ALTER TABLE "public"."vendor_payments" ADD CONSTRAINT "vendor_payments_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE "public"."vendor_payments" ADD CONSTRAINT "vendor_payments_workspace_id_installment_id_fkey" FOREIGN KEY (workspace_id, installment_id) REFERENCES vendor_installments(workspace_id, id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS vendor_payments_pkey ON public.vendor_payments USING btree (id);
CREATE INDEX IF NOT EXISTS vendor_payments_workspace_id_installment_id_idx ON public.vendor_payments USING btree (workspace_id, installment_id);
ALTER TABLE "public"."vendor_payments" ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON "public"."vendor_payments" TO authenticated; GRANT ALL ON "public"."vendor_payments" TO service_role;
CREATE POLICY "member_crud" ON "public"."vendor_payments" AS PERMISSIVE FOR ALL TO "authenticated" USING (is_workspace_member(workspace_id)) WITH CHECK (is_workspace_member(workspace_id));
ALTER TABLE "starter_private"."applied" ADD CONSTRAINT "applied_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS applied_pkey ON starter_private.applied USING btree (workspace_id);
ALTER TABLE "starter_private"."applied" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "starter_private"."requests" ADD CONSTRAINT "requests_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id);
ALTER TABLE "starter_private"."requests" ADD CONSTRAINT "requests_workspace_id_fkey" FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS requests_pkey ON starter_private.requests USING btree (request_id);
ALTER TABLE "starter_private"."requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ADD COLUMN wa_template jsonb;
CREATE OR REPLACE FUNCTION public.audit_immutable()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$

BEGIN

  RAISE EXCEPTION 'append-only audit';

END $function$
;
REVOKE ALL ON FUNCTION "public"."audit_immutable"() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.create_starter_workspace(p_request_id uuid, p_groom_name text, p_bride_name text, p_wedding_date date, p_target_budget bigint, p_target_savings bigint)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE uid uuid:=auth.uid(); ws uuid; prior starter_private.requests%ROWTYPE;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL THEN RAISE EXCEPTION 'request required'; END IF;
 -- Same logical request serialized before workspace creation, including network retries.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_request_id::text,0));
 SELECT * INTO prior FROM starter_private.requests WHERE request_id=p_request_id;
 IF FOUND THEN
  IF prior.owner_id<>uid THEN RAISE EXCEPTION 'request belongs to another owner' USING ERRCODE='42501'; END IF;
  RETURN prior.workspace_id;
 END IF;
 IF p_groom_name IS NULL OR length(btrim(p_groom_name)) NOT BETWEEN 1 AND 100 OR p_bride_name IS NULL OR length(btrim(p_bride_name)) NOT BETWEEN 1 AND 100 OR p_wedding_date IS NULL OR p_target_budget IS NULL OR p_target_savings IS NULL OR p_target_budget NOT BETWEEN 0 AND 9007199254740991 OR p_target_savings NOT BETWEEN 0 AND 9007199254740991 THEN RAISE EXCEPTION 'invalid workspace'; END IF;
 ws:=public.create_workspace('Pernikahan '||btrim(p_groom_name)||' & '||btrim(p_bride_name),p_wedding_date);
 UPDATE public.workspaces SET groom_name=p_groom_name,bride_name=p_bride_name,target_budget=p_target_budget,target_savings=p_target_savings WHERE id=ws;
 PERFORM public.use_starter_template(ws);
 INSERT INTO starter_private.requests VALUES(p_request_id,uid,ws);
 RETURN ws;
END $function$
;
REVOKE ALL ON FUNCTION "public"."create_starter_workspace"(p_request_id uuid, p_groom_name text, p_bride_name text, p_wedding_date date, p_target_budget bigint, p_target_savings bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION "public"."create_starter_workspace"(p_request_id uuid, p_groom_name text, p_bride_name text, p_wedding_date date, p_target_budget bigint, p_target_savings bigint) TO authenticated;
CREATE OR REPLACE FUNCTION public.create_workspace(p_title text, p_wedding_date date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE uid uuid := auth.uid(); ws uuid;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_title IS NULL OR length(btrim(p_title)) NOT BETWEEN 1 AND 255 OR p_wedding_date IS NULL THEN RAISE EXCEPTION 'invalid workspace'; END IF;
 INSERT INTO public.workspaces(title,wedding_date) VALUES(btrim(p_title),p_wedding_date) RETURNING id INTO ws;
 INSERT INTO public.workspace_members(workspace_id,user_id,role) VALUES(ws,uid,'owner');
 RETURN ws;
END $function$
;
REVOKE ALL ON FUNCTION "public"."create_workspace"(p_title text, p_wedding_date date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION "public"."create_workspace"(p_title text, p_wedding_date date) TO authenticated;
CREATE OR REPLACE FUNCTION public.has_developer_test_access(p_workspace_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT public.site_role()='developer' AND EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=auth.uid() AND role='owner')
 AND EXISTS(SELECT 1 FROM public.developer_test_grants WHERE workspace_id=p_workspace_id AND user_id=auth.uid() AND revoked_at IS NULL AND expires_at>now());
$function$
;
REVOKE ALL ON FUNCTION "public"."has_developer_test_access"(p_workspace_id uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION "public"."has_developer_test_access"(p_workspace_id uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.has_workspace_entitlement(ws_id uuid, feature_key text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT public.is_workspace_member(ws_id) AND (
 EXISTS(SELECT 1 FROM public.workspace_entitlements WHERE workspace_id=ws_id AND feature=feature_key AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>now()))
 OR (feature_key='core' AND public.has_developer_test_access(ws_id)));
$function$
;
REVOKE ALL ON FUNCTION "public"."has_workspace_entitlement"(ws_id uuid, feature_key text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION "public"."has_workspace_entitlement"(ws_id uuid, feature_key text) TO authenticated;
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=ws_id AND user_id=auth.uid());
$function$
;
REVOKE ALL ON FUNCTION "public"."is_workspace_member"(ws_id uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION "public"."is_workspace_member"(ws_id uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.keep_savings_workspace()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
 IF NEW.workspace_id<>OLD.workspace_id THEN RAISE EXCEPTION 'immutable workspace'; END IF;
 RETURN NEW;
END $function$
;
REVOKE ALL ON FUNCTION "public"."keep_savings_workspace"() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.reset_planning_content(p_workspace_id uuid, p_confirmation text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE uid uuid:=auth.uid(); b bigint; t bigint; g bigint; s bigint; counts jsonb; v bigint; i bigint; p bigint;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_confirmation IS DISTINCT FROM 'RESET RENCANA' THEN RAISE EXCEPTION 'confirmation required' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=uid AND role='owner' FOR UPDATE) THEN
  RAISE EXCEPTION 'owner required' USING ERRCODE='42501';
 END IF;
 INSERT INTO starter_private.applied(workspace_id) VALUES(p_workspace_id) ON CONFLICT DO NOTHING;
 -- Explicit planning-only scope. Do not cascade-delete workspace, identity, legacy
 -- savings accounts, invitations, purchase references, entitlements or audit.
 DELETE FROM public.vendor_payments WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS p=ROW_COUNT;
 DELETE FROM public.vendor_installments WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS i=ROW_COUNT;
 DELETE FROM public.vendors WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS v=ROW_COUNT;
 DELETE FROM public.budgets WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS b=ROW_COUNT;
 DELETE FROM public.tasks WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS t=ROW_COUNT;
 DELETE FROM public.guests WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS g=ROW_COUNT;
 DELETE FROM public.savings_contributions WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS s=ROW_COUNT;
 counts:=jsonb_build_object('vendors',v,'vendor_installments',i,'vendor_payments',p,'budgets',b,'tasks',t,'guests',g,'savings_contributions',s);
 INSERT INTO public.admin_audit(actor_id,action,subject_id,details)
 VALUES(uid,'planning.reset',p_workspace_id,jsonb_build_object('deleted',counts));
 RETURN counts;
END $function$
;
REVOKE ALL ON FUNCTION "public"."reset_planning_content"(p_workspace_id uuid, p_confirmation text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION "public"."reset_planning_content"(p_workspace_id uuid, p_confirmation text) TO authenticated;
CREATE OR REPLACE FUNCTION public.site_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT role FROM public.site_admins WHERE user_id=auth.uid();
$function$
;
REVOKE ALL ON FUNCTION "public"."site_role"() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION "public"."site_role"() TO authenticated;
CREATE OR REPLACE FUNCTION public.use_starter_template(p_workspace_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE uid uuid:=auth.uid(); target bigint; used bigint:=0; amount bigint; item record;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 SELECT target_budget INTO target FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=uid AND role='owner' FOR UPDATE) THEN RAISE EXCEPTION 'owner required' USING ERRCODE='42501'; END IF;
 -- Durable receipt survives reset: retries never recreate deleted examples.
 IF EXISTS(SELECT 1 FROM starter_private.applied WHERE workspace_id=p_workspace_id) THEN RETURN p_workspace_id; END IF;
 IF EXISTS(SELECT 1 FROM public.budgets WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.tasks WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.guests WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.savings_contributions WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.savings_accounts WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.vendors WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.vendor_installments WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.vendor_payments WHERE workspace_id=p_workspace_id) THEN RAISE EXCEPTION 'empty workspace required'; END IF;
 IF target IS NULL OR target<0 OR target>9007199254740991 THEN RAISE EXCEPTION 'invalid target'; END IF;
 FOR item IN SELECT * FROM (VALUES (1,'Katering',40),(2,'Venue',15),(3,'Dekorasi',10),(4,'MUA & Busana',10),(5,'Dokumentasi',8),(6,'Undangan & Souvenir',5),(7,'Mahar & Seserahan',5),(8,'Dana Darurat',7)) AS v(ord,category,pct) ORDER BY ord LOOP
  -- Integer Rupiah, final reserve absorbs floor rounding. Sum always equals user's target.
  amount:=CASE WHEN item.ord=8 THEN target-used ELSE floor(target::numeric*item.pct/100)::bigint END;
  used:=used+amount;
  INSERT INTO public.budgets(workspace_id,category,title,allocated_amount,spent_amount,payment_status,notes)
  VALUES(p_workspace_id,item.category,'[CONTOH FIKTIF] '||item.category,amount,0,'unpaid','Estimasi ilustratif proporsional dari target Anda, bukan penawaran/harga pasar. Belum ada pembayaran. Ubah sesuai kebutuhan dan penawaran vendor; target tidak diubah.');
 END LOOP;
 INSERT INTO public.tasks(workspace_id,title,phase,pic,is_completed,notes)
 SELECT p_workspace_id,'[CONTOH FIKTIF] '||v.title,v.phase,'both',false,'Rekomendasi umum yang dapat diedit; belum dilakukan. Sesuaikan dengan tanggal, adat, agama dan ketentuan resmi setempat; bukan kepastian jadwal atau persyaratan.' FROM (VALUES
 ('Sepakati prioritas, jumlah tamu dan batas anggaran','H-6 Bulan'),
 ('Bandingkan venue, kapasitas dan aksesibilitas','H-6 Bulan'),
 ('Minta rincian katering, pajak dan biaya tambahan','H-6 Bulan'),
 ('Hitung kebutuhan tabungan bulanan dari sisa target dan bulan tersisa; sepakati kontribusi tanpa mencatat transfer fiktif','H-6 Bulan'),
 ('Konfirmasi persyaratan dan jadwal pencatatan nikah pada instansi resmi','Dokumen KUA'),
 ('Siapkan dokumen identitas sesuai persyaratan resmi terbaru','Dokumen KUA'),
 ('Konsultasikan persyaratan kesehatan pada fasilitas resmi','Dokumen KUA'),
 ('Bandingkan dekorasi dan kebutuhan listrik','H-3 Bulan'),
 ('Pilih MUA, busana dan jadwal fitting','H-3 Bulan'),
 ('Sepakati dokumentasi dan hak penggunaan foto','H-3 Bulan'),
 ('Tinjau kontrak, jadwal DP, pelunasan dan pembatalan','H-3 Bulan'),
 ('Buat daftar tamu nyata dan verifikasi kontak sebelum mengundang','H-3 Bulan'),
 ('Siapkan undangan, souvenir, mahar dan seserahan sesuai kesepakatan','H-1 Bulan'),
 ('Susun rundown, PIC, transportasi dan kebutuhan konsumsi','H-1 Bulan'),
 ('Periksa dana darurat; pisahkan alokasi dari pengeluaran aktual','H-1 Bulan'),
 ('Konfirmasi vendor dan RSVP; jangan anggap contoh sebagai kehadiran','H-1 Minggu'),
 ('Briefing keluarga dan vendor; siapkan rencana cuaca darurat','H-1 Minggu'),
 ('Periksa dokumen dan jalankan rundown; catat hanya pembayaran nyata','Hari H')
 ) AS v(title,phase);
 INSERT INTO public.guests(workspace_id,name,category,pax,phone,rsvp_status,notes)
 SELECT p_workspace_id,'[CONTOH FIKTIF] '||v.name,v.category,1,NULL,'uncontacted','Placeholder ilustratif, bukan tamu nyata. Belum dihubungi/RSVP belum dikonfirmasi. Ganti/hapus sebelum mengirim undangan.' FROM (VALUES ('Tamu keluarga pria','keluarga_pria'),('Tamu keluarga wanita','keluarga_wanita'),('Tamu sahabat','sahabat')) AS v(name,category);
 INSERT INTO starter_private.applied(workspace_id) VALUES(p_workspace_id);
 RETURN p_workspace_id;
END $function$
;
REVOKE ALL ON FUNCTION "public"."use_starter_template"(p_workspace_id uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION "public"."use_starter_template"(p_workspace_id uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.vendor_immutable_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
 IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id OR NEW.id IS DISTINCT FROM OLD.id THEN RAISE EXCEPTION 'immutable scope'; END IF;
 RETURN NEW;
END $function$
;
REVOKE ALL ON FUNCTION "public"."vendor_immutable_scope"() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER savings_workspace_immutable BEFORE UPDATE ON savings_contributions FOR EACH ROW EXECUTE FUNCTION keep_savings_workspace();
CREATE TRIGGER immutable_scope BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION vendor_immutable_scope();
CREATE TRIGGER immutable_scope BEFORE UPDATE ON vendor_installments FOR EACH ROW EXECUTE FUNCTION vendor_immutable_scope();
CREATE TRIGGER immutable_scope BEFORE UPDATE ON vendor_payments FOR EACH ROW EXECUTE FUNCTION vendor_immutable_scope();

-- ===== STAGE 5 (legacy paid RLS enforcement): legacy core RLS enforcement (requires eight hosted planner tables) =====
-- >>> 06-paid-enforcement.sql sha256=6beee052e052e2dd5d7e56b1a240e686e16f09e4dfcedf3347ea76af54cfffd9 source=supabase/activation/paid-enforcement.sql
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

-- ===== STAGE 6 (capability policy map): capability policy map (requires eight paid_core_access policies) =====
-- >>> 07-capability-policy-map.sql sha256=c63896365a4bd1dc9007dde386ad7c33239d0244775958115a5c5ad7bc6ee0c9 source=supabase/candidates/capability-policy-map.sql
-- OFFLINE attachment candidate; must follow verified hosted policies. Not activation authority.
BEGIN;
-- Snapshot once, before changing policy definitions. Private rollback evidence only.
CREATE TABLE IF NOT EXISTS public.integration_helper_baseline(id boolean PRIMARY KEY CHECK(id), definition text NOT NULL);
REVOKE ALL ON public.integration_helper_baseline FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE public.integration_helper_baseline ENABLE ROW LEVEL SECURITY;
INSERT INTO public.integration_helper_baseline SELECT true,pg_catalog.pg_get_functiondef('public.has_workspace_entitlement(uuid,text)'::regprocedure) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.integration_policy_baseline(table_name text PRIMARY KEY, definition text NOT NULL);
REVOKE ALL ON public.integration_policy_baseline FROM PUBLIC,anon,authenticated,service_role;
ALTER TABLE public.integration_policy_baseline ENABLE ROW LEVEL SECURITY;
INSERT INTO public.integration_policy_baseline
SELECT tablename,format('CREATE POLICY %I ON public.%I AS %s FOR %s TO %s USING (%s) WITH CHECK (%s)',policyname,tablename,permissive,cmd,array_to_string(roles,','),qual,with_check)
FROM pg_catalog.pg_policies WHERE schemaname='public' AND policyname='paid_core_access'
AND tablename IN ('budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments')
ON CONFLICT DO NOTHING;
DO $$ BEGIN IF (SELECT count(*) FROM public.integration_policy_baseline)<>8 THEN RAISE EXCEPTION 'eight original paid policies required'; END IF; END $$;

CREATE OR REPLACE FUNCTION public.has_workspace_entitlement(ws_id uuid,feature_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT public.legacy_has_workspace_entitlement(ws_id,feature_key) OR public.has_workspace_capability_v1(ws_id,CASE WHEN feature_key='core' THEN 'collaboration' ELSE feature_key END)
$$;
DO $$ DECLARE target text; cap text; BEGIN
FOREACH target IN ARRAY ARRAY['budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments'] LOOP
cap:=CASE WHEN target IN ('savings_accounts','savings_contributions') THEN 'shared_savings' ELSE 'collaboration' END;
EXECUTE format('DROP POLICY IF EXISTS paid_core_access ON public.%I',target);
EXECUTE format('CREATE POLICY paid_core_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(public.is_workspace_member(workspace_id) AND (public.legacy_has_workspace_entitlement(workspace_id,''core'') OR public.has_workspace_capability_v1(workspace_id,%L))) WITH CHECK(public.is_workspace_member(workspace_id) AND (public.legacy_has_workspace_entitlement(workspace_id,''core'') OR public.has_workspace_capability_v1(workspace_id,%L)))',target,cap,cap);
END LOOP;
END $$;
-- SECURITY DEFINER wrapper avoids granting the internal legacy helper directly.
CREATE OR REPLACE FUNCTION public.integration_policy_access(ws uuid,cap text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT public.is_workspace_member(ws) AND (public.legacy_has_workspace_entitlement(ws,'core') OR public.has_workspace_capability_v1(ws,cap)) $$;
REVOKE ALL ON FUNCTION public.integration_policy_access(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.integration_policy_access(uuid,text) TO authenticated;
DO $$ DECLARE target text; cap text; BEGIN
FOREACH target IN ARRAY ARRAY['budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments'] LOOP
cap:=CASE WHEN target IN ('savings_accounts','savings_contributions') THEN 'shared_savings' ELSE 'collaboration' END;
EXECUTE format('DROP POLICY paid_core_access ON public.%I',target);
EXECUTE format('CREATE POLICY paid_core_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING(public.integration_policy_access(workspace_id,%L)) WITH CHECK(public.integration_policy_access(workspace_id,%L))',target,cap,cap);
END LOOP; END $$;
COMMIT;

-- ===== STAGE 7 (settlement read model): settlement read model =====
-- >>> 08-settlement-read-model.sql sha256=1008cd236dd6d7d25a15279a3cf70eaf87f2ab2df04050c880622a050a8b1774 source=supabase/candidates/settlement-read-model.sql
-- OFFLINE additive read projection only; does not mutate grants/orders.
BEGIN;
ALTER FUNCTION public.doku_workspace_orders(uuid) RENAME TO legacy_doku_workspace_orders;
REVOKE ALL ON FUNCTION public.legacy_doku_workspace_orders(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.doku_workspace_orders(p_workspace_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; orders jsonb; grants jsonb;
BEGIN
result:=public.legacy_doku_workspace_orders(p_workspace_id);
SELECT coalesce(jsonb_agg(CASE WHEN s.invoice IS NULL THEN item ELSE item || jsonb_build_object(
 'terms',s.terms,'duration_days',(s.terms->>'duration_days')::int,
 'expires_at',s.expires_at,'revoked_at',r.revoked_at) END ORDER BY ordinal),'[]'::jsonb)
INTO orders FROM jsonb_array_elements(result->'orders') WITH ORDINALITY a(item,ordinal)
LEFT JOIN public.package_settlements s ON s.invoice=item->>'invoice'
LEFT JOIN public.package_settlement_revocations r ON r.invoice=s.invoice;
SELECT coalesce(jsonb_agg(g),'[]'::jsonb) INTO grants FROM (
 SELECT jsonb_build_object('feature',f.feature,'payment_provider','doku','payment_reference',s.invoice,
 'expires_at',s.expires_at,'revoked_at',r.revoked_at,'terms',s.terms) g
 FROM public.package_settlements s LEFT JOIN public.package_settlement_revocations r ON r.invoice=s.invoice
 CROSS JOIN LATERAL (SELECT 'core' feature WHERE s.terms->'benefits' ? 'collaboration'
 UNION ALL SELECT 'shared_savings' WHERE s.terms->'benefits' ? 'shared_savings'
 UNION ALL SELECT s.terms->>'tier' WHERE s.terms->>'contract_version'='1' AND s.terms->>'tier' IN ('starter','premium','wedding_pro')) f
 WHERE s.workspace_id=p_workspace_id
) projection;
RETURN result || jsonb_build_object('orders',orders,'entitlements',(result->'entitlements')||grants);
END $$;
REVOKE ALL ON FUNCTION public.doku_workspace_orders(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.doku_workspace_orders(uuid) TO authenticated,service_role;
COMMIT;
