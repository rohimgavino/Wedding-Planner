# Editable starter — bounded native gate execution

Status: HOLD; no Production installation, rehearsal, ledger write, commit, push or deployment. No application/customer/payment/entitlement mutations outside exclusively owned local synthetic PostgreSQL.

## Verified

- Canonical checkout HEAD observed `d586e682a94473bf0503bb11a033a636a634ba7b`; existing dirty implementation, `.temp` and unrelated stage-b1 report preserved.
- Bounded discovery found existing native PostgreSQL at `C:/Users/MSI/program/PocketPlanner-local-tools/pg17/pgsql/bin`; executable reports PostgreSQL 17.11.
- Executed `python3 C:/Users/MSI/AppData/Local/hermes/cache/scratch/editable-native-gates.py`, final exit 0. Runner creates a uniquely owned scratch cluster bound only to 127.0.0.1, uses independent native psql processes, stops and removes owned cluster in finally. Final output confirms stop 0 and removal.
- Candidate executed unchanged SHA256 `fd355d340616c84da6a9bc76f64b272561e17c990d12c182780f687c062ff334`.
- Baseline is explicitly a captured-schema reconstruction using existing local foundation migrations plus captured hosted planner definitions, not historical migration-chain replay or current-hosted verification.
- PASS concurrent apply/apply: first false, second true, exactly 8 budgets/8 tasks/1 receipt.
- PASS first transaction applies then rolls back; blocked second call applies successfully.
- PASS apply/reset and reset/apply orderings through actual captured seven-table reset function; receipt remains; subsequent apply reports already_applied without reseeding. Complete workspace and membership row JSON unchanged through reset.
- PASS native Auth applier deletion: nullable SET NULL retains receipt; repeated apply does not reseed.
- PASS injected late task-trigger failure: budget/task inserts and receipt roll back.
- PASS workspace lock held while owner demoted: waiting apply rejects owner authorization and inserts nothing.

Seven-table reset assertions verify deletion scope and workspace/membership preservation with synthetic fixtures; this does not establish preservation of every commerce/audit/savings row or full populated-seven-table recovery. Concurrency uses independent psql processes with delayed first transactions; separate backend PID/pg_stat_activity wait-event assertions were not captured. Owner deletion race, JWT transport, and all production-specific trigger/default ACL checks remain unproved.

## Precise next blocker

Required authenticated JWT/PostgREST owner/partner/outsider/unpaid proof remains absent. SQL SET ROLE/request GUC simulations above are NOT JWT evidence. No authorized hosted isolated fixture was used; sandbox remains untouched/closed.

Further bounded discovery found an existing Docker Desktop executable outside PATH at `C:/Users/MSI/AppData/Local/Programs/DockerDesktop/resources/bin/docker.exe`. Its server responds version 29.9.3. `docker image ls --format '{{.Repository}}:{{.Tag}}'` returned an empty list. No PostgREST/Kong executable was found in the bounded tool/download/program directories. Constructing genuine local JWT transport therefore requires obtaining runtime software/images; no pull/install was performed under the no-install-without-asking constraint. Parent can seek approval for a pinned disposable gateway image/runtime or select an already authorized isolated staging fixture; do not substitute a fabricated gateway/JWT response.

Missing mounted user-identity/pending-response switch tests were not added or claimed. Supported per-migration CLI atomic schema/history behavior was not rehearsed; no exact installer wrapper approval or production catalog rehearsal occurred. Production deployment is blocked, not waived. Existing public/production build, remote baseline, effective ACL/RLS/catalog/data invariants and active Cloudflare provenance need fresh verification only after essential gates pass.

## Artifacts

- This sanitized report is the only repository file created by this task.
- Scratch-only runner: `C:/Users/MSI/AppData/Local/hermes/cache/scratch/editable-native-gates.py`.
- Scratch-only result: `C:/Users/MSI/AppData/Local/hermes/cache/scratch/editable-native-results.json`.
- No business source/candidate/migration bytes changed; no credentials exported; no package/container installation; no DOKU/status refresh/account/invite/browser apply action.
