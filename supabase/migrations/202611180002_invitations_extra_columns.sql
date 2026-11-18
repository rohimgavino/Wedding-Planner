-- ==============================================================================
-- MIGRATION: ADD COVER PHOTO, INSTAGRAM HANDLES, AND SUPPORT ALL 12 THEMES
-- ==============================================================================

BEGIN;

-- 1. Add extra columns for Prewedding Photo and Instagram profiles
ALTER TABLE public.wedding_invitations
    ADD COLUMN IF NOT EXISTS cover_photo_url TEXT DEFAULT '/images/wedding-flowers.jpg',
    ADD COLUMN IF NOT EXISTS groom_instagram TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS bride_instagram TEXT DEFAULT '';

-- 2. Drop legacy check constraint if exists
ALTER TABLE public.wedding_invitations 
    DROP CONSTRAINT IF EXISTS wedding_invitations_theme_check;

-- 3. Add updated constraint supporting all 12 cultural & modern themes
ALTER TABLE public.wedding_invitations
    ADD CONSTRAINT wedding_invitations_theme_check
    CHECK (theme IN (
        'classic-ivory',
        'sage-garden',
        'romantic-rose',
        'midnight-gold',
        'jawa-keraton',
        'bugis-pinisi',
        'minang-songket',
        'bali-dewata',
        'sunda-siger',
        'batak-gorga',
        'islamic-arabesque',
        'monochrome-editorial'
    ));

COMMIT;
