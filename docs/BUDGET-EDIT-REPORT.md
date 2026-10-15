# Budget edit — isolated, not released

## Scope and decision
- Worktree: `C:/Users/PC/AppData/Local/hermes/cache/scratch/wedding-template-audit`; HEAD `2903c83f55d0f781d70d0163dc8e008441b44678` (expected origin/main baseline). Canonical `D:/wedding-planner` not touched.
- Each budget card now exposes a text Edit button with an item-specific accessible name. Editor prefills title, custom/legacy category, allocation, actual spending, manual payment status and notes. Existing scoped `updateBudget` awaits cloud mutation and authorized reload before closing.
- Allocation is an estimate/plafon, NOT an invoice. User clarification supersedes the initial stricter proposal: **paid below allocation is valid**. Unpaid requires actual zero; DP/paid require actual positive. No derived payment status, invented deposit, vendor-ledger sync or duplicate accounting.
- Existing inconsistent DP/Rp0 records are not rewritten on read/open/cancel; user must enter a real actual amount or choose unpaid before saving.
- Money must be a nonnegative safe integer. Title/category must be nonblank and bounded to 200/100 characters; notes bounded to 2000. Validation applies to budget inserts and updates at the client cloud boundary. Updating status or actual requires both fields, preventing inconsistent partial status updates. Other partial updates remain supported.
- Save error leaves the dialog and every entered value intact, with an inline alert. Cancel/Escape/backdrop cause no writes; close is blocked during a pending save. A failed authorized reload can follow a committed PATCH: the message deliberately says unconfirmed, not rolled back.

## Files
Production:
- `src/app/dashboard/page.tsx`: edit action and editor state/mount.
- `src/components/everrae/budget-editor.tsx`: six-field editor, guidance, validation, failure/cancel handling.
- `src/lib/budget-validation.ts`: shared client validation.
- `src/lib/cloud-workspace.ts`: invoke validation before allowlisted budget transport; existing immutable workspace/id filters retained.
- `src/components/everrae/planner-dialog.tsx`: include textarea and exclude directly disabled controls in focus traversal.
Tests:
- `scripts/test-budget.cjs`: invalid status/amount/text, paid below estimate, scoped IDs/allowlist.
- `scripts/test-budget-browser.py`: intercepted local editor contract and responsive geometry.
- `scripts/test-cloud.cjs`: resolve transpiled TS modules from absolute file paths so the new relative validator import works.
- `docs/BUDGET-EDIT-REPORT.md`: this report.
Existing dirty graph/evidence files preserved; Graphify update refreshes graph outputs/cache and creates its own curated backups.

## Executed evidence
- RED `node scripts/test-budget.cjs`: failed `Missing expected rejection` against original cloud client.
- GREEN same command: PASS invalid status/money/text rejection before database transport, paid below estimate allowed, scoped IDs and field allowlist.
- RED browser against fixture static build: timed out waiting for absent `Edit Fotografer` action.
- GREEN `python scripts/test-budget-browser.py`: PASS legacy DP0 untouched, six-field prefill, cancel zero writes, invalid status/nominal zero writes, paid 100 below allocation1000, failed save retaining values, successful scoped PATCH and reload persistence, dialog/page geometry at 360/390/430/1280. Exactly two PATCH attempts (one intentionally failed, one successful); no vendor writes. Edge, fixture config, service workers blocked, every fixture Supabase request intercepted.
- `npm run lint`: PASS, zero warnings.
- `npx tsc --noEmit`: PASS.
- PASS node suites: test-budget, test-cloud, test-workspace-storage, test-guest-csv, test-whatsapp, test-priorities.
- `npm run test:backend`: 20 SQL tests PASS.
- PASS SQL suites: test-starter-template.mjs, test-vendor.mjs, test-wa-cloud.mjs.
- PASS intercepted browser suites: test-starter-browser.py, test-vendor-browser.py, test-whatsapp-browser.py.
- Extra legacy `test-guest-csv-browser.py` attempt failed before assertions: its hardcoded external localhost:4190 preview returned ERR_EMPTY_RESPONSE. Not a budget-flow failure; no claim that suite passed.
- Fixture `npm run build`: PASS. Then plain `npm run build` restored real public configuration from existing environment without reading/printing `.env` contents. Export scan PASS: no `fixture.supabase.co` in JS.
- `git diff --check`: PASS.
- `graphify update .`: AST-only refresh; 613 nodes / 971 edges / 66 communities at first post-change run. Semantic docs not refreshed; CLI warns community labels need refresh and skips unsupported file types. Query output was budget-truncated; relevant source was inspected directly.

## Limitations / release gates
- UI/client-only stage: no DB migration, hosted data reads/writes, commit, push or deployment. Direct API callers are not protected by this new client validation; existing SQL constraints/RLS remain unchanged. Existing inconsistent rows are not migrated.
- Browser persistence/tenant-filter evidence is transport-fixture evidence, not hosted partner/RLS or independent-device verification. Local SQL suites exercise existing backend behavior, not a new budget status SQL constraint.
- Safe-integer per-row validation does not change legacy dashboard number-based aggregate sums; extreme multi-row aggregate overflow is outside this stage.
- Final export is real-config, but **do not release** until parent review/authorization. Existing dirty evidence and graph artifacts are not part of an automatically approved release patch.
