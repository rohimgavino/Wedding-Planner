# Approved tier prices — local review artifact, NOT applied

Business approval covers **Starter Rp75.000, Premium Rp155.000, Wedding Pro Rp255.000 (IDR)** only. No durations, features, promotions, entitlement policy or checkout activation are inferred.

## Files and execution boundary

- `supabase/activation/approved-tier-prices.sql`: separate operator batch, deliberately outside automatic migrations. Uses only existing `admin_update_tier_price` RPC with explicit expected version `'1'`, approved config, reason and `p_confirmed => true`; one transaction covers all three updates. Catalog readback follows commit.
- `scripts/test-approved-tier-prices.mjs`: synthetic in-memory PGlite regression, uses actual migration/RPC SQL. No external database or credentials.
- This document: reviewed scope, execution evidence and remaining gates.

No hosted database, local production database, deployment, commit or push was performed. No env files or credentials were read. Existing dirty UTC validation changes were retained untouched. Draft seeds in migration `202610220002` and historical single-package pricing remain unchanged.

## Operator requirements — not authorization to execute

1. Keep this file out of migration discovery and unattended execution. Do not run it against production merely because synthetic tests pass.
2. Complete staged recovery/schema gates first: verified encrypted backup roundtrip and actual isolated restore, exact hosted migration/function inventory and schema reconciliation, clean additive release allowlist, actual migration-runner late-failure rehearsal. These remain held, not waived.
3. Independently verify target and existing authenticated operator/developer identity using the trusted operator path. The artifact neither establishes a session nor creates/modifies roles or JWT settings. Do not add role/bootstrap/settings SQL to make it work.
4. Read current catalog and verify all three current versions are exactly `1` with unpriced draft config. If any differ, STOP; do not replace constants with latest-version queries or blindly increase them. Obtain fresh review. Rerunning after success intentionally conflicts.
5. Only after separate execution approval, use a runner that stops on SQL errors, executes this entire file on one session and honors its transaction. If any statement fails, issue `ROLLBACK` on that session; do not resume individual statements. Earlier SELECT output is provisional until commit. Do not split the batch or enable per-statement autocommit.
6. After an authorized successful execution, separately read the authenticated catalog: each version `2`, approved amount strings, `promo:null`, `price_eligible:true`, `checkout_eligible:false`. Verify three attributable `package.tier_price` audit entries and unchanged drafts, legacy price/invoices, settings, sales gate, entitlements and grants. This readback has NOT been performed on production.

## Test evidence

Run from `C:/Users/MSI/program/Wedding-Planner-reconcile-20261026`:

```sh
node scripts/test-approved-tier-prices.mjs
node scripts/test-tier-pricing.mjs
```

TDD RED ran before the activation SQL existed: exit `1`, assertion `operator artifact must configure the three business-approved prices through CAS`; actual versions `1` and null amounts versus expected versions `2` and approved amounts. This was a behavior failure, not a missing-file error.

Final combined execution returned exit **0**, exact output:

```text
PASS migration retains all three unpriced draft seeds before explicit activation
PASS audited confirmed CAS configures Starter=75000 Premium=155000 Wedding Pro=255000 IDR
PASS immutable drafts and historical Rp250000 invoice preserved; no promo/entitlement/checkout/role/settings activation
PASS replay rejected by explicit expected version 1 without additional versions or audit
PASS migration retains all three unpriced draft seeds before explicit activation
PASS starter conflict rolls back the entire three-tier batch, including earlier updates/audits
PASS migration retains all three unpriced draft seeds before explicit activation
PASS premium conflict rolls back the entire three-tier batch, including earlier updates/audits
PASS migration retains all three unpriced draft seeds before explicit activation
PASS wedding_pro conflict rolls back the entire three-tier batch, including earlier updates/audits
PASS migration retains all three unpriced draft seeds before explicit activation
PASS final-tier audit failure rolls back all prices, pointers and audits
PASS approved tier price operator artifact: all synthetic SQL scenarios
PASS three draft tiers; no legacy price mapping or checkout activation
PASS canonical UTC rejects normalized 24:00:00 at both schedule endpoints
PASS both UTC endpoints: malformed/null/missing rejection, leap-day/year boundaries, non-UTC session
PASS private tier invoice reservation, unpriced denial, idempotent immutable old snapshot and API denial
PASS tier SQL validation, exact bounds, auth, CAS, half-open promo boundaries, failclosed checkout, widened grants, audit rollback
```

The conflict cases use fresh in-memory databases and a real intervening RPC update for each tier. The final-tier conflict proves earlier Starter/Premium writes and audits roll back; the injected last-audit failure adds late-failure evidence. This is transaction rollback evidence, **not independent-connection concurrency proof**. Protected-state snapshots compare role/settings/gate/entitlement/purchase/invoice data, table RLS/grants and public function definitions/grants before/after success.

## Review limitations / gates

- Native PostgreSQL independent-connection authorization revocation / price reservation races remain a separate release gate; PGlite cannot establish them.
- Real hosted backup recovery and schema reconciliation remain unresolved prerequisites. No production inventory or connection attempted in this scope.
- No UI, payment adapter, promo, entitlement or sales activation is included. No frontend build or hosted end-to-end claim.
- Read `AGENTS.md`, wedding backend/release skill plus staged gates and TDD skill. Graphify CLI was unavailable; existing graph/report identified `scripts/test-tier-pricing.mjs` (`catalog()` at L10), followed by direct source/RPC inspection. Graph lacks fresh SQL detail; no graph regeneration or source changes outside the three owned files were made.
- Before editing the new test further, a permanent nonsecret copy was saved outside the repository/TypeScript include tree: `C:/Users/MSI/program/wedding-planner-review-backups/approved-tier-prices-20261027-082045/test-approved-tier-prices.mjs`. Existing project source was not edited.
