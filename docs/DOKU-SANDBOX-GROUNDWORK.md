# DOKU sandbox groundwork — 22 October 2026

## Implemented, not activated

`services/doku-sandbox/protocol.mjs` is an isolated Node-only protocol kernel outside Next `src/`. No frontend, production auth, roles, RLS, legacy purchase/verification, migration, environment file or deployment configuration changed. It reads no environment variables and has no default network transport. Sales remain disabled; no pay button, route, worker, database write or entitlement grant was added. The existing admin preview/port 4187 is untouched.

Chosen integration: **DOKU hosted Checkout, non-SNAP**, `POST https://api-sandbox.doku.com/checkout/v1/payment`. Initial adapter deliberately limits methods to `VIRTUAL_ACCOUNT_BCA` (documented basic-request method), `SALE`, IDR 250000, 60-minute checkout validity. Checkout validity is not workspace entitlement duration. Broadening channels requires reviewing channel-specific payloads. Especially QRIS samples do not consistently document `original_request_id`; this kernel fails closed when it is absent rather than loosening matching.

Functions:
- `signRequest(metadata, Buffer | undefined, secret)`: SHA256/base64 over exact raw UTF-8 bytes; LF-joined Client-Id, Request-Id, Request-Timestamp, Request-Target and optional Digest, no trailing LF; HMAC-SHA256/base64 with literal UTF-8 secret. Undefined body omits Digest for GET; zero-byte body includes Digest. Safe bounded metadata and real UTC-second dates required.
- `inspectNotification(config, request, trustedOrder)`: exact POST/local configured path, bounded Buffer, unique case-insensitive security headers, fixed merchant identity, constant-time signature comparison before fatal UTF-8 decode/JSON parsing, exact invoice, exact IDR amount, original request and transaction date matching. Extra future fields ignored, not reflected. DOKU examples use numeric and digit-string amounts; only number 250000 or canonical string `250000` accepted, not decimals/whitespace/coercion. Missing currency is IDR under this IDR-only merchant order; explicit non-IDR rejected. Only SUCCESS with absent transaction type (VA) or SALE becomes **sandbox-payment-candidate**, never access. FAILED and every other status/type are ignored, not terminal failure or reversal.
- `sendSandboxCheckout(config, trustedOrder, timestamp, injectedTransport)`: fixed sandbox origin/path, one signed request, explicit transport required, no retries. Raw response deliberately not parsed/trusted, URL/token not exposed; returns `unverified-sandbox-response`, HTTP status, `grantsAccess:false` even for HTTP200. A transport fixture is not a DOKU response. HTTP409 is not silently payment success. Production/implicit enablement/endpoint overrides rejected before transport.
- `classifyReceipt(event, persistedState)`: pure replay decision contract: same event/hash duplicate; reused event/different hash conflict; new event for paid invoice duplicate payment; otherwise candidate or ignored receipt. **Not durable idempotency implementation**, no in-memory store presented as a database or concurrency proof.

Configuration must be supplied explicitly by a future private service: `{enabled:true, environment:'sandbox', clientId, secret, notificationPath}`. No sample credentials are real. The kernel does not establish whether a supplied key belongs to sandbox; the network destination is fixed sandbox. Low-level signer is a protocol primitive, not the activation gate.

## Required secure server boundary (not wired)

Next static export cannot host secret-bearing API handlers. Never place this module/merchant secret/service-role credentials in `src`, `NEXT_PUBLIC_*`, browser storage, static assets or a client component. Use a separately deployed private Node payment service or an explicitly ported Worker/Edge service with managed secrets and reviewed database adapter. This Node crypto/Buffer module is not directly a Worker WebCrypto implementation.

1. Authenticated creation endpoint verifies JWT server-side, obtains current workspace ownership/membership and eligibility from authorized backend, rejects client-selected prices/tenant identities, enforces CSRF/origin policy and rate limits. Maintain existing role/RLS semantics, never grant membership for payment.
2. In a transaction reserve permanent unique `(environment, merchant, invoice)` and creation Request-Id; snapshot workspace, payer, package/version, amount **250000 IDR**, duration **one calendar year**, starting/renewal policy and creation payload bytes. No 365-day conversion. Define leap-day clamp, Indonesia timezone and renewal start (`max(now, current_expiry)` or approved alternative) before entitlement implementation, with calendar boundary tests. Kernel intentionally calculates no entitlement expiry.
3. Persist creation state before network. After timeout, reuse original Request-Id and byte-identical body; DOKU documents duplicate requests return same response body with HTTP409. Do not generate new invoice/payment on every retry. Reconcile uncertain outcomes using documented check-status API and authenticated signed-response handling. No automatic retry is implemented here.
4. Verify signed initiation/check-status response under the separate **Response-Timestamp** contract; validate matching invoice/amount and an approved HTTPS checkout URL origin before returning only an opaque purchase ID/URL. This kernel intentionally exposes no URL until that adapter is designed and tested. Do not mistake request signature echoed in response JSON for response authenticity.
5. Notification endpoint must preserve raw bytes, reject duplicate security headers at the actual HTTP ingress (framework header folding loses evidence), enforce method/content type/size, reject encoded bodies or preserve exact provider bytes, pin canonical path without forwarded-host/path overrides. Return generic errors without payloads, secrets, signatures, checkout tokens or customer data in logs. JSON duplicate-key behavior must be made consistent across ingress/worker/database; kernel uses Node JSON.parse, not a cross-language canonicalizer. Only trusted signed provider payloads may reach the parser; do not use client JSON as provider evidence.
6. Verify HMAC, persist authenticated notification in a durable inbox transaction and only then acknowledge 2xx quickly; DB failures must be retryable, not acknowledged then lost. Unknown invoice/mismatch/conflicting receipt goes to durable quarantine/reconciliation, never fulfillment. Raw payloads may contain PII/card metadata: encrypted restricted storage/retention/redaction policy required; kernel returns only allowlisted digest/identity fields.
7. A transactional worker locks invoice and workspace in a fixed order, atomically reserves unique `(environment,merchant,event_request_id)` with hash and globally unique `(environment,merchant,invoice)` payment fulfillment. Record ignored statuses too. Different event IDs for one invoice cannot double-extend access. Same ID/different hash is a conflict, not overwrite. Invoice/receipt registry survives reset, renewal and workspace lifecycle; no mixing sandbox with real entitlements or historical manual/Lynk sales. Native independent-connection tests must prove duplicate races, late failure rollback, retry after commit, unknown/conflicting event, role revocation and renewal serialization.
8. Only after approved full transactional backend design may a production worker atomically update the paid ledger, entitlement and audit. Browser redirect/result page is UX only: query authenticated server purchase state; **never grants access**. Refund/void/authorize/expired/recovered statuses need explicit reconciliation policy; do not revoke/activate from guessed mappings. Protect the separate developer test-grant path and existing manual activation gate.

