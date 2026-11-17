-- ==============================================================================
-- SKEMA HONEYMOON PLANNER (TRIP, BUDGETING, & ITINERARY)
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.wedding_honeymoon_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    destination TEXT NOT NULL DEFAULT 'Ubud & Seminyak, Bali' CHECK (length(btrim(destination)) BETWEEN 1 AND 150),
    start_date DATE,
    end_date DATE,
    target_budget BIGINT NOT NULL DEFAULT 15000000 CHECK (target_budget >= 0),
    hotel_name TEXT DEFAULT '',
    booking_code TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_honeymoon_trip_workspace UNIQUE (workspace_id)
);

CREATE TABLE IF NOT EXISTS public.wedding_honeymoon_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('transportasi', 'hotel_resort', 'kuliner', 'wisata', 'belanja_souvenir', 'lainnya')) DEFAULT 'hotel_resort',
    title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 150),
    allocated_amount BIGINT NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
    spent_amount BIGINT NOT NULL DEFAULT 0 CHECK (spent_amount >= 0),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'dp', 'paid')) DEFAULT 'unpaid',
    booking_reference TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.wedding_honeymoon_itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 30),
    time_start TEXT CHECK (time_start IS NULL OR time_start ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
    activity TEXT NOT NULL CHECK (length(btrim(activity)) BETWEEN 1 AND 250),
    location TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indeks performa
CREATE INDEX IF NOT EXISTS idx_honeymoon_expenses_ws ON public.wedding_honeymoon_expenses(workspace_id, category);
CREATE INDEX IF NOT EXISTS idx_honeymoon_itin_ws_day ON public.wedding_honeymoon_itineraries(workspace_id, day_number, sort_order);

-- Aktifkan RLS
ALTER TABLE public.wedding_honeymoon_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_honeymoon_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_honeymoon_itineraries ENABLE ROW LEVEL SECURITY;

-- Hak RLS: Anggota workspace dapat melakukan CRUD
CREATE POLICY honeymoon_trip_member_all ON public.wedding_honeymoon_trips
    FOR ALL TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY honeymoon_expenses_member_all ON public.wedding_honeymoon_expenses
    FOR ALL TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY honeymoon_itin_member_all ON public.wedding_honeymoon_itineraries
    FOR ALL TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

-- Table Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_honeymoon_trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_honeymoon_expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_honeymoon_itineraries TO authenticated;

COMMIT;
