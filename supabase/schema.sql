-- ==============================================================================
-- SKEMA DATABASE WEDDING PLANNER PWA (SUPABASE POSTGRESQL) - TAHAP 1 (MVP)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL, -- Contoh: "BCA Bersama", "Bank Jago Wedding"
    target_amount BIGINT DEFAULT 0,
    current_balance BIGINT DEFAULT 0,
    account_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABEL BUDGETS (Plafon Kategori & Realisasi Pengeluaran)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Helper function: verifikasi apakah user adalah member dari workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.workspace_members
        WHERE workspace_id = ws_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Workspaces Policies
CREATE POLICY "Member dapat melihat workspacenya"
    ON public.workspaces FOR SELECT
    USING (public.is_workspace_member(id));

CREATE POLICY "User terdaftar dapat membuat workspace"
    ON public.workspaces FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Member dapat mengupdate workspace"
    ON public.workspaces FOR UPDATE
    USING (public.is_workspace_member(id));

-- Workspace Members Policies
CREATE POLICY "Member dapat melihat sesama member di workspace"
    ON public.workspace_members FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "User dapat menambahkan dirinya sendiri sebagai owner atau saat menerima invite"
    ON public.workspace_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Budgets Policies
CREATE POLICY "Member dapat melihat budget workspace"
    ON public.budgets FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Member dapat mengelola budget workspace"
    ON public.budgets FOR ALL
    USING (public.is_workspace_member(workspace_id));

-- Tasks Policies
CREATE POLICY "Member dapat melihat tasks workspace"
    ON public.tasks FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Member dapat mengelola tasks workspace"
    ON public.tasks FOR ALL
    USING (public.is_workspace_member(workspace_id));

-- Guests Policies
CREATE POLICY "Member dapat melihat daftar tamu"
    ON public.guests FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Member dapat mengelola daftar tamu"
    ON public.guests FOR ALL
    USING (public.is_workspace_member(workspace_id));

-- Savings Accounts Policies
CREATE POLICY "Member dapat melihat rekening tabungan"
    ON public.savings_accounts FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Member dapat mengelola rekening tabungan"
    ON public.savings_accounts FOR ALL
    USING (public.is_workspace_member(workspace_id));
