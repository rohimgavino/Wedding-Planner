# Admin modern UI — local only

Implemented canonical admin shell: dark forest desktop left sidebar, icon navigation, ivory workspace, sans typography, active states, concise headings, operational KPI first, compact date/search filters, responsive sales table/cards and progressive disclosure. Mobile drawer has Tab wrap, Escape, background inert, body scroll lock, focus restoration; closed mobile nav is visibility hidden. Menu Akses Admin remains developer-only. Auth, role RPC, verified registry-only sales, BigInt formatting, data access and mutation confirmations retained. DOKU unavailable and gross/non-net warnings remain visible. No public landing/app redesign, hosted changes, DB writes, commit or push.

## Files
- src/app/admin/page.tsx
- src/app/admin/admin.css (new, admin scoped)
- src/components/admin-shell.tsx (new)
- src/components/admin-sales.tsx
- scripts/test-admin-sales-browser.py (updated drawer/headings selectors)
- graphify outputs
- this report

Permanent prior-file backup: backups/admin-modern-20261021-203626/ (page, sales component, browser test). Existing dirty tree retained.

## Execution
- npm run lint, npx tsc --noEmit PASS final.
- npm run build canonical PASS (13 routes): docs/admin-evidence/modern-real-build.log. No fixture env injected into canonical build.
- Sales client and actual SQL PASS exact BigInt, >50 aggregate, registry, WIB filters, role denial; admin contract and overview SQL PASS.
- Historical admin-expand 3 grouped, admin-stage 10 and developer-stage 7 SQL tests PASS via node.exe (Git Bash node shim initially gave stdin-not-tty; native node.exe fixed it).
- Updated role browser PASS from isolated actual-source export: D:/pocketwedding-previews/admin/role-browser-modern.log. Tests operator/developer menu, ordinary/revoked denial, invalid dates no request, backend error hides stale total, empty and widths 360/390/430/1280. Transport intercepted, no hosted calls.
- Isolated build PASS: D:/pocketwedding-previews/admin/build-modern.log, synthetic-only URL/key, source manifest 51 files. No actual .env copied/read.
- Loopback full browser suite passed once on earlier visual iteration: verification.json (20 menu checks + keyboard focus/Escape + 403, no external requests or errors). Final rerun needs parent server restart (see blocker).
- Final screenshots from transport-fixture actual export: D:/pocketwedding-previews/admin/docs/admin-evidence/sales-{360,390,430,1280}.png. Vision inspected final mobile: KPI before filters, no visible overflow, coherent green/ivory. Remaining minor layout: date-label wrapping and existing global AuthGate logout utility strip. Earlier normal preview desktop vision showed good shell/table but preview banner clipped brand; compact preview banner plus preview-only sidebar offset corrected in preview.js.

## Final preview re-verification

Resolved: live server now serves all 12 script assets HTTP200. Re-ran `test-preview.py` against the final normal-browser loopback preview: PASS all 20 menu/viewport checks (360/390/430/1280), drawer keyboard checks, zero external requests, zero page errors, mutation HTTP403, 51 source hashes verified. Final screenshots refreshed at D:/pocketwedding-previews/admin/preview-{360,390,430,1280}.png. Previous restart blocker below is historical, not outstanding.

## Previous parent action required
Preview URL remains http://127.0.0.1:4187/admin. Parent owns process proc_de5c0a1a9266. Current server.py now snapshots STATIC_FILES at startup; rebuilding changes bundle hashes, so server must restart after final build or new chunks return 404. I did not stop/reconfigure parent-owned server or change its routes/security. After restarting same server.py on 4187, run `python D:/pocketwedding-previews/admin/test-preview.py` for final normal-browser artifacts and verification. Tunnel child should forward same port; no tunnel modifications here.

Canonical source and isolated preview source hashes match for all four admin files. preview.js only changed warning presentation; demo auth remains isolated. Mutations remain403 in server. Not a production release; additive sales/overview migrations remain undeployed.
