# Bounded remaining frontend/JWT gates — local only

## Outcome
All requested local gates passed on 2026-11-14. No business source edits, production requests/DDL, git operations or deployments were performed. This report is separate from the independent installer review.

## Extended browser regression
`scripts/test-editable-starter-browser.py` exercises the real exported mounted React UI with intercepted fixture transport:
- User-only changes invalidate budget editor, task editor and confirmed starter preview; returning to the original user does not resurrect dialogs; no mutation was dispatched during these open-dialog changes.
- Six held-response cases: budget PATCH, task PATCH and starter RPC, each crossing a user change and a workspace change after dispatch. Auth changes use the Supabase cross-tab BroadcastChannel notification, not React internals. The workspace case uses the same authenticated identity notification to refresh mounted providers while ordinary focus refresh is locked during saves.
- Each case proves one request was already dispatched before changing context; dialogs invalidate; late success does not surface a starter success status or resurrect the old dialog; no retry/retarget mutation occurs. PATCH fixture rows commit at dispatch and remain changed: dialog invalidation is explicitly NOT transactional cancellation.
- Existing persistence/reload/error-retained-input, disjoint finance, same-field and coupled-finance CAS, confirmation/dedupe/partner/mobile cases still pass.

New coverage passed the existing reviewed implementation immediately. No new RED/production fix is claimed. Transport remains mocked; these are not hosted B1 sessions.

## Genuine JWT/PostgREST local gates
Extended scratch harness `C:/Users/MSI/AppData/Local/hermes/cache/scratch/editable-jwt-gates.py`; machine results at sibling `editable-jwt-results.json`.
- Native PostgreSQL 17.11, isolated ephemeral cluster, captured-schema reconstruction (not historical chain replay).
- Official pinned PostgREST image `postgrest/postgrest@sha256:5f4ce744539bbba786b4e24dbbd95bdb2a956dcf568c5374995a0ff4a68f5bd2`, HTTP bound to loopback, locally verified HS256 JWTs with ephemeral secret. No secrets/tokens logged.
- Prior owner provisioning/repeat and partner/outsider/anonymous denial, unpaid CRUD denial and private receipt exposure checks passed again.
- Fixture administrator inserted only a local paid core entitlement. Genuine paid-owner and paid-partner JWTs each successfully inserted, read, updated and deleted both budget and task rows.
- Two real JWT sessions used the same original budget/task title. Partner update succeeded; stale owner same-field conditional PATCH returned actual HTTP 200 with `[]`, preserving partner title.
- Partner finance update followed by owner title-only CAS returned a row preserving allocated 200, spent 100 and payment status `dp`.
- Cleanup output: `OWNED_CONTAINER_STOP 0`, `OWNED_CLUSTER_STOP 0`, `OWNED_CLUSTER_REMOVED`.

## Final command evidence
Single sequential run, exit 0:
- `node scripts/test-editable-starter.mjs`: 6 PASS groups.
- `npm run test:paid-rls`: 15 paid-access + 9 paid-stage tests PASS.
- `node scripts/test-developer-stage.mjs`: 7 PASS.
- `node scripts/test-planning-reset.mjs`: 5 PASS (legacy four-table local PGlite fixture).
- `node scripts/test-developer-ui.cjs` and `node scripts/test-cloud.cjs`: PASS.
- `npm run lint`, `npx tsc --noEmit`: PASS.
- `NEXT_PUBLIC_SUPABASE_URL=https://fixture.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_fixture npm run build`: PASS, 13 static pages, 2 exports.
- `py -3.15 scripts/test-editable-starter-browser.py`: PASS, including all added identity/pending cases.

Build is a LOCAL FIXTURE EXPORT, NOT DEPLOY OUTPUT. GitHub release must build again with approved real public configuration. Existing multiple-lockfile workspace-root warning persists; installed Next reports 15.5.27 while manifest pins 15.5.28. No dependency/source changes attempted.

Candidate and migration bytes both remain SHA256 `fd355d340616c84da6a9bc76f64b272561e17c990d12c182780f687c062ff334`. `supabase/.temp`, existing `docs/release/stage-b1-real-session-20261114.md`, and `out` remain present; no deletion was performed. `out` was refreshed by the explicitly local fixture build. No local blocker or business-source defect was found. Hosted installation/deployment/real-session verification is outside this bounded task.
