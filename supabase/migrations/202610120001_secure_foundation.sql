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
