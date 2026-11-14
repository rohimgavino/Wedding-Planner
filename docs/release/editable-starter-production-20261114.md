# Editable starter database cutover — 2026-11-14

**DATABASE INSTALLED — FRONTEND PENDING.** No frontend, Worker, git commit/push, template application or customer DML was performed. Parallel frontend regression approval remains a separate gate.

## Exact authorized installation

- Target: `lkudkvjaxdjntjosudni`, existing linked Supabase CLI route.
- Installer SHA256: `63154776a0e673b121b6d7725f9f4d337cb0504073f84834506455367078b54b`.
- Canonical migration `202611140002_editable_starter.sql` SHA256: `fd355d340616c84da6a9bc76f64b272561e17c990d12c182780f687c062ff334`.
- Independent review: `APPROVED_EXACT_HASH_ONLY`, defects empty.
- Fresh original fingerprint: `4b8ccfad78baf3a880c531eb0270ee40`; operator `postgres`, PostgreSQL `17.11`; schema/RPC/version absent before installation.
- Original installer dispatched exactly once at 2026-11-14 11:43:18 UTC; CLI returned 0 at 11:43:20 UTC. All original transaction, lock, timeout, absence and drift guards retained. No repair, generic push or retry.

## Persistent read-only verification

- Private schema, table and RPC owners explicitly read back as `postgres`.
- Receipt workspace primary key; nullable applied_by auth FK `ON DELETE SET NULL`; workspace FK `ON DELETE CASCADE`.
- Receipt RLS enabled, zero policies, zero receipts. Schema ACL owner-only, table ACL owner-only; no PUBLIC/anon/authenticated grants.
- RPC SECURITY DEFINER, empty search_path, ACL postgres/authenticated only. Effective EXECUTE authenticated=true, anon=false, service_role=false, PUBLIC=false.
- Function source matches original approved canonical body exactly (MD5 `746ad6161aab7c2c94cf6674de0ab7f7`).
- Exactly one ledger version `202611140002`, name `editable_starter`, exactly eight statements, all exact original/canonical statement MD5s independently compared.
- All 26 existing public tables have identical pre/post counts and aggregate content digests, including planning, payments and entitlements. Only aggregate evidence was returned; no customer IDs or rows logged.

## Verification issue reconciled read-only

Initial generated verification SQL used Windows text newline translation, introducing CRLF into embedded expected SQL literals and reporting false source/ledger equality. The original installer remained unchanged and was not retried. A separate read-only query written byte-for-byte from the original installer returned both equality checks true; local canonical statement MD5s and function body MD5 independently match hosted readback. Preserve the initial results as evidence, not as final mismatch findings.

## Evidence for independent readback

Scratch directory: `C:/Users/MSI/AppData/Local/hermes/cache/scratch/editable-release-20261114/`.

- `cutover-preflight.sql/json`: fresh fingerprint and absence guards.
- `cutover-aggregate.sql`, `cutover-pre-aggregates.json`: sanitized pre-install aggregates.
- `cutover-dispatch-result.json`, `cutover-dispatch-stdout.json`, `cutover-dispatch-stderr.txt`: one dispatch and real CLI output.
- `cutover-postverify.sql/json`: catalog, ACL, constraints and post aggregates; equality fields superseded by byte-preserving readback.
- `cutover-exact-readback.sql/json`: authoritative original-byte function/ledger equality and source/statement MD5s. Safe to rerun read-only via the same linked target route.
- `cutover-verified-summary.json`, `cutover-artifact-sha256.json`: asserted outcome and evidence hashes.

Existing `out`, `.temp`, stage-b1 and all trial artifacts were not removed or rebuilt. No RPC invoked, seeding, reset, payment/status update or historical ledger repair performed. Database installation does not authorize frontend publication.
