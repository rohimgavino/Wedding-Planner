# Production paid-RLS preflight — 2026-11-14

## Verdict
PASS authorized rollback-only native rehearsal; NOT a persistent cutover or launch-readiness approval. Parent must independently review this evidence and resolve/accept explicitly bounded remaining gates before applying. User clarified all current workspaces are their own pre-launch trials; no external-customer grandfather/backfill decision is required. Preserve trials, real DOKU payment, entitlements and audit unchanged.

## Real execution
- `python3 docs/release/run-production-paid-preflight.py`: exit 0, `PASS_ROLLBACK_ONLY_NOT_CUTOVER`.
- Native server: PostgreSQL 17.11, x86_64 Linux. Existing Supabase CLI 2.121.0 Management API `db query --linked --project-ref lkudkvjaxdjntjosudni --file ...` executed one explicit PostgreSQL transaction batch. No tools installed.
- Candidate SHA256 `15180763a40c3d1189d46bbd2b0ce18f3b93f15dd56be79e7769c3873a729dff`; migration and activation byte-identical. Lexer recognizes quotes/comments/dollar bodies and requires exactly BEGIN / DO / COMMIT, removing only outer transaction statements for rehearsal.
- Rehearsal: BEGIN; lock_timeout 1500ms; statement_timeout 20s; idle transaction timeout 25s; exact candidate DO; assertions and SELECT-only role simulation; ROLLBACK. Eight restrictive authenticated ALL policies verified, USING and WITH CHECK identical membership AND core. Rehearsal SHA256 `42532b1e503b0e5abd114126e53d6f306f3742a57cdfb657a103a9597119cff4`.
- 72 native role-context SELECT assertions PASS: 16 allowed / 56 denied; 3 allowed checks and 6 denied checks had actual nonempty underlying data. Nine actor/workspace pairs: 3 owner / 6 outsider / 0 partner. Existing legitimate member IDs remained inside SQL; no IDs captured. SET LOCAL ROLE authenticated and auth.uid assertions passed. **set_config auth context is SQL simulation, NOT JWT/PostgREST evidence.** Empty vendor tables cannot prove nonempty vendor visibility behavior natively.
- Exact scoped schema metadata equals original reviewed snapshot before AND after rehearsal: 14 tables, all captured policies/ACL/RLS/constraints/triggers and 11 function definitions. Existing eight membership policies restored; zero persistent paid_core_access policies. Aggregate cohort/ledger/effective ACL before/after equal.
- All eight targets: RLS enabled and existing permissive membership ALL policy; authenticated effective SELECT/INSERT/UPDATE/DELETE true. Four helper functions: postgres owner, SECURITY DEFINER, empty search_path, authenticated EXECUTE true, anon false. `python3 docs/release/verify-paid-helper-source.py`: all four latest local helper bodies equal captured/live bodies after whitespace normalization. No helper changes.
- `git diff --check`: exit 0, only existing LF/CRLF warnings. Existing worktree and supabase/.temp preserved.

## Aggregate cohort, no customer identifiers
3 workspaces / 3 owner memberships / 0 partner memberships. 2 active finite core / 0 active NULL core / 0 expired unrevoked core / 0 revoked core / 1 workspace without active core. One effective developer-own membership overlaps existing core; total effective-core member access remains 2, not 3. The no-core owner trial will lose direct planner read/write after cutover by approved product design; data remains. No grant, backfill or deletion needed.

No application INSERT/UPDATE/DELETE, payment RPC, new account/entitlement, trigger disable, grant or migration repair occurred. Preservation evidence is exact structural rollback plus unchanged aggregate cohort and the absence of customer DML; this is NOT a row-by-row payment/audit backup or restore proof.

## History and precise targeted plan — NOT EXECUTED
`npx --no-install supabase migration list --linked --project-ref lkudkvjaxdjntjosudni`: exit 0. Remote versions: 202610120001, 202610140001, 202610140002, 202610140004, 202610140005, 202610140006, 202610150001, 202610150002, 202611120001, 202611120002. Local-only: 202610140003, 202610220002, 202611140001. Remote-only: 202610140005, 202610140006, 202610150001, 202610150002.

Do NOT use db push, repair historical versions, or apply activation as a second migration. After independent approval and rechecking hash/target/current inventory, the candidate command is:

```sh
npx --no-install supabase db query --linked --project-ref lkudkvjaxdjntjosudni --file supabase/migrations/202611140001_paid_access_rls.sql
```

The canonical candidate owns BEGIN/COMMIT. Unlike rehearsal, its current bytes contain no lock/statement timeout: parent should approve a hash-pinned bounded execution wrapper/session strategy before cutover rather than allow indefinite lock waits or silently modify pinned bytes. A wrapper may inject SET LOCAL timeouts immediately after the parsed outer BEGIN while preserving the entire policy DO, and needs its own exact hash/review. No such persistent wrapper was executed here.

After successful policy readback and authorized smoke, separately record ONLY the new version (parent approval required):

```sh
npx --no-install supabase migration repair --status applied 202611140001 --linked --project-ref lkudkvjaxdjntjosudni
```

Re-list history and verify eight paid policies, original permissive policies, helpers and aggregate cohorts unchanged. If the policy commit succeeds but repair fails, stop and report applied/unrecorded; do not re-run historical migrations. Do not falsify original missing history.

Emergency rollback, only on explicit parent/DBA approval:

```sh
npx --no-install supabase db query --linked --project-ref lkudkvjaxdjntjosudni --file supabase/activation/paid-enforcement-rollback.sql
```

It drops only eight paid policies, deliberately reopening membership-only access. History reconciliation after a persistent rollback requires its own explicit decision; no automatic history deletion.

## Remaining gates / manual actions
1. Independent parent review of exact candidate hash, executable timeout strategy and history plan; no persistent cutover in this task.
2. Authentic JWT/PostgREST paid/unpaid/outsider/free-path smoke is NOT performed. No existing partner exists, and expired/revoked cases are absent; do not claim those native/live cases passed. They remain local-fixture evidence until legitimate authorized test coverage or explicit pre-launch risk acceptance.
3. Native multi-connection concurrency and backup/restore are NOT performed. Native rollback DDL does not close restore/concurrency gates. No customer dump written. Decide a managed recovery/restore assurance appropriate to this pre-launch trial environment rather than invent backup evidence.
4. Full clean migration-chain reproducibility remains unproven; metadata reconstruction is not a restore. Narrow in-place candidate prerequisites were verified against current live state.

## Issues encountered
Initial rehearsal SQL had an unparenthesized CASE inside a PL/pgSQL IF and failed with PostgreSQL 42601 before execution; corrected and rerun successfully. A first shell-embedded helper comparator was corrupted by shell dollar expansion and failed; file-based comparator then passed all four. No fabricated output or persistent database change followed either failure.

## New sanitized artifacts
- run-production-paid-preflight.py (bounded executor; rerunning executes authorized DDL rollback rehearsal, not merely offline validation)
- verify-paid-helper-source.py (offline comparison)
- production-paid-rollback-rehearsal.sql (no identifiers)
- production-paid-preflight-current.sql (latest read-only aggregate query; no identifiers)
- production-paid-preflight-20261114.json (real sanitized evidence)
- this report

No commit/push/deploy, secrets read/logged, raw data dump or application mutation.
