# Logout UI verification — 2026-10-15

## Scope
Implemented locally in the isolated scratch checkout at baseline `fd664e7`. No commit, push, deployment, hosted requests or hosted writes. Canonical `D:/wedding-planner` was not touched. Existing dirty graph and audit evidence retained.

## Changes
- Replaced the rose underlined AuthGate logout link with a quiet forest-outline button, explicit **Keluar** text and decorative Lucide LogOut icon. Shared gate placement keeps it available on protected pages, including onboarding/empty workspaces; not a primary dashboard action.
- Added an opaque portal confirmation using existing PlannerDialog: **Keluar dari akun?**, explanation that cloud-saved data remains, **Batal** / **Keluar** actions, initial focus on Batal, focus containment, Escape and focus return. Pending state disables both actions and prevents dismissal/duplicate submission.
- Sign-out still uses Supabase `auth.signOut({scope:'local'})`, with navigation only after success. No planner deletion, browser-storage wipe, or auth bypass.
- Fixed the preexisting premature user clearing and swallowed logout failure. Failed revocation remains visible in the dialog with a retry path. Installed Supabase SDK removes its local session even on HTTP 500: restore through SDK `setSession` with token validation, not manual auth-storage manipulation; if restoration fails, fail closed rather than retain an invalid authenticated UI.

## Files
Production:
- `src/components/auth-gate.tsx`
- `src/context/auth-context.tsx`
- `src/components/everrae/logout-button.tsx` (new)
- `src/components/everrae/logout-button.css` (new)
Verification: `scripts/test-logout-browser.py` (new), this report. Graphify generated outputs updated separately; original graph dirt preserved.

## RED → GREEN evidence
1. New cancellation test run against baseline fixture build failed because the confirmation dialog was missing; the old control immediately navigated to login. Implemented confirmation; test passed.
2. Added failed-revocation/retained-session test. It failed because AuthProvider cleared identity before sign-out; first correction still failed because SDK emitted SIGNED_OUT and removed session on HTTP 500. Added SDK-mediated restoration and event handling; test passed.
3. Extended actual browser contract to keyboard, geometry, pending double-click and successful confirmation. Passed against the same production bundle, with all external traffic intercepted and service workers blocked.

## Executed checks
All following passed:
- Fixture-config `npm run build` (several RED/GREEN cycles; overrides scoped to the build command).
- `python scripts/test-logout-browser.py` — cancel zero logout requests; failed revocation exactly one request and visible error, dashboard/auth retained; keyboard Enter, Shift+Tab/Tab containment, Escape and focus restoration; confirmation exactly one request despite two synchronous click events; pending controls disabled and Escape ignored; successful `/login` navigation, auth token removed, legacy workspace value retained. Zero planner writes; no unexpected external requests.
- `npm run lint` — zero warnings.
- `npx tsc --noEmit`.
- `python scripts/test-budget-browser.py` — existing edit/cancel/failure/scoped-save/reload and geometry contract.
- `node scripts/test-cloud.cjs` — redirect/config/callback, tenant-scoped CRUD/RPC and rejection contracts.
- `node scripts/test-workspace-storage.cjs` — migration/preservation/invalid-schema contracts.
- `graphify update .` — 628 nodes, 993 edges, 67 communities. AST-only update; 27 unsupported files skipped, saved community labels partially stale (6 renamed); no semantic-doc re-extraction claimed.
- Final **real configuration** `npm run build`, reading existing `.env.local` through Next only; file not opened, edited or printed. Followed by `npx tsc --noEmit`, `git diff --check` and byte scan of every exported file: **zero** occurrences of `fixture.supabase.co`, `sb_publishable_fixture` or `KEEP-LEGACY`.

### Measured geometry (844px height)
| Viewport | Logout target | Target x/y | Dialog x/y | Dialog width/height |
|---|---|---|---|---|
|360|98 × 44|246 / 112|16 / 272.05|328 / 299.89|
|390|98 × 44|276 / 92|16 / 272.05|358 / 299.89|
|430|98 × 44|316 / 92|16 / 283.95|398 / 276.09|
|1280|98 × 44|1158 / 54|360 / 279.95|560 / 284.09|

All dialog actions >=44px high, viewport-contained; no document/dialog horizontal overflow. Dialog computed background is opaque white at all widths. Browser fixture uses installed Edge and local static export.

## Limitations / release gates
- Intercepted browser transport is not hosted end-to-end evidence. No real account logout or backend mutation was attempted.
- No full historical browser-suite claim: `test-auth-configured-browser.py` still describes an older cloud fixture shape and immediate-logout contract; dedicated new logout fixture supersedes that part. It was not weakened or presented as passing.
- No visual screenshot review claimed; verification is DOM, geometry, computed style, keyboard, transport and build based.
- No release authorized or performed. Final export is restored to real public configuration, not the fixture build.
