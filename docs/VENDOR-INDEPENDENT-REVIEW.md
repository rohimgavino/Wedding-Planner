# Independent vendor-stage review

Local scratch worktree only. No hosted calls/writes, commit, push, deploy or canonical-tree changes.

## Fixed with observed RED → GREEN tests
- Aggregate payments silently rounded above 2^53 (expected 18014398509481983, actual 18014398509481984). Aggregation/subtraction now uses BigInt internally, returning ordinary numbers inside the safe range and exact BigInt outside it. Rupiah formatting accepts both; installment remaining uses exact subtraction.
- Invalid calendar deadlines entered weekly priorities; malformed reference dates could throw. Runtime date-only validation now excludes invalid deadlines and returns an empty list for invalid reference dates.
- Payment deletion bypassed the confirmation shared by vendor/installment deletion. Browser regression proves cancellation sends no DELETE and retains the balance, then acceptance deletes.
- A workspace containing only vendor data qualified for starter-template insertion. SQL regression initially returned Missing expected rejection. The vendor migration now replaces use_starter_template with the unchanged existing body plus all three vendor-table emptiness checks. Existing migration history remains untouched, and CREATE OR REPLACE preserves existing function grants. UI eligibility now excludes vendor rows; fixture test initially failed with the erroneous CTA visible and now passes.

## Reviewed / verified
Composite workspace-parent foreign keys, immutable tenant/id triggers, member-only RLS and restricted grants, scoped client allowlists, owner-only child-first reset, durable starter receipts and late-audit-failure rollback. Existing local SQL tests passed. No confirmed cross-tenant escape found in reviewed paths.

Executed successfully: node scripts/test-priorities.cjs; node scripts/test-vendor.mjs; node scripts/test-cloud.cjs; node scripts/test-starter-template.mjs; npm run lint; npx tsc --noEmit; npm run test:backend (20 checks); fixture build plus python scripts/test-vendor-browser.py; final plain npm run build restored default configuration. Browser requests were intercepted and service workers blocked. Windows HTTP fixture server emitted connection-abort tracebacks on navigation, but browser assertions passed.

Graphify query was used before inspection; final AST-only graph update produced 585 nodes / 940 edges / 52 communities. Existing graph artifacts were already dirty; community labels need refresh and document semantics were not rebuilt.

## Remaining limits
No native independent-connection membership-revocation/template-write/reset concurrency proof; PGlite is single-session. No hosted persistence or production-readiness claim. Existing vendor SQL suite does not cover every outsider UPDATE/DELETE or parent reassignment permutation. Row money validation depends on database bounds/typed cloud writes; snapshot numbers are not independently schema-decoded. Legitimate overpayment remains permitted and represented as negative contract remaining, not silently capped.
