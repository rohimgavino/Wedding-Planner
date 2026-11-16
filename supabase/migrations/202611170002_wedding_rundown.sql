-- ==============================================================================
-- SKEMA RUNDOWN HARI H (WEDDING DAY ITINERARY / TIMELINE)
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.wedding_rundown_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    session TEXT NOT NULL CHECK (session IN ('persiapan', 'akad', 'temu_manten', 'resepsi', 'after_party', 'lainnya')) DEFAULT 'akad',
    time_start TEXT NOT NULL CHECK (time_start ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
    time_end TEXT CHECK (time_end IS NULL OR time_end ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
    activity TEXT NOT NULL CHECK (length(btrim(activity)) BETWEEN 1 AND 250),
    pic_name TEXT DEFAULT '',
    pic_phone TEXT DEFAULT '',
    location TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indeks performa query per workspace & urutan waktu
CREATE INDEX IF NOT EXISTS idx_rundown_workspace_order 
    ON public.wedding_rundown_events(workspace_id, session, sort_order, time_start);

-- Aktifkan RLS
ALTER TABLE public.wedding_rundown_events ENABLE ROW LEVEL SECURITY;

-- Hak RLS: Anggota workspace dapat melakukan CRUD
CREATE POLICY rundown_member_all ON public.wedding_rundown_events
    FOR ALL TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

-- Table Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_rundown_events TO authenticated;

COMMIT;
