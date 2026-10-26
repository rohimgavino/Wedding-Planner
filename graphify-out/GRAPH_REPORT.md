# Graph Report - wedding-planner  (2026-10-22)

## Corpus Check
- 219 files · ~259,543 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4549 file(s) not represented in the graph (top: (none) 4347, .log 150, .map 16)

## Summary
- 1644 nodes · 2163 edges · 139 communities (92 shown, 33 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a26c6159`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.ts
- devDependencies
- compilerOptions
- admin-pricing-20261022-061447/manifest.json
- WorkspaceContext.tsx
- test-planning-reset.mjs
- manifest.json
- app/page.tsx
- Panduan AI Agent — Wedding Planner PWA
- PocketWedding — canonical Wedding Planner
- next.config.mjs
- postcss.config.mjs
- sw.js
- test-guest-csv.cjs
- Dependency security remediation — 2026-10-12
- EverRae — implementation audit
- EverRae visual preferences
- Handler
- Mobile CSS loss after rebuild
- test-guest-csv-browser.py
- .eslintrc.json
- test-dashboard.py
- PRD kanonis — EverRae / PocketWedding
- IMAGE-ATTRIBUTION.md
- legacy-sw.js
- test-preview.py
- test-service-worker.py
- tier-pricing.ts
- 202610120001_secure_foundation.sql
- Backend foundation — local SQL verification, not a release
- test-admin-native-readiness.py
- Handler
- Integrasi auth dan workspace cloud — lokal, belum rilis
- 202610140001_workspace_entitlements_savings.sql
- Admin minimal — hasil lokal, belum rilis
- Hasil tahap pertama berbayar — lokal, belum rilis
- 202610140002_admin_manual_purchases.sql
- Admin-first expand — hasil lokal 14 Oktober 2026
- test-workspace-storage.cjs
- native-3cc97a49cb/synthetic-backup.sql
- native-ff04b68e69/synthetic-backup.sql
- public.reset_planning_content
- 202610140004_developer_operator_roles.sql
- Commerce
- Communities (120 total, 29 thin omitted)
- Pemisahan developer / operator — lokal, belum rilis
- pocketwedding-admin-20261021-153041/package.json
- Commerce
- package.json
- test-commerce.cjs
- test-developer-ui.cjs
- Handler
- Empty authenticated workspace UI fix
- test-savings.cjs
- devDependencies
- dependencies
- Staged rollout paid / admin / reset
- PocketWedding admin — menu & penjualan lokal
- prepare-admin-release.py
- pocketwedding-admin-20261021-153041/public/manifest.json
- dependencies
- test-pocketwedding-admin.cjs
- pocketwedding-admin-20261021-153041/manifest.json
- Wedding Planner & Collaborative Workspace PWA
- scripts
- scripts
- PocketWedding admin readiness — 21 Oktober 2026
- test-backend.mjs
- test-admin-expand.mjs
- test-developer-stage.mjs
- overrides
- overrides
- test-admin-stage.mjs
- test-paid-stage.mjs
- test-pocketwedding-overview.mjs
- verify-pocketwedding-admin.py
- admin/layout.tsx
- public.admin_workspace_overview
- tailwind.config.ts
- pocketwedding-admin-20261021-153041/test-commerce.cjs
- PocketWedding — implementasi admin lokal (21 Oktober 2026)
- test-auth-configured-browser.py
- Handler
- Handler
- Handler
- Handler
- Handler
- test-admin-sales-client.cjs
- test-admin-sales.mjs
- admin-sales-20261021-163402/manifest.json
- verify-admin-sales.py
- doku-groundwork-20261022-053903/manifest.json
- Handler
- Approved admin-only release: STOPPED before production writes
- Preflight reset password database PocketWedding
- services/doku-sandbox/protocol.mjs
- admin-pricing-20261022-061447/services/doku-sandbox/protocol.mjs
- DOKU sandbox groundwork — 22 October 2026
- Admin modern UI — local only
- Admin release gate check — local review
- 202610220001_admin_package_pricing.sql
- WorkspaceProvider
- Handler
- Paket & Harga — local implementation (22 October 2026)
- test-admin-pricing-client.cjs
- test-admin-pricing.mjs
- admin-pricing-20261022-061447/src/components/admin-shell.tsx
- verify-admin-pricing.py
- doku-sandbox/durable.sql
- doku-durable-20261022-072040/protocol.mjs
- Graph Report - wedding-planner  (2026-10-22)
- DOKU durable local transaction stage
- test-doku-native.py
- pricing-native-68193575e3/durable.sql
- test-pricing-native-release.py
- test-branding.cjs
- prepare-pricing-release.py
- 202610220002_tier_pricing.sql
- test-tier-native.py
- Paket & Harga — native/local release rehearsal
- Handler
- test-tier-client.cjs
- test-tier-pricing.mjs
- verify-tier-pricing.py
- prepare-tier-release.py

## God Nodes (most connected - your core abstractions)
1. `Communities (120 total, 29 thin omitted)` - 80 edges
2. `createClient()` - 32 edges
3. `Commerce` - 30 edges
4. `useWorkspace()` - 25 edges
5. `useAuth()` - 25 edges
6. `formatRupiah()` - 21 edges
7. `Commerce` - 16 edges
8. `compilerOptions` - 16 edges
9. `Commerce` - 15 edges
10. `checked()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `route()` --indirect_call--> `uid()`  [INFERRED]
  backups/admin-modern-20261021-203626/scripts/test-admin-sales-browser.py → scripts/test-admin-native-readiness.py
- `route()` --indirect_call--> `uid()`  [INFERRED]
  scripts/test-admin-browser.py → scripts/test-admin-native-readiness.py
- `intercept()` --indirect_call--> `uid()`  [INFERRED]
  scripts/test-admin-expand-browser.py → scripts/test-admin-native-readiness.py
- `route()` --indirect_call--> `uid()`  [INFERRED]
  scripts/test-admin-sales-browser.py → scripts/test-admin-native-readiness.py
- `authenticated_route()` --indirect_call--> `uid()`  [INFERRED]
  scripts/test-auth-configured-browser.py → scripts/test-admin-native-readiness.py

## Import Cycles
- None detected.

## Communities (139 total, 33 thin omitted)

### Community 0 - "index.ts"
Cohesion: 0.09
Nodes (39): GuestCSVImport(), WorkspaceContextType, CloudSnapshot, fields, Table, WorkspaceParams, GUEST_CATEGORIES, GUEST_CSV_HEADERS (+31 more)

### Community 1 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, @electric-sql/pglite, eslint, eslint-config-next, postcss, tailwindcss, @types/node (+3 more)

### Community 2 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 3 - "admin-pricing-20261022-061447/manifest.json"
Cohesion: 0.01
Nodes (163): graphify-out\\2026-10-10\\graph.json, graphify-out\\2026-10-10\\GRAPH_REPORT.md, graphify-out\\2026-10-10\\.graphify_analysis.json, graphify-out\\2026-10-10\\.graphify_labels.json, graphify-out\\2026-10-10\\manifest.json, graphify-out\\2026-10-12\\graph.json, graphify-out\\2026-10-12\\GRAPH_REPORT.md, graphify-out\\2026-10-12\\.graphify_analysis.json (+155 more)

### Community 4 - "WorkspaceContext.tsx"
Cohesion: 0.06
Nodes (54): AdminPanel(), AdminSales(), AdminPanel(), AdminPanel(), AdminPanel(), Panel(), AdminPanel(), CallbackPage() (+46 more)

### Community 7 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 8 - "app/page.tsx"
Cohesion: 0.12
Nodes (16): Features, Showcase(), Hero(), FAQ(), faqs, Footer(), HowItWorks(), Pricing() (+8 more)

### Community 9 - "Panduan AI Agent — Wedding Planner PWA"
Cohesion: 0.29
Nodes (6): 1. Prinsip Utama Proyek, 2. Standar Workflow Graphify (Wajib di Setiap Project), 3. Aturan Coding & Arsitektur, Panduan AI Agent — Wedding Planner PWA, Saat Sesi Baru Dimulai:, Setelah Mengubah Kode / Menambah Fitur:

### Community 10 - "PocketWedding — canonical Wedding Planner"
Cohesion: 0.22
Nodes (8): Dokumentasi Proyek, Fitur Tahap 1 (MVP), Historical baseline documentation (not proof of active cloud features), Menjalankan Secara Lokal, PocketWedding — canonical Wedding Planner, Run and verify, Satu proyek, satu sumber kerja, Wedding Planner & Collaborative Workspace PWA

### Community 14 - "test-guest-csv.cjs"
Cohesion: 0.22
Nodes (8): assert, fs, guest, mod, Module, source, template, ts

### Community 15 - "Dependency security remediation — 2026-10-12"
Cohesion: 0.33
Nodes (5): Dependency security remediation — 2026-10-12, Result, Rollback, Specific remaining blocker, Verification

### Community 16 - "EverRae — implementation audit"
Cohesion: 0.29
Nodes (6): Accessibility and verification, Active versus planned, Composition, EverRae — implementation audit, Isolation and baseline, Scope limitations

### Community 17 - "EverRae visual preferences"
Cohesion: 0.33
Nodes (5): Asset review checklist, Current imagery, EverRae visual preferences, Implementation choice, Scope

### Community 18 - "Handler"
Cohesion: 0.47
Nodes (3): Handler, SimpleHTTPRequestHandler, Local static-export preview with clean route rewrites, no deployment.

### Community 19 - "Mobile CSS loss after rebuild"
Cohesion: 0.40
Nodes (4): Cause and proof, Fix, Mobile CSS loss after rebuild, Verification

### Community 23 - "PRD kanonis — EverRae / PocketWedding"
Cohesion: 0.11
Nodes (16): Arsitektur dan akses berbayar, Batas bukti, Boundary keamanan, Pengujian provisioning lokal terkontrol, Urutan migration dan rollout, Backend next stage — dokumen historis, Admin minimal (lokal, belum rilis), Batas rollout (+8 more)

### Community 30 - "tier-pricing.ts"
Cohesion: 0.17
Nodes (23): AdminPricing(), AdminTierPricing(), Editor(), names, formatPackagePrice(), PackagePricing, readPricing(), snapshot() (+15 more)

### Community 32 - "Backend foundation — local SQL verification, not a release"
Cohesion: 0.33
Nodes (5): Actual TDD and verification, Backend foundation — local SQL verification, not a release, Remaining blockers / explicit limits, Scope and artifacts, Security and RPC contracts

### Community 33 - "test-admin-native-readiness.py"
Cohesion: 0.29
Nodes (5): actor(), connect(), demote(), Disposable native PG17 rehearsal. No hosted connections/env credentials. Run:…, uid()

### Community 34 - "Handler"
Cohesion: 0.40
Nodes (3): Handler, SimpleHTTPRequestHandler, Exercise real static export in Chromium, without hosted writes.

### Community 35 - "Integrasi auth dan workspace cloud — lokal, belum rilis"
Cohesion: 0.40
Nodes (4): Blocker dan batas verifikasi, Bukti eksekusi, Hasil implementasi, Integrasi auth dan workspace cloud — lokal, belum rilis

### Community 36 - "202610140001_workspace_entitlements_savings.sql"
Cohesion: 0.23
Nodes (10): public.keep_savings_workspace, public.has_workspace_entitlement(), public.release_controls, public.savings_contributions, public.workspace_entitlements, savings_contributions_workspace, savings_workspace_immutable, public (+2 more)

### Community 37 - "Admin minimal — hasil lokal, belum rilis"
Cohesion: 0.22
Nodes (8): Admin minimal — hasil lokal, belum rilis, Batas dan release gate, Bukti eksekusi nyata, File, Hasil, Provisioning admin — SQL out-of-band, BUKAN dijalankan sekarang, SOP transaksi, Tambahan onboarding/reset — lokal, belum rilis

### Community 38 - "Hasil tahap pertama berbayar — lokal, belum rilis"
Cohesion: 0.40
Nodes (4): Batas keamanan dan release gates, Bukti eksekusi, Hasil, Hasil tahap pertama berbayar — lokal, belum rilis

### Community 39 - "202610140002_admin_manual_purchases.sql"
Cohesion: 0.15
Nodes (10): audit_no_change, one_pending_core_purchase, public.purchase_requests, public.verified_transactions, auth, auth.users, public, public.audit_immutable (+2 more)

### Community 40 - "Admin-first expand — hasil lokal 14 Oktober 2026"
Cohesion: 0.20
Nodes (9): Admin-first expand — hasil lokal 14 Oktober 2026, Approval berikutnya, Commands migration — PROPOSAL ONLY, belum dijalankan, Eksekusi nyata, Identitas dan inventory trusted, Implementasi expand-contract, Native/backup gate belum terpenuhi, Paket review terisolasi (+1 more)

### Community 41 - "test-workspace-storage.cjs"
Cohesion: 0.22
Nodes (7): assert, fs, m, Module, s, ts, valid

### Community 42 - "native-3cc97a49cb/synthetic-backup.sql"
Cohesion: 0.09
Nodes (18): public.accept_partner_invitation(), public.admin_workspace_overview(), public.create_partner_invitation(), public.enforce_workspace_capacity(), public.grant_developer_test_access(), public.has_developer_test_access(), public.has_workspace_entitlement(), public.is_site_admin() (+10 more)

### Community 43 - "native-ff04b68e69/synthetic-backup.sql"
Cohesion: 0.09
Nodes (18): public.accept_partner_invitation(), public.admin_workspace_overview(), public.create_partner_invitation(), public.enforce_workspace_capacity(), public.grant_developer_test_access(), public.has_developer_test_access(), public.has_workspace_entitlement(), public.is_site_admin() (+10 more)

### Community 45 - "202610140004_developer_operator_roles.sql"
Cohesion: 0.15
Nodes (11): public.protect_last_developer, last_developer, public.developer_test_grants, public.grant_developer_test_access(), public.has_developer_test_access(), public.has_workspace_entitlement(), public.set_site_admin(), auth.users (+3 more)

### Community 46 - "Commerce"
Cohesion: 0.14
Nodes (8): AuditEntry, checked(), Commerce, integer(), parsePackage(), PurchaseRequest, SiteSettings, validLynkURL()

### Community 47 - "Communities (120 total, 29 thin omitted)"
Cohesion: 0.03
Nodes (80): Communities (120 total, 29 thin omitted), Community 0 - "index.ts", Community 101 - "doku-groundwork-20261022-053903/manifest.json", Community 102 - "Handler", Community 103 - "Approved admin-only release: STOPPED before production writes", Community 104 - "Preflight reset password database PocketWedding", Community 107 - "services/doku-sandbox/protocol.mjs", Community 108 - "admin-pricing-20261022-061447/services/doku-sandbox/protocol.mjs" (+72 more)

### Community 48 - "Pemisahan developer / operator — lokal, belum rilis"
Cohesion: 0.29
Nodes (6): Bukti eksekusi, Checklist rollout — preserve akses live dahulu, File, Pemisahan developer / operator — lokal, belum rilis, Provisioning awal — jangan jalankan sekarang, Siap lokal

### Community 49 - "pocketwedding-admin-20261021-153041/package.json"
Cohesion: 0.09
Nodes (22): description, autoprefixer, clsx, @electric-sql/pglite, eslint, eslint-config-next, lucide-react, next (+14 more)

### Community 50 - "Commerce"
Cohesion: 0.16
Nodes (8): AuditEntry, checked(), Commerce, integer(), parsePackage(), PurchaseRequest, SiteSettings, validLynkURL()

### Community 51 - "package.json"
Cohesion: 0.09
Nodes (22): description, autoprefixer, clsx, @electric-sql/pglite, eslint, eslint-config-next, lucide-react, next (+14 more)

### Community 52 - "test-commerce.cjs"
Cohesion: 0.25
Nodes (7): assert, calls, client, fs, m, Module, ts

### Community 53 - "test-developer-ui.cjs"
Cohesion: 0.25
Nodes (7): assert, calls, client, fs, m, Module, ts

### Community 54 - "Handler"
Cohesion: 0.33
Nodes (3): Handler, SimpleHTTPRequestHandler, Authenticated empty dashboard transport fixture; no hosted network/writes.…

### Community 55 - "Empty authenticated workspace UI fix"
Cohesion: 0.33
Nodes (5): Empty authenticated workspace UI fix, Minimal production changes, Root cause and red evidence, Safe baseline isolation, Verification

### Community 56 - "test-savings.cjs"
Cohesion: 0.33
Nodes (5): assert, fs, m, Module, ts

### Community 57 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, @electric-sql/pglite, eslint, eslint-config-next, postcss, tailwindcss, @types/node (+3 more)

### Community 58 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, clsx, lucide-react, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+1 more)

### Community 59 - "Staged rollout paid / admin / reset"
Cohesion: 0.15
Nodes (12): Bukti baru yang diverifikasi, Desain eksplisit grandfather (usulan, BELUM SQL diimplementasikan), Preservasi Git dan baseline, Runner / rehearsal / bootstrap, Staged rollout paid / admin / reset, Tahap 1 — database safety, legacy strategy, admin bootstrap (prepare dahulu), Tahap 2 — admin release; sales tetap disabled, Tahap 3 — paid enforcement terkontrol (+4 more)

### Community 60 - "PocketWedding admin — menu & penjualan lokal"
Cohesion: 0.29
Nodes (6): Batas / pekerjaan berikutnya, Bukti eksekusi aktual, Hasil, Perubahan persis, PocketWedding admin — menu & penjualan lokal, SQL additive, bukan rollout

### Community 64 - "pocketwedding-admin-20261021-153041/public/manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 65 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, clsx, lucide-react, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+1 more)

### Community 66 - "test-pocketwedding-admin.cjs"
Cohesion: 0.22
Nodes (8): assert, c, calls, fs, mod, Module, source, ts

### Community 67 - "pocketwedding-admin-20261021-153041/manifest.json"
Cohesion: 0.25
Nodes (7): package.json, package-lock.json, public/manifest.json, README.md, src/app/admin/page.tsx, src/app/layout.tsx, src/lib/commerce.ts

### Community 68 - "Wedding Planner & Collaborative Workspace PWA"
Cohesion: 0.25
Nodes (7): Dokumentasi Proyek, EverRae — canonical Wedding Planner, Fitur Tahap 1 (MVP), Historical baseline documentation (not proof of active cloud features), Menjalankan Secara Lokal, Run and verify, Wedding Planner & Collaborative Workspace PWA

### Community 69 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, graphify, lint, start, test:backend

### Community 70 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, graphify, lint, start, test:backend

### Community 71 - "PocketWedding admin readiness — 21 Oktober 2026"
Cohesion: 0.29
Nodes (6): Artifacts dan preservasi, Hasil aktual: role sudah ada, jangan provision ulang, Hosted schema berbeda dari laporan lama, Native PostgreSQL rehearsal benar-benar dijalankan, PocketWedding admin readiness — 21 Oktober 2026, Runbook dan keputusan release

### Community 74 - "test-developer-stage.mjs"
Cohesion: 0.50
Nodes (3): db, user(), uuid()

### Community 75 - "overrides"
Cohesion: 0.50
Nodes (4): postcss, overrides, next, postcss-selector-parser

### Community 76 - "overrides"
Cohesion: 0.50
Nodes (4): postcss, overrides, next, postcss-selector-parser

### Community 84 - "pocketwedding-admin-20261021-153041/test-commerce.cjs"
Cohesion: 0.25
Nodes (7): assert, calls, client, fs, m, Module, ts

### Community 85 - "PocketWedding — implementasi admin lokal (21 Oktober 2026)"
Cohesion: 0.33
Nodes (5): Blocker terpisah sebelum penggunaan nyata, Bukti eksekusi aktual, File persis pekerjaan ini, Hasil dan batas, PocketWedding — implementasi admin lokal (21 Oktober 2026)

### Community 90 - "test-auth-configured-browser.py"
Cohesion: 0.29
Nodes (4): authenticated_route(), Handler, SimpleHTTPRequestHandler, Local-only auth transport fixture; NOT real Google/Supabase evidence. Run…

### Community 91 - "Handler"
Cohesion: 0.33
Nodes (4): Handler, SimpleHTTPRequestHandler, Transport fixture only; no hosted auth/payment/database operations., route()

### Community 92 - "Handler"
Cohesion: 0.33
Nodes (4): Handler, intercept(), SimpleHTTPRequestHandler, Admin-only isolated build, intercepted transport, never hosted writes.

### Community 93 - "Handler"
Cohesion: 0.33
Nodes (4): Handler, SimpleHTTPRequestHandler, Local intercepted admin UI, no external traffic or hosted writes., route()

### Community 94 - "Handler"
Cohesion: 0.33
Nodes (4): Handler, SimpleHTTPRequestHandler, Local transport fixture; every Supabase request intercepted, no hosted writes., route()

### Community 95 - "Handler"
Cohesion: 0.33
Nodes (4): Handler, SimpleHTTPRequestHandler, Local intercepted admin UI, no external traffic or hosted writes., route()

### Community 96 - "test-admin-sales-client.cjs"
Cohesion: 0.33
Nodes (5): assert, fs, m, Module, ts

### Community 101 - "doku-groundwork-20261022-053903/manifest.json"
Cohesion: 0.01
Nodes (149): graphify-out\\2026-10-10\\graph.json, graphify-out\\2026-10-10\\GRAPH_REPORT.md, graphify-out\\2026-10-10\\.graphify_analysis.json, graphify-out\\2026-10-10\\.graphify_labels.json, graphify-out\\2026-10-10\\manifest.json, graphify-out\\2026-10-12\\graph.json, graphify-out\\2026-10-12\\GRAPH_REPORT.md, graphify-out\\2026-10-12\\.graphify_analysis.json (+141 more)

### Community 102 - "Handler"
Cohesion: 0.33
Nodes (4): Handler, SimpleHTTPRequestHandler, Local intercepted admin UI, no external traffic or hosted writes., route()

### Community 103 - "Approved admin-only release: STOPPED before production writes"
Cohesion: 0.29
Nodes (6): Approved admin-only release: STOPPED before production writes, Blocking gate, Evidence notes, Preserved / not performed, Read-only findings, 2026-10-21, Remaining gates after backup

### Community 104 - "Preflight reset password database PocketWedding"
Cohesion: 0.33
Nodes (5): Belum diketahui / batasan, Bukti terverifikasi (read-only), Keputusan, Langkah manual pengguna berikutnya, Preflight reset password database PocketWedding

### Community 107 - "services/doku-sandbox/protocol.mjs"
Cohesion: 0.07
Nodes (36): assert, from(), q, fs, load(), Module, ts, config (+28 more)

### Community 108 - "admin-pricing-20261022-061447/services/doku-sandbox/protocol.mjs"
Cohesion: 0.17
Nodes (19): body, config, expectedOrder, metadata, config, meta, order, request() (+11 more)

### Community 109 - "DOKU sandbox groundwork — 22 October 2026"
Cohesion: 0.25
Nodes (7): DOKU sandbox groundwork — 22 October 2026, Evidence and commands, Final graph and diff verification, Implemented, not activated, Official sources checked in current documentation, Remaining gate, Required secure server boundary (not wired)

### Community 110 - "Admin modern UI — local only"
Cohesion: 0.33
Nodes (5): Admin modern UI — local only, Execution, Files, Final preview re-verification, Previous parent action required

### Community 111 - "Admin release gate check — local review"
Cohesion: 0.40
Nodes (4): Admin release gate check — local review, Decision, Newly checked, Prior evidence reviewed

### Community 112 - "202610220001_admin_package_pricing.sql"
Cohesion: 0.29
Nodes (8): package_invoice_immutable, package_version_immutable, public.admin_package_pricing(), public.package_invoice_snapshots, public.package_price_versions, public.audit_immutable, public.package_price_current, public.workspaces

### Community 113 - "WorkspaceProvider"
Cohesion: 0.16
Nodes (11): metadata, viewport, metadata, viewport, InstallPwaBanner(), Providers(), empty(), WorkspaceProvider() (+3 more)

### Community 114 - "Handler"
Cohesion: 0.33
Nodes (3): Handler, SimpleHTTPRequestHandler, Synthetic transport only, private ephemeral server, never parent preview.

### Community 115 - "Paket & Harga — local implementation (22 October 2026)"
Cohesion: 0.33
Nodes (5): Actual local evidence, Files, Limits and exact handoff, Outcome, Paket & Harga — local implementation (22 October 2026)

### Community 116 - "test-admin-pricing-client.cjs"
Cohesion: 0.33
Nodes (5): assert, fs, m, Module, ts

### Community 120 - "doku-sandbox/durable.sql"
Cohesion: 0.13
Nodes (18): audit_immutable, candidate_immutable, doku_sandbox.audit, doku_sandbox.candidates, doku_sandbox.inbox, doku_sandbox.invoices, doku_sandbox.reserve(), doku_sandbox.snapshot() (+10 more)

### Community 121 - "doku-durable-20261022-072040/protocol.mjs"
Cohesion: 0.47
Nodes (10): header(), inspectNotification(), orderSnapshot(), requireValue(), sandbox(), sendSandboxCheckout(), signRequest(), target() (+2 more)

### Community 122 - "Graph Report - wedding-planner  (2026-10-22)"
Cohesion: 0.18
Nodes (10): Community Hubs (Navigation), Corpus Check, God Nodes (most connected - your core abstractions), Graph Freshness, Graph Report - wedding-planner  (2026-10-22), Import Cycles, Knowledge Gaps, Suggested Questions (+2 more)

### Community 123 - "DOKU durable local transaction stage"
Cohesion: 0.29
Nodes (6): DOKU durable local transaction stage, Official documentation (read current browser DOM), Preservation, Real execution evidence, Unfinished release gates (fail closed), Working artifacts

### Community 124 - "test-doku-native.py"
Cohesion: 0.60
Nodes (4): event(), Disposable native PostgreSQL concurrency rehearsal. No hosted/env-file reads., run(), sql()

### Community 126 - "pricing-native-68193575e3/durable.sql"
Cohesion: 0.13
Nodes (18): audit_immutable, candidate_immutable, doku_sandbox.audit, doku_sandbox.candidates, doku_sandbox.inbox, doku_sandbox.invoices, doku_sandbox.reserve(), doku_sandbox.snapshot() (+10 more)

### Community 127 - "test-pricing-native-release.py"
Cohesion: 0.23
Nodes (7): actor(), cmd(), conn(), pg(), Native independent-connection pricing and actual Supabase runner rehearsal;…, save(), simultaneous()

### Community 128 - "test-branding.cjs"
Cohesion: 0.33
Nodes (6): assert, check(), fs, manifest, path, sw

### Community 130 - "202610220002_tier_pricing.sql"
Cohesion: 0.24
Nodes (10): public.admin_tier_catalog(), public.reserve_tier_invoice(), public.tier_invoice_snapshots, public.tier_price_current, public.tier_price_versions, public, public.audit_immutable, public.workspaces (+2 more)

### Community 131 - "test-tier-native.py"
Cohesion: 0.23
Nodes (7): actor(), cmd(), conn(), pg(), Native independent-connection pricing and actual Supabase runner rehearsal;…, save(), simultaneous()

### Community 132 - "Paket & Harga — native/local release rehearsal"
Cohesion: 0.25
Nodes (7): Canonical validation, Isolated release artifact, Native PostgreSQL and actual runner, Outcome, Paket & Harga — native/local release rehearsal, Production blockers / limits, Real bug discovered and fixed tests-first

### Community 133 - "Handler"
Cohesion: 0.33
Nodes (3): Handler, SimpleHTTPRequestHandler, Synthetic transport only, private ephemeral server, never parent preview.

### Community 134 - "test-tier-client.cjs"
Cohesion: 0.29
Nodes (6): assert, fs, good, m, Module, ts

## Knowledge Gaps
- **828 isolated node(s):** `extends`, `next/core-web-vitals`, `src\\app\\admin\\page.tsx`, `src\\components\\admin-shell.tsx`, `services\\doku-sandbox\\protocol.mjs` (+823 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1091 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Communities (120 total, 29 thin omitted)` connect `Communities (120 total, 29 thin omitted)` to `Graph Report - wedding-planner  (2026-10-22)`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `createClient()` connect `WorkspaceContext.tsx` to `WorkspaceProvider`, `tier-pricing.ts`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `uid()` connect `test-admin-native-readiness.py` to `Handler`, `test-auth-configured-browser.py`, `Handler`, `Handler`, `Handler`, `Handler`, `Handler`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `src\\app\\admin\\page.tsx` to the rest of the system?**
  _828 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0898989898989899 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `admin-pricing-20261022-061447/manifest.json` be split into smaller, more focused modules?**
  _Cohesion score 0.012195121951219513 - nodes in this community are weakly interconnected._