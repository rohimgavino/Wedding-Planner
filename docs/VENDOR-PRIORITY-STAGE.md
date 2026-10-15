# Vendor bookkeeping and weekly priorities — local review artifact

Worktree: `C:/Users/PC/AppData/Local/hermes/cache/scratch/wedding-template-audit`
Baseline: `828d6f2`. Production changes are unstaged. No commit/push/deploy, hosted query/write, migration apply or money movement. Canonical `D:/wedding-planner` was not used.

## Implemented
- Additive `supabase/migrations/202610150002_vendor_planning.sql`: vendors with contact/contract notes and totals; dated installments; manual actual payments attributed to exactly one installment by composite tenant-safe FK. Safe-integer Rupiah row constraints, positive installment/payment amounts, nonnegative contracts, bounded text and finite date-only ranges. No budget link and no automatic budget spending writes.
- Member-only RLS, no anon policy, explicit restricted grants, tenant-ID/id immutable UPDATE triggers. Partner shared editing; no entitlement activation or payment processing.
- Replaced owner reset body with unchanged authorization/confirmation/lock/grant semantics and durable starter receipt preservation; explicit child-first scoped deletion and audited counts for all seven planning tables. No identity/membership/commerce/template/legacy savings deletion.
- Dashboard entry `Vendor & Pembayaran`; editable vendor, termin and payment records; delete controls; contract/scheduled/recorded-paid/contract-remaining totals; installment partial-paid/overdue state; honest bookkeeping disclaimer. Empty data by default.
- Weekly priorities from actual incomplete dated tasks and unpaid/partially-paid installments only; ascending dates (overdue first), inclusive today+7 boundary, maximum five, source/action and empty guidance. Date-only WIB (`Asia/Jakarta`) regardless of device timezone. Optional due date on new-task form.
- Cloud snapshot/provider integration, scoped allowlisted mutations, runtime money/date validation, post-reset stale state clearing.

## Test-first evidence
1. `node scripts/test-vendor.mjs`: RED relation `public.vendors` missing; GREEN after vendor schema. Extended slice RED missing `vendor_installments`; GREEN after installment/payment schema and reset.
2. `node scripts/test-priorities.cjs`: RED missing module; GREEN priority ordering, completed/undated exclusion, inclusive +7/exclusion +8, max5, WIB boundary, separate totals and partial attribution.
3. `node scripts/test-cloud.cjs`: RED missing vendor allowlist; GREEN immutable client tenant ID/field lists. Added invalid amount/date rejection RED `Missing expected rejection`; GREEN after runtime validation. Reconciled obsolete pre-starter creation assertion with equivalent current RPC arguments, not weakened auth tests.
4. `python scripts/test-vendor-browser.py`: RED missing weekly-priority heading before UI; GREEN vendor create/edit/reload/delete, installment creation, actual payment/removal and partial balance, reset warning, task due input and widths 360/390/430/1280. SW blocked; Supabase transport intercepted. Added optional task date slice RED missing label then GREEN.

## Executed successfully
- `npm run lint` (zero warnings), `npx tsc --noEmit`.
- Fixture: `NEXT_PUBLIC_SUPABASE_URL=https://fixture.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_fixture npm run build`.
- `python scripts/test-vendor-browser.py`, `python scripts/test-starter-browser.py`, `python scripts/test-whatsapp-browser.py`.
- `node scripts/test-vendor.mjs`: actual full migrations, own/partner reads, stranger/anon widened grants, malicious tenant FK, immutable reassignment, invalid money/date, owner-only reset, late audit-failure rollback and other-workspace preservation.
- `node scripts/test-priorities.cjs`, `node scripts/test-cloud.cjs`, `node scripts/test-wa-cloud.mjs`, `node scripts/test-starter-template.mjs`.
- `npm run test:backend`: 20 SQL checks pass.
- Restored final real-config artifact via plain `npm run build` using existing `.env.local`; no values read or printed.
- `graphify update .`: 567 nodes / 912 edges / 57 communities, AST-only; existing dirty graph/evidence preserved, backup generated. Curated labels changed and may need later relabel; documentation semantic graph not rebuilt.

## Scope and remaining verification
PGlite is a single-session PostgreSQL-compatible test, not native multiconnection/concurrency evidence. No hosted behavior, bank verification, realtime sync or release readiness is claimed. Browser transport fixtures prove client behavior, not live Supabase persistence. Browser tests exercised one installment/payment UI; pure/SQL tests exercise multiple partial payments. Mobile checks assert no horizontal overflow, not full visual/accessibility audit. Existing server occasionally logged Windows connection-abort exceptions during browser reload; assertions still passed. UI test selectors were corrected for localized Rupiah spaces and desktop/mobile settings naming.

Parent review should inspect membership-revocation races with native independent connections, all SQL permission/update/delete permutations, and extreme aggregate totals (individual amounts are safe integers; JavaScript sums of many maximum-sized entries can exceed safe precision). Vendor writes use single statements/FKs rather than a multi-write RPC; no overpayment cap is imposed, deliberately permitting correction/bookkeeping and displaying negative contract remaining. Deleting an installment/vendor cascades its bookkeeping; confirmation explains this. No auto-population of existing users. Nothing should be applied or released without parent review.

## Changed production files
`src/types/index.ts`, `src/lib/cloud-workspace.ts`, `src/lib/vendor-planning.ts`, `src/context/WorkspaceContext.tsx`, `src/components/everrae/vendor-planning.tsx`, `src/components/everrae/planning-reset.tsx`, `src/app/dashboard/page.tsx`, and the additive migration above.
New tests: `scripts/test-vendor.mjs`, `scripts/test-priorities.cjs`, `scripts/test-vendor-browser.py`; updated `scripts/test-cloud.cjs`.
