# CLOSED sandbox API workflow — local preparation only

No deployment authorized. Review these three files before any commit/push. Do not include an approval marker in the publication commit. No main changes are needed.

Target: `rohimgavino/Wedding-Planner`, branch `sandbox/doku-checkout`; API Worker `pp-doku-sbx-disabled-20261102-bec84f2`; account `4c9d871a80b70e0c2275773bcd51db84`.

## Trigger / later authorization

`workflow_dispatch` is deliberately absent: GitHub requires the workflow to exist on the default branch for registration/manual dispatch. Merely publishing this branch-only workflow must not deploy. Only a subsequent single new, non-force-pushed commit which **only adds** `.github/sandbox-approvals/deploy-closed-api-v3.txt` can pass the gate. Ordinary pushes and the publication commit do not match its path filter. The marker does NOT exist in this preparation.

After separate explicit deployment approval, publish the reviewed workflow first (without marker), manually store the scoped token, then create and push exactly one marker-only commit with these exact LF bytes (including final newline):

```text
APPROVE CLOSED API ONLY
artifact-tree=2f4be20337904a365b10a5a7103db95c22067dae
worker=pp-doku-sbx-disabled-20261102-bec84f2
```

This is a one-shot gate: an update or deletion of an existing marker is refused. Do not batch publication and approval into one push. Keep the marker absent until deployment has been explicitly approved. A missing secret causes failure, not fallback authentication.

## Manual secret entry only when ready

https://github.com/rohimgavino/Wedding-Planner/settings/secrets/actions/new

Name: `CLOUDFLARE_SANDBOX_API_TOKEN`. User enters the value directly; never send it in chat. Intended Cloudflare token: Individual Workers Editor scoped only to the exact API Worker above, proposed expiry seven days. Token has not been created/provisioned by this preparation. Do not use an account-wide/all-zones token. GitHub repository Actions policy and actual Cloudflare per-Worker token deploy compatibility remain hosted-unverified.

No harness token, public config, DOKU credential, checkout opening, database action, production deployment, timers or lease activation is included. Existing closed vars remain `SANDBOX_ENABLED=false` and `PLANNER_TRANSPORT_VERSION=disabled`. The workflow does not deploy the harness.

## Build and safety

Checkout v4.2.2 and setup-node v4.4.0 full commit pins were verified against official Git tag refs. Contents permission is read-only and checkout credentials are not persisted. No event/user inputs are interpolated into shell commands. Secret is supplied only to the final deploy step, never validation/install/dry-run; it is not explicitly printed.

The pre-secret gate requires the pinned artifact Git tree, exact target/account, closed vars, provenance and marker-only single commit. The published tree contains eleven manifest-covered files whose Git LF blobs differ from their pre-publication CRLF provenance hashes. The checker restores CRLF **only when the restored SHA-256 equals the existing pinned manifest**; it does not rewrite hashes or accept source changes. This enables a fresh Linux checkout without changing the approved release artifact. `npm ci --no-audit --no-fund && npm run verify` then verifies all 26 provenance hashes. Locked Wrangler 4.151.3 packages the API with `--dry-run` before the credential-bearing deploy command.

## Actual local evidence

- actionlint 1.7.12: exit 0 (shellcheck unavailable/disabled).
- Node syntax check: pass.
- Isolated offline fixture: one valid single-marker commit accepted; eight invalid cases refused (wrong branch/repository/account, forced push, branch creation, multi-commit push, wrong marker, modified activation config).
- Real npm ci + verify: exit 0, CLOSED invariants and 26 provenance hashes PASS.
- Wrangler 4.151.3 dry-run: exit 0; 94.98 KiB total / 22.58 KiB gzip; CLOSED bindings shown; no release.
- npm 11.19.1 reported install-script approval warnings for esbuild/workerd; dry-run nevertheless succeeded. Hosted Node 22.16/npm behavior has not run.

Only disposable offline fixture repositories received synthetic local commits; the published isolated clone remains at 09fbc17c0872263c7f11bab0c6321776ab8d023a. No commit/push/hosted execution was performed there. Original dirty repository was not modified. Review must also consider any provider-side Builds triggers separately before later publication; no provider settings were changed.
