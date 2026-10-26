# DOKU durable local transaction stage

22 October 2026. LOCAL ONLY. No deployment, hosted migration/write, credentials/env-file read, entitlement/customer change, commit/push, port4187 change or recovery VM work.

## Working artifacts

- `services/doku-sandbox/durable.sql`: additive sandbox schema OUTSIDE automatic migrations. Invoker-only functions; API roles have no schema/function/table access, all tables deny-default RLS. Reserved invoice snapshots bind merchant, original request, payer, workspace, append-only price version/amount FK. Owners reserve; status requires original payer and current workspace membership. Current pricing is read/locked at reservation; changing price cannot rewrite existing invoices. Existing legacy/manual ledgers are untouched.
- Permanent inbox `(merchant,event_id)` + SHA256; event advisory lock then invoice row lock; unique candidate per invoice; all inbox/candidate/audit inserts in one SQL transaction. Same event/hash duplicates, changed hash conflicts audited, new event for same invoice duplicate-payment. Ignored FAILED/out-of-order statuses never revoke or overwrite success. Immutable registry/audit. SQL null comparisons fail closed.
- `services/doku-sandbox/worker.mjs`: separate private Fetch Worker entry, explicitly requires `nodejs_compat` (imports node:buffer and node:crypto); NOT directly assumed compatible with bare workerd. No default outgoing transport, credentials read only from injected server bindings. Disabled without SANDBOX_ENABLED=true, AUTH/DATABASE bindings, merchant/secret and exact allowed origin. Authenticated POST /invoices accepts ONLY workspaceId; authenticated GET /invoices/:id. Notification POST /doku/notifications verifies exact bounded bytes before parsing, rejects folded security headers, encoded/non-JSON/oversized bodies; matches stored invoice/original/amount/merchant with protocol kernel; only acknowledges after database commit. Generic no-store error JSON; no raw PII storage/logging. DB failure returns503 for retry. No redirect, checkout URL, access grant or production route.
- AUTH service binding must validate bearer server-side and return verified userId, never trust browser UUID. DATABASE binding must map exact operations to parameterized invoker SQL through a dedicated private server role. Tests inject real local PGlite execution, NOT hosted Supabase adapters. Neither binding is yet implemented for production. These invoker functions MUST NOT be exposed via PostgREST/user-supplied identity.
- Proposed calendar year: `Asia/Jakarta` wall time + SQL interval1year, leap-day clamp. Receipt time, not provider-controlled transaction date, sets sandbox candidate proposal. It is NOT approved renewal/entitlement policy; no existing entitlement expiry read, renewal extension, or production grants implemented. Approval and separate full renewal locking tests remain necessary.

## Real execution evidence

Run from D:/wedding-planner (node.exe native):

```
node.exe --test scripts/test-doku-sandbox.mjs scripts/test-doku-security.mjs scripts/test-doku-pricing.mjs scripts/test-doku-durable.mjs
node.exe scripts/test-doku-worker.mjs --direct-fetch
python scripts/test-doku-native.py
node.exe node_modules/eslint/bin/eslint.js src --ext .ts,.tsx --max-warnings 0
node.exe node_modules/typescript/bin/tsc --noEmit --incremental false
```

- `docs/doku-evidence/durable-full.log`: 83 tests,83pass,0fail (79 existing +4 durable). PGlite actual filesystem DB closes/reopens with unchanged reserved price, outsider denied, widened table grants cannot bypass RLS, immutable records, rollback on late audit failure, leap/WIB year boundaries, event/payment dedupe. PGlite is not concurrency evidence.
- `durable-07-direct-fetch.log`: 2pass,0fail; real Request/Response handler + real PGlite via injected bindings, auth/origin denial, server reservation/status, tamper rejection, DB outage503/no lost event, valid notification, replay exactly one candidate. SYNTHETIC signed fixtures, never claimed as DOKU API responses. Node Fetch is NOT real workerd verification.
- `durable-native.log`: actual disposable PostgreSQL17,8 independent psql connections racing same invoice with different event IDs =>1candidate+7duplicate-payment; 8 repeated same event =>8duplicate-event, permanent inbox count8. Cluster loopback-only55973, stopped/removed in finally. No production database touched. Revocation/renewal multi-connection races NOT yet tested.
- `durable-lint.log`, `durable-tsc.log`: both exit0. Worker node syntax check exit0. git diff --check exit0 (existing CRLF notices only).
- RED/GREEN logs `durable-01` through `durable-08` retain missing schema/function/entry and null-validation regression failures. Workerd attempt `durable-06-worker-green.log` despite historical filename is FAILED (runtime startup access violation0xc0000005); DO NOT call it green. Actual Miniflare3 and4 workerd both crash on this Windows host before tests execute. Fallback direct-fetch result is explicitly separate. Runtime tool install isolated at `D:/pocketwedding-local-tools/doku-runtime`, miniflare4.20251011.0; repo package/lock unchanged. Tests use this exact local tool path. `node.exe --test scripts/test-doku-worker.mjs` retries actual runtime gate (currently blocked).

## Unfinished release gates (fail closed)

1. Merchant review is external DOKU process; cannot control approval or promise two working days. No sandbox credentials currently supplied; no prompts or polling performed.
2. Native workerd startup/import/network ingress must pass on supported host before deployment. Configure separately approved private Worker with nodejs_compat, managed secrets, verified JWT AUTH adapter and dedicated PostgreSQL DATABASE adapter. Never deploy canonical dirty tree or static admin release as payment server.
3. Persist byte-identical Checkout creation request and uncertainty/retry state, verify separate Response-Timestamp signatures and allowlisted checkout URL before exposing checkout. Existing sendSandboxCheckout remains deliberately unverified-response/no URL, no automatic transport. No actual DOKU call was sent.
4. Unknown invoice/mismatch currently returns4xx and grants nothing; not yet durable quarantine/reconciliation. Conflict existing invoice is audited, original receipt preserved. Restricted quarantine retention, rate limits, exact actual ingress duplicate-header behavior, duplicate JSON-key policy, response verification/check-status/refund/reversal policies remain gates.
5. Add production approval, agreed renewal-start policy, shared workspace/entitlement locks and native revocation/renewal races. Candidate-only calendar-year tests do NOT authorize entitlements or real sales.
6. Approved hosting independent of PC; verified sandbox setup/simulator+real signed notification/retry E2E. Existing backup restore release gate remains unresolved/deferred, not passed.

## Official documentation (read current browser DOM)

Rechecked https://developers.doku.com/get-started-with-doku-api/notification/best-practice on22October2026: raw Digest/HMAC, notification URL path Request-Target, duplicate event logging/idempotency, Checkout FAILED ignored, unknown fields ignored and prompt2xx. Other protocol source URLs remain in `DOKU-SANDBOX-GROUNDWORK.md`; no invented provider response used.

## Preservation

Before edits durable nonsecret backup `backups/doku-durable-20261022-072040/` with SHA256 manifest preserves original protocol and graph files. Existing protocol/frontend/pricing SQL/deploy config unchanged. New durable SQL/test/Worker/report/evidence only, plus mandatory Graphify generated updates. Production sales remain disabled.
