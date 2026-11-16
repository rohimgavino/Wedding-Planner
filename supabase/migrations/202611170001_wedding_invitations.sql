-- ==============================================================================
-- SKEMA UNDANGAN DIGITAL & BUKU UCAPAN (WEDDING INVITATIONS & WISHES)
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.wedding_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    theme TEXT NOT NULL DEFAULT 'classic-ivory' CHECK (theme IN ('classic-ivory', 'sage-garden', 'romantic-rose', 'midnight-gold')),
    quote_title TEXT DEFAULT 'Surat Ar-Rum : 21',
    quote_body TEXT DEFAULT 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
    groom_full_name TEXT NOT NULL DEFAULT '',
    groom_nickname TEXT NOT NULL DEFAULT '',
    groom_parents TEXT DEFAULT '',
    bride_full_name TEXT NOT NULL DEFAULT '',
    bride_nickname TEXT NOT NULL DEFAULT '',
    bride_parents TEXT DEFAULT '',
    akad_date DATE,
    akad_time TEXT DEFAULT '08:00 - 10:00 WIB',
    akad_venue TEXT DEFAULT 'Masjid Jami'' / Kediaman Mempelai',
    akad_address TEXT DEFAULT '',
    akad_maps_url TEXT DEFAULT '',
    resepsi_date DATE,
    resepsi_time TEXT DEFAULT '11:00 - 14:00 WIB',
    resepsi_venue TEXT DEFAULT 'Gedung Pertemuan / Ballroom',
    resepsi_address TEXT DEFAULT '',
    resepsi_maps_url TEXT DEFAULT '',
    gift_bank_name TEXT DEFAULT '',
    gift_account_number TEXT DEFAULT '',
    gift_account_holder TEXT DEFAULT '',
    gift_address TEXT DEFAULT '',
    music_url TEXT DEFAULT '/audio/wedding-acoustic.mp3',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_invitation_workspace UNIQUE (workspace_id),
    CONSTRAINT uq_invitation_slug UNIQUE (slug),
    CONSTRAINT chk_invitation_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 60)
);

CREATE TABLE IF NOT EXISTS public.wedding_invitation_wishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES public.wedding_invitations(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL CHECK (length(btrim(guest_name)) BETWEEN 1 AND 100),
    attendance TEXT NOT NULL CHECK (attendance IN ('attending', 'not_attending', 'tentative')),
    pax INTEGER NOT NULL DEFAULT 1 CHECK (pax BETWEEN 1 AND 10),
    message TEXT NOT NULL CHECK (length(btrim(message)) BETWEEN 1 AND 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indeks performa
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON public.wedding_invitations(slug);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace ON public.wedding_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_wishes_invitation_created ON public.wedding_invitation_wishes(invitation_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.wedding_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wedding_invitation_wishes ENABLE ROW LEVEL SECURITY;

-- Hak RLS wedding_invitations
CREATE POLICY invitation_public_read ON public.wedding_invitations
    FOR SELECT TO anon, authenticated
    USING (is_published = true);

CREATE POLICY invitation_member_all ON public.wedding_invitations
    FOR ALL TO authenticated
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

-- Hak RLS wedding_invitation_wishes
CREATE POLICY wishes_public_read ON public.wedding_invitation_wishes
    FOR SELECT TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM public.wedding_invitations i
        WHERE i.id = wedding_invitation_wishes.invitation_id AND i.is_published = true
    ));

CREATE POLICY wishes_public_insert ON public.wedding_invitation_wishes
    FOR INSERT TO anon, authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.wedding_invitations i
        WHERE i.id = wedding_invitation_wishes.invitation_id AND i.is_published = true
    ));

CREATE POLICY wishes_member_manage ON public.wedding_invitation_wishes
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.wedding_invitations i
        WHERE i.id = wedding_invitation_wishes.invitation_id
        AND public.is_workspace_member(i.workspace_id)
    ));

-- Fungsi helper submit ucapan dari publik
CREATE OR REPLACE FUNCTION public.submit_invitation_wish(
    p_slug TEXT,
    p_guest_name TEXT,
    p_attendance TEXT,
    p_pax INTEGER,
    p_message TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_inv public.wedding_invitations;
    v_wish public.wedding_invitation_wishes;
BEGIN
    SELECT * INTO v_inv
    FROM public.wedding_invitations
    WHERE slug = p_slug AND is_published = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'invitation_not_found_or_unpublished';
    END IF;

    IF p_guest_name IS NULL OR length(btrim(p_guest_name)) < 1 THEN
        RAISE EXCEPTION 'invalid_guest_name';
    END IF;

    IF p_attendance NOT IN ('attending', 'not_attending', 'tentative') THEN
        RAISE EXCEPTION 'invalid_attendance_status';
    END IF;

    IF p_pax < 1 OR p_pax > 10 THEN
        RAISE EXCEPTION 'invalid_pax_count';
    END IF;

    IF p_message IS NULL OR length(btrim(p_message)) < 1 THEN
        RAISE EXCEPTION 'invalid_message';
    END IF;

    INSERT INTO public.wedding_invitation_wishes (
        invitation_id, guest_name, attendance, pax, message
    ) VALUES (
        v_inv.id, btrim(p_guest_name), p_attendance, p_pax, btrim(p_message)
    ) RETURNING * INTO v_wish;

    RETURN to_jsonb(v_wish);
END;
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.wedding_invitations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_invitations TO authenticated;
GRANT SELECT, INSERT ON public.wedding_invitation_wishes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wedding_invitation_wishes TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_invitation_wish(TEXT, TEXT, TEXT, INTEGER, TEXT) TO anon, authenticated;

COMMIT;
