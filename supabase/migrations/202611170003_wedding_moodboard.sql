-- ==============================================================================
-- SKEMA MOODBOARD PERNIKAHAN & PALET WARNA (WEDDING MOODBOARD & COLOR PALETTE)
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.wedding_color_palettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Palet Tema Utama' CHECK (length(btrim(name)) BETWEEN 1 AND 100),
    primary_color TEXT NOT NULL DEFAULT '#C86D51' CHECK (primary_color ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'),
    secondary_color TEXT NOT NULL DEFAULT '#7D8D78' CHECK (secondary_color ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'),
    accent_color TEXT NOT NULL DEFAULT '#E6D5B8' CHECK (accent_color ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'),
    neutral_color TEXT NOT NULL DEFAULT '#FDFBF7' CHECK (neutral_color ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_palette_workspace UNIQUE (workspace_id)
);

CREATE TABLE IF NOT EXISTS public.wedding_moodboard_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('dekorasi', 'busana_pengantin', 'rias_makeup', 'bunga_handbouquet', 'foto_video', 'undangan_souvenir', 'kue_catering', 'lainnya')) DEFAULT 'dekorasi',
    title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 150),
    image_url TEXT NOT NULL CHECK (image_url ~ '^https?://.+' OR image_url ~ '^/images/.+' OR image_url ~ '^data:image/.+'),
    color_hex TEXT CHECK (color_hex IS NULL OR color_hex ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'),
    notes TEXT DEFAULT '',
    source_link TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indeks performa query
CREATE INDEX IF NOT EXISTS idx_moodboard_workspace_cat 
    ON public.wedding_moodboard_items(workspace_id, category, sort_order);

-- Aktifkan RLS
ALTER TABLE public.wedding_color_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_moodboard_items ENABLE ROW LEVEL SECURITY;

-- Hak RLS: Anggota workspace dapat melakukan CRUD
CREATE POLICY palette_member_all ON public.wedding_color_palettes
    FOR ALL TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY moodboard_member_all ON public.wedding_moodboard_items
    FOR ALL TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

-- Table Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_color_palettes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_moodboard_items TO authenticated;

COMMIT;
