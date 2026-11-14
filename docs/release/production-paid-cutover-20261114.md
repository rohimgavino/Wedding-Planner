# Production paid RLS cutover — 2026-11-14

## Persisted result
PERSISTENT_APPLIED_VERIFIED_RECORDED on Supabase `lkudkvjaxdjntjosudni`.

- Exactly eight `paid_core_access` policies persist: budgets, tasks, guests, savings_accounts, savings_contributions, vendors, vendor_installments, vendor_payments.
- Each is RESTRICTIVE, FOR ALL, TO authenticated. Exact USING and WITH CHECK: `(is_workspace_member(workspace_id) AND has_workspace_entitlement(workspace_id, 'core'::text))`.
- Exact policies compared against previously reviewed native rehearsal output. All original membership policies and scoped schema/function/ACL/settings metadata unchanged, excluding only intended policies and their catalog dependency edges.
- One bounded apply dispatched, CLI exit 0. No retry or automatic rollback. Fresh catalog read after transaction and again after read-only smoke proved persistence.
- Only migration `202611140001` / `paid_access_rls` recorded after successful verification; repair exit 0. Ledger now 11 records; original 10 records unchanged. No db push or historical repair.

## Pins and preservation
- Canonical migration SHA256: `15180763a40c3d1189d46bbd2b0ce18f3b93f15dd56be79e7769c3873a729dff`; activation remains byte-identical.
- Bounded wrapper SHA256: `c4b79b9f8cd9c7dd8938d5d49d4888934713906237d689dea8c8a62ec67980e4`.
- Wrapper preserves every canonical byte, inserting only SET LOCAL lock_timeout 3s, statement_timeout 30s, idle_in_transaction_session_timeout 30s immediately after unique outer BEGIN; canonical COMMIT retained.
- Before/after/final data aggregates identical across all 28 public/starter_private base tables, including planner, settings, payment, entitlement and audit tables. Each aggregate includes count and SHA256 of sorted per-row SHA256 values computed inside PostgreSQL; no rows or identifiers exported. Aggregate JSON SHA256: `2fdb8e52f1c3acd9bdf4963f50229961f84df26e021de3c7dc278eef68d87eed`.
- Cohort, effective ACL and original ledger equal before/after policy install. Final cohort remains equal after removing only the separately verified new history record. 3 workspaces, 3 owner memberships, no partners; 2 active finite core and 1 no-active-core workspace retained.
- No application DML, payment RPC, new user/grant, helper/reset/onboarding changes, deletion, Worker deploy, price/status/upgrade changes, git commit/push or cleanup of existing .temp/worktree.

## Smoke and accepted limitations
Read-only native SQL role-context SELECT smoke: 72 assertions, 16 allowed / 56 denied; 3 nonempty allowed and 6 nonempty denied checks. 3 owner and 6 outsider pairs. This is SET LOCAL ROLE/auth.uid simulation, **not JWT/PostgREST**. No native partner/expired/revoked cohort exists (those cases remain local-only). Native concurrency and backup/restore remain unproven. These were accepted prelaunch limitations for this narrow additive policy install, not product launch/readiness signoff.

## Artifacts and issues
Evidence: `production-paid-cutover-20261114.json`; one-shot stateful executor: `run-production-paid-cutover.py`; wrapper: `production-paid-cutover-bounded.sql`; four read-only queries: `production-paid-cutover-{schema,cohort,data-aggregates,role-smoke}.select.sql`. Original candidate, rehearsal, preflight reports and .temp preserved.

Initial preflight-only executor run hit a local missing `json` import in the imported sanitizer namespace after read-only queries; corrected before any DDL or state journal creation. Subsequent fresh preflight passed. No database apply/history failure. Parent independent readback remains required before parent claims completion.