No short webhook timestamp expiry is invented: DOKU documents retries at 30 minutes, 6 hours and 12 hours plus manual resends, without promising refreshed header timestamps. Authenticity is not freshness; permanent receipt/invoice uniqueness is mandatory. This pure kernel accepts valid historical timestamps and relies on the required durable store; **do not expose it as an endpoint without that store**.

## Evidence and commands

Run from `D:/wedding-planner`:

```
node.exe --test scripts/test-doku-sandbox.mjs scripts/test-doku-security.mjs
node.exe --check services/doku-sandbox/protocol.mjs
node.exe node_modules/eslint/bin/eslint.js src --ext .ts,.tsx --max-warnings 0
node.exe node_modules/typescript/bin/tsc --noEmit --incremental false
```

Actual result: **68 tests, 68 pass, 0 fail**, no real network. `docs/doku-evidence/01-signing-red.log` → `02-signing-green.log`; `03-notification-red.log` → `04-notification-green.log`; `05-adapter-replay-red.log` → `06-adapter-replay-green.log`; full matrix `07-full-tests.log`. Red failures were missing signing, notification, adapter and replay exports. Security matrix also covers tamper/whitespace, malformed signature/JSON/UTF8, invalid dates, duplicate/folded headers, method/path/merchant mismatch, oversized bodies, exact amounts, absent/mismatched original request, unknown statuses/types, missing config/transport, network error and HTTP400/401/409/429/500. Lint, tsc and syntax each exit0 (`lint.log`, `tsc.log`, `syntax.log`). Existing app source unchanged; no Next build run because no app integration/config change and no need to consume real environment configuration. Standalone runnable kernel tested directly, not represented as bundled client code.

Existing dirty tree preserved. Before Graphify mutation: durable nonsecret graph backup `backups/doku-groundwork-20261022-053903/`, 149 files and SHA256 manifest. Protocol/tests/report were new paths, no original files overwritten. No secrets read; no hosted/customer reads, database/role changes, activation, deployment, git commit/push, VM/recovery work, or parent server operations.

## Official sources checked in current documentation

Accessed 22 October 2026 via real browser DOM (web-extract backend unavailable; direct urllib returned403; browser succeeded):
- Hosted request/response fields, channel conditions, price/invoice bounds: https://developers.doku.com/accept-payments/doku-checkout/integration-guide/backend-integration
- Exact non-SNAP signature algorithm and direction-specific Request-Target: https://developers.doku.com/get-started-with-doku-api/signature-component/non-snap/sample-code
- Notification raw signature, FAILED ignored for Checkout, duplicate handling and extensible fields: https://developers.doku.com/get-started-with-doku-api/notification/best-practice
- Non-SNAP notification payloads and original request: https://developers.doku.com/get-started-with-doku-api/notification/http-notification-sample-non-snap
- 2xx acknowledgement, retry schedule/manual retry: https://developers.doku.com/get-started-with-doku-api/notification/retry-notification
- Same Request-Id/body and HTTP409 replay: https://developers.doku.com/get-started-with-doku-api/idempotency-request
- Response signature is distinct: https://developers.doku.com/get-started-with-doku-api/signature-component/non-snap/signature-componen-from-response-header
- Actual simulator/notification verification gate: https://developers.doku.com/accept-payments/doku-checkout/integration-guide/simulate-payment-and-notification

## Final graph and diff verification

`graphify update .` exit0: **1122 nodes, 1481 edges, 112 communities**, graph.json/graph.html/GRAPH_REPORT.md updated together. AST-only update; document semantics not refreshed, 4461 unsupported artifacts skipped, 3 community labels renamed. Backup/fixture nodes are included, not a production-only map. Log: `docs/doku-evidence/graphify.log`. Graph source additions include this isolated kernel/tests; no app dependency was wired.

## Remaining gate

Verified sandbox merchant credentials, dashboard channel/notification setup, approved server hosting and durable transactional adapter, response signing verification, actual simulator payment/notification/retry and cross-request concurrency tests are still required. **No actual sandbox E2E or DOKU API success claimed.** Historical manual sales are not DOKU. Production sales/checkout stay disabled until separate approval and existing release gates are met.
