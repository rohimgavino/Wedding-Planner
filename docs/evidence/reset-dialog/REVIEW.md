# Reset dialog UI regression — 2026-10-29

Baseline: a4eb156f48c1432f983bad20afc4ec5fd9d5060f, origin/main rohimgavino/Wedding-Planner. Isolated branch fix/reset-dialog-surface-20261029. Canonical publish clone was clean and preserved.

## Diagnosis and scoped fix
Browser RED measured transparent dialog background rgba(0,0,0,0) and backdrop z-index100. Existing reset content relied on layout utility classes without an explicit opaque role=dialog surface. New reset-only class supplies white panel, dark foreground, overlay z-index2000, border, viewport-limited scrolling, controls and focus outlines. Reset-only portal escapes dashboard stacking/inherited typography. Other PlannerDialog callers retain existing rendering; reset confirmation string, owner guard, busy state and mutation code are unchanged.

## Executed verification
- Fixture-configured Next static build: success (reset-build-fixture.log).
- RED: reset-red.log, exact transparent-surface assertion failure.
- GREEN: scripts/test-reset-surface-browser.py, 40 cases: 360x640/390x844/430x844/1280x900/844x390; 100%/200% root text; app, synthetic Android/iOS banner obstacles and emulated standalone display mode. Opaque white panel, viewport bounds, scroll-reachable cancel, no horizontal overflow, above banner, body lock, focus wrapping/return, Escape, backdrop cancellation, exact confirmation enablement. Zero reset submissions, zero hosted requests. Metrics and screenshots adjacent.
- Existing guidance/reset browser fixture: PASS exact confirmation, synthetic error/success reload, partner guard. Its two reset RPC responses were intercepted in memory, never hosted.
- Existing empty-workspace browser fixture: PASS 16 cases.
- npm run lint, npx tsc --noEmit, node scripts/test-cloud.cjs: PASS.
- Self-review of exact three production-file diff: no mutation/auth/commerce/DB changes, no secrets or user-controlled eval. Test harness compiles only the checked-in fixture prefix and fixed local test steps; external traffic fail-closed.
- Graphify update: 628 nodes/1054 edges/53 communities; missing SQL extractor and two symbol-free files. Generated broad graph churn retained locally, excluded from UI-only publication.

## Visual evidence and limitations
app-390-844-1.png shows opaque readable panel without underlying text collision. Long dialog initially exceeds inner visible area, intentionally scrolls; scrolled-* screenshots/assertions prove buttons reachable. These are Edge desktop-engine synthetic tests, not physical iOS/Android installation or keyboard tests. Service workers blocked in fixtures; unchanged network-first authenticated navigation and content-hashed assets inspected, not actual installed-cache upgrade proof.

## Release gate / blocker
Remote main remained a4eb156 at review. Existing Workers Builds check for a4eb156 succeeded (build 2c7ed278-c814-4a5b-9025-3c4c716cc0ee). Read-only deployment inventory was captured in reset-deploy-before.log and reset-version-before.json. Cloudflare Settings/Builds inspection is blocked by security verification in the available browser. Current production branch/root/build-command/public-build-variable presence cannot be independently verified; successful prior check is not configuration proof. Do not manually Wrangler-deploy. No new GitHub main push or live-release claim until this required gate can be checked. No hosted authenticated traffic or data mutation was performed.
