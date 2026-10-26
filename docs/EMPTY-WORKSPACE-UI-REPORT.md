# Empty authenticated workspace UI fix

## Root cause and red evidence
The existing `.planner-empty [class*="bg-gradient"]` selector styled both the EverRae badge and onboarding anchor. Its specificity beat Tailwind `w-full` and its `font` shorthand replaced the CTA typography. Edge transport fixture at 360px measured CTA 100×112px, font 18px serif, off-center with text outside its bounds. Card top was 157px; fixed Android install banner overlapped the card.

## Minimal production changes
Only `src/app/dashboard/dashboard.css` and `src/components/InstallPwaBanner.tsx` were changed for this fix. Dashboard JSX and all pending paid/admin/reset/developer files were left untouched.
- Scope the gradient badge override to the card's direct div badge, excluding anchors.
- Scope empty-layout overrides to the onboarding anchor state: remove full-viewport centering, fixed 24px card padding, full-width CTA with 44px minimum target, wrapping and focus outline.
- Add `pwa-install-banner` class to both existing Android/iOS banner roots.
- Only in this empty state, banner uses normal document flow, wraps at large text, and has 44px button targets. Other page banners remain fixed.

## Verification
`NEXT_PUBLIC_SUPABASE_URL=https://fixture.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_fixture npm run build` passed. New `python scripts/test-empty-workspace-browser.py` uses real exported dashboard and AuthGate/WorkspaceProvider, intercepted authenticated user plus empty `workspaces` response. No actual account identity assumed, no hosted requests/writes; service workers blocked.

Both Android event and iOS-UA branches passed at 360/390/430/1280px with 100% and 200% root text (16 cases). Range rectangles all fit CTA bounds, CTA centered, no horizontal document overflow, banner below full card/guidance. Standard CTA sizes respectively 278×48, 308×48, 348×48, 398×48px; 200% sizes 278×136, 308×136, 348×136, 846×96px. Card top 60px standard and 96px enlarged. Read-only filling guidance opened/closed successfully in working tree.

Passed: `npm run lint`; guidance/reset browser suite (all four widths, cancellation/Escape/error/success/owner guard); cloud contract, savings, CSV regression scripts. Fixtures do not prove hosted backend behavior or actual Safari engine rendering.

## Safe baseline isolation
HEAD/baseline `a26c6159` (`a26c615`). `docs/EMPTY-WORKSPACE-UI.patch` contains ONLY the two production files above against that baseline. CSS is already a single minified line, so diff shows a large textual hunk, but changes are one selector replacement plus the appended scoped block. No dashboard page hunk, paid imports, migrations or entitlement changes are required.

Separately extracted a26c615 into Hermes scratch, copied only these two production files and test, and ran fresh npm ci, fixture build, 16-case browser test and lint successfully. Baseline build contained 11 static pages, no admin/purchase additions. Initial cross-drive node_modules junction failed Webpack resolution; fresh isolated install resolved it. npm ci reported 7 high-severity audit findings in the unchanged baseline dependency tree; no dependency edits made.

DO NOT deploy the current working-tree `out/`: it contains unreleased paid/admin/reset/developer features. Future UI-only release must use a26c615 plus the two-file patch, authorized production public config, and separate release verification. The final local default build restores default configuration but remains the unreleased working tree. No migrations applied, no deploy/push/commit, no working-tree revert. Existing guidance is preserved in working tree; it is not in baseline and intentionally excluded from this migration-independent patch.
