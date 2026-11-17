-- ==============================================================================
-- SKEMA ENGAGEMENT / LAMARAN PLANNER (EVENT, SESERAHAN, & RUNDOWN)
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.wedding_engagement_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    event_date DATE,
    event_time TEXT DEFAULT '09:00 - 12:00 WIB',
    venue_name TEXT NOT NULL DEFAULT 'Kediaman Mempelai Wanita' CHECK (length(btrim(venue_name)) BETWEEN 1 AND 150),
    venue_address TEXT DEFAULT '',
    spokesperson_groom TEXT DEFAULT '',
    spokesperson_bride TEXT DEFAULT '',
    target_budget BIGINT NOT NULL DEFAULT 8000000 CHECK (target_budget >= 0),
    guest_count INTEGER DEFAULT 30 CHECK (guest_count >= 0),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_engagement_event_workspace UNIQUE (workspace_id)
);

CREATE TABLE IF NOT EXISTS public.wedding_engagement_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('groom_to_bride', 'bride_to_groom')) DEFAULT 'groom_to_bride',
    box_number INTEGER DEFAULT 1 CHECK (box_number BETWEEN 1 AND 50),
    title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 150),
    category TEXT NOT NULL CHECK (category IN ('cincin', 'ibadah', 'perhiasan', 'busana', 'makeup_skincare', 'sepatu_tas', 'makanan_buah', 'lainnya')) DEFAULT 'ibadah',
    status TEXT NOT NULL CHECK (status IN ('planned', 'purchased', 'decorating', 'ready')) DEFAULT 'planned',
    estimated_cost BIGINT NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.wedding_engagement_rundowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    time_start TEXT NOT NULL CHECK (time_start ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
    time_end TEXT CHECK (time_end IS NULL OR time_end ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
    activity TEXT NOT NULL CHECK (length(btrim(activity)) BETWEEN 1 AND 250),
    pic_name TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indeks performa
CREATE INDEX IF NOT EXISTS idx_engagement_gifts_ws_dir ON public.wedding_engagement_gifts(workspace_id, direction, box_number);
CREATE INDEX IF NOT EXISTS idx_engagement_rundowns_ws_order ON public.wedding_engagement_rundowns(workspace_id, sort_order, time_start);

-- Aktifkan RLS
ALTER TABLE public.wedding_engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_engagement_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_engagement_rundowns ENABLE ROW LEVEL SECURITY;

-- Hak RLS: Anggota workspace dapat melakukan CRUD
CREATE POLICY engagement_event_member_all ON public.wedding_engagement_events
    FOR ALL TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY engagement_gifts_member_all ON public.wedding_engagement_gifts
    FOR ALL TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY engagement_rundowns_member_all ON public.wedding_engagement_rundowns
    FOR ALL TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

-- Table Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_engagement_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_engagement_gifts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_engagement_rundowns TO authenticated;

COMMIT;
