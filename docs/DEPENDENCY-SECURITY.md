# Dependency security remediation — 2026-10-12

Canonical repo only: D:/wedding-planner. No backend, authentication, payments, storage namespace or design activation/change.

## Result
- Before all dependencies: 12 (2 moderate, 9 high, 1 critical). Production: 2 (1 high, 1 critical).
- After: production **0**; all dependencies **7 high**, no critical/moderate.
- Next 14.2.35 -> pinned 15.5.27; matching eslint-config-next. Next 14 does not cover current advisory patched ranges; Next 15 supports existing React 18.3 and installed Node 26.7.0, avoiding an unnecessary Next 16/React 19 migration.
- Removed unsupported swcMinify. Replaced deprecated next lint with explicit ESLint CLI, preserving core-web-vitals configuration. Five internal homepage anchors converted to Link without class/copy changes. Next added TypeScript ES2017 target.
- Actual patched dependencies, not audit suppression: Next's pinned PostCSS 8.4.31 overridden with 8.5.29 (same major); selector parser 6 overridden with 7.1.6 (necessary major API-compatible use verified through Tailwind build and browser tests). Overrides are reviewed compatibility decisions, not an audit-only cosmetic exclusion.

## Specific remaining blocker
Registry latest braces is **3.0.3**; GHSA-vfj7-8cjw-p6xm affects <=3.0.3 (deeply nested patterns -> stack-exhaustion DoS). No patched braces release is published at audit time. It is brought in by micromatch 4.0.8, chokidar 3.6.0 and fast-glob, used by Tailwind 3.4.19 and Next's lint plugin. The seven affected nodes are braces, micromatch, chokidar, fast-glob, tailwindcss, @next/eslint-plugin-next and eslint-config-next. All are development tooling; production audit is zero. Do not process untrusted glob patterns in this toolchain.

A Tailwind 4 migration plus replacement of the lint plugin's glob traversal (or an upstream braces patch) is needed for zero total. That migration changes CSS generation and is deliberately not forced onto the exact existing UI. No ignore/audit-level filtering, invented patched braces override, or npm audit fix --force was used. Continue monitoring upstream and require a separately regression-tested migration before claiming zero total.

## Verification
Clean lint, tsc --noEmit, Next static build; storage migration unit tests; CSV parser tests; installed Chrome landing/menu/FAQ/demo/reduced-motion/image tests; dashboard CRUD/RSVP/delete/reset/persistence and viewport tests; CSV template/upload/preview/cancel/append/reload/export tests; legacy SW deleted-hash CSS failure reproduction and recovery/offline/current-cache poisoning tests; local release route/assets/sensitive404/same-origin migration tests. Evidence is in security-evidence/*.json and *.log. Public release verification runs after publishing only out to existing wedding-planner project.

## Rollback
Targeted original manifest, lock and configs: D:/backups/wedding-planner-security-20261012. Previous Git SHA: 5c7f7f656cc4174703028787a1f4881d5782ff7b. Previous Pages production deployment: 17ceb54e-f58c-45fc-b6d6-a7204d2b6a9f. Restore explicit backed-up files, npm ci and rebuild, or use Pages rollback. Never blanket reset or clean unrelated graph changes.
