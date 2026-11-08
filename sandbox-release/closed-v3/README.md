# CLOSED DOKU Sandbox branch package

Branch: `sandbox/doku-checkout`. Publication only; no deployment or activation is authorized by this commit. Base main: `43f766d586a32663592217da6540f80bde838e3e`.

## Cloudflare Connect repository form (future separate approval)

Repository: `rohimgavino/Wedding-Planner`; production branch selector: **sandbox/doku-checkout**, NOT main. Keep automatic builds and non-production branch builds/previews disabled until exact settings are reviewed. Connecting/saving can trigger deployment: do not save just to inspect.

For BOTH Sandbox Workers, Root directory: `sandbox-release/closed-v3`.

Build command: `npm ci --no-audit --no-fund && npm run verify`

API deploy command:
`npx --no-install wrangler deploy --config services/doku-cf-sandbox/wrangler.simple-sandbox.json`

Harness deploy command:
`npx --no-install wrangler deploy --config services/doku-sbx-harness/wrangler.json`

Do NOT use an unconfigured `npx wrangler deploy`, framework auto-detection, or `versions upload` as a substitute. The package pins Wrangler 4.151.3 and jose 6.1.0; package-lock.json pins the platform-specific dependency graph. A blank build command is NOT the documented/recommended setup: dependency installation and the CLOSED verification must run explicitly. No Next.js build is needed.

Exact account: `4c9d871a80b70e0c2275773bcd51db84`.
API: `pp-doku-sbx-disabled-20261102-bec84f2`.
Harness: `pp-doku-sbx-harness-20261102`.
The branch-only repository-root wrangler.jsonc is deliberately replaced with CLOSED API configuration, never everrae. Still use the explicit commands and package root above.

## Configuration-required harness

No real browser key is published. `public-config.txt` is the audited offline placeholder: publishableKey null, checkoutEnabled false, offlinePackaging true. This package can be built and served CLOSED but cannot log in or complete checkout. Supplying actual browser-public configuration requires a separate reviewed step; do not paste credentials into Git/build variables. No secret values are included.

API SANDBOX_ENABLED=false, PLANNER_TRANSPORT_VERSION=disabled; successor protocol selected but not activated. Preview URLs, routes, logpush, tails and observability remain disabled. No lease UUID, actual lease deadline, timer, workflow, DB mutation or provider request is included. SQL and closure runner are deliberately excluded from this runtime import closure, not represented as a complete activation/closure route.

## Public response allowlist

Harness serves only `/`, `/app.mjs`, `/checkout-client.mjs`, `/workspace-intent-client.mjs`, `/workspace-inventory.mjs`, `/timeout-probe.mjs`, `/style.css`, `/catalog.json`, `/config.json`. Other paths and query strings return 404; only GET/HEAD allowed. Text modules are explicit imports; neither Worker uses a directory asset upload. Internal configs, source, docs and lockfiles are not public assets.

## Provenance and actual verification

Original 29-file source manifest SHA256: `7491a3bb74b9309be814bb8d9b4f34134eeab7eb21a9bd4a81759a97b4ea20fc`. All 29 originals checked before copying. `package-provenance.json` records copied bytes and deviations; `npm run verify` checks hashes and CLOSED invariants. New lockfile uses Wrangler's own bundler/runtime dependencies, distinct from the original test harness tooling.

Actual branch checks: npm ci succeeded; CLOSED invariants and 26 provenance hashes passed; Wrangler 4.151.3 API and harness `deploy --dry-run` succeeded (94.98 KiB and 51.67 KiB). An initial dry-run exposed a missing lease-bridge import; restored its exact audited source, then both final dry-runs passed. No real deploy was run. Historical source-package regression counts (107 + 3) are not claimed as freshly rerun here.
