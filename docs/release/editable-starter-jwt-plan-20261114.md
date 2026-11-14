# Editable starter: genuine local JWT gate and exact deployment plan

## Outcome

Production NOT installed; no Production DDL/rehearsal/ledger mutation, customer/app DML, commit, push, or Cloudflare deployment. Prepared exact installer for parent review as required; this is not a request for repeated user authorization. User authorized safe deployment including disposable runtime, but the new direct-ledger wrapper requires correctness review before dispatch.

## Executed evidence

- Existing Docker Desktop 29.9.3 obtained official `postgrest/postgrest:v12.2.12`, immutable digest `sha256:5f4ce744539bbba786b4e24dbbd95bdb2a956dcf568c5374995a0ff4a68f5bd2`. Initial pull failed because docker-credential-desktop was outside PATH; adding existing Docker bin to subprocess PATH resolved it. No application dependencies changed.
- `python3 C:/Users/MSI/AppData/Local/hermes/cache/scratch/editable-jwt-gates.py` exited 0 against actual PostgreSQL 17.11 and actual PostgREST, bound only to loopback. Independent gateway login used ephemeral local password; HS256 signing key and verified JWTs remained in process memory/environment, never printed or persisted. No real hosted user sessions transferred.
- Owner JWT explicitly provisions exactly 8 budgets/8 tasks/1 receipt; repeated owner call reports already_applied. Partner, outsider and anonymous provisioning rejected. Unpaid owner/partner/outsider reads return zero rows, INSERT returns 403, PATCH/DELETE return zero affected rows; rows remain intact. Private schema profile returns 406 and public receipts route 404. This proves actual local JWT transport, not hosted Supabase authentication or full Kong equivalence; captured-schema reconstruction remains distinct from historical migration replay.
- Owned PostgREST container stop 0; owned PostgreSQL cluster stop 0 and owned directory removed. Cached official image retained. No broad deletion, and out was untouched.
- Fresh linked Production SELECT-only metadata probes confirmed PostgreSQL 17.11/operator postgres, new schema/RPC/version absent, ledger INSERT privilege. A scoped catalog fingerprint covers relations/columns/constraints/triggers/helpers/policies/ACL/defaults/roles/memberships/ledger without customer rows: `4b8ccfad78baf3a880c531eb0270ee40`. Queries used BEGIN READ ONLY, bounded statement timeout, ROLLBACK. CLI returns only the last query result, so fingerprint was read in a separate single-SELECT batch.
- Local HEAD and remote main observed unchanged at `d586e682a94473bf0503bb11a033a636a634ba7b`; GitHub authentication passed. Existing CLI 2.121.0 `migration up` operates pending migrations and has no per-version selection flag; generic push/up is not selected for diverged historical ledger. `db query` supports explicit linked project and file.

## Prepared exact artifacts

- Canonical `supabase/migrations/202611140002_editable_starter.sql` is byte-identical to reviewed candidate, SHA256 `fd355d340616c84da6a9bc76f64b272561e17c990d12c182780f687c062ff334`. Historical candidate comment deliberately preserved. No business source changed.
- Scratch directory `C:/Users/MSI/AppData/Local/hermes/cache/scratch/editable-release-20261114/` contains `deployment-plan.json`, readonly probes/results, split candidate statements/body, and `install-atomic-REVIEW-REQUIRED.sql`.
- Installer SHA256 `63154776a0e673b121b6d7725f9f4d337cb0504073f84834506455367078b54b`. NOT executed, not yet independently approved or natively rehearsed.
- Wrapper uses one BEGIN/COMMIT, LOCAL lock 3s/statement 15s/idle transaction 30s timeouts, transaction advisory lock (20261114,2), in-transaction operator/version/object/version absence and exact catalog fingerprint checks, unchanged inner candidate statements, then one INSERT of version 202611140002/name editable_starter plus canonical split statement array. No ON CONFLICT, historical repair, paid/access/customer mutation. Quote/comment/dollar-body-aware splitter validates outer boundaries. Intended route: existing linked `supabase db query --project-ref <validated existing ref> -f <exact wrapper>` after review and a persisted one-shot intent. Never blindly retry an ambiguous response.

## Next bounded review, not deployment claim

Parent must review exact wrapper/ledger statement convention and exercise success plus forced-ledger-failure rollback against owned native fixture before Production dispatch. Current fingerprint is drift detection, not a substitute for semantic ACL/trigger compatibility review; refresh before dispatch and re-pin only after reviewing any drift. Full-source independent verdict remains the earlier bounded candidate review, not a new complete deployment review.

Mounted user-identity and pending-response switch cases remain unproved; workspace switch cases were previously exercised. This task did not add or rerun mounted browser tests. Real paid JWT CRUD success and CAS across actual clients were not added here; unpaid denial is measured. Final out is still fixture-configured, so do not deploy it. Need fresh approved real-public-config build, lint/typecheck/regressions and narrow reviewed allowlist publication after DB readback, then exact-SHA Workers Builds/active Worker/live asset verification. No site launch readiness claim.

Existing unrelated stage-b1, .temp, original dirty source, historical migrations, payment data and user out preserved. Scratch runners/results contain only synthetic local identities and sanitized catalog metadata.
