-- OPERATOR-ONLY, OUTSIDE AUTOMATIC MIGRATIONS. LOCAL REVIEW ARTIFACT; NOT APPLIED.
-- Requires an already-authenticated, independently verified operator/developer session.
-- Never bootstrap a role, impersonate a JWT, change settings or enable sales here.
-- Preconditions: reviewed tier schema exists; each current tier is still version 1.
-- Expected versions are intentional constants, NOT a SELECT of the latest versions.
-- Any conflict/error aborts the entire transaction; issue ROLLBACK after failure.
-- Do not rerun with raised versions without fresh inventory and separate review.
BEGIN;

SELECT public.admin_update_tier_price(
  p_package_id => 'starter',
  p_expected_version => '1',
  p_config => '{"amount_idr":"75000","promo":null}'::jsonb,
  p_reason => 'Business-approved Starter IDR 75000; price configuration only, no sales activation',
  p_confirmed => true
);
SELECT public.admin_update_tier_price(
  p_package_id => 'premium',
  p_expected_version => '1',
  p_config => '{"amount_idr":"155000","promo":null}'::jsonb,
  p_reason => 'Business-approved Premium IDR 155000; price configuration only, no sales activation',
  p_confirmed => true
);
SELECT public.admin_update_tier_price(
  p_package_id => 'wedding_pro',
  p_expected_version => '1',
  p_config => '{"amount_idr":"255000","promo":null}'::jsonb,
  p_reason => 'Business-approved Wedding Pro IDR 255000; price configuration only, no sales activation',
  p_confirmed => true
);

COMMIT;
-- Separate readback (same authenticated session):
SELECT public.admin_tier_catalog();
