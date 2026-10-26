# Graph Report - wedding-planner  (2026-10-14)

## Corpus Check
- 113 files · ~77,738 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 33 file(s) not represented in the graph (top: .log 15, (none) 9, .css 4)

## Summary
- 602 nodes · 900 edges · 60 communities (41 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a26c6159`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- WorkspaceContext.tsx
- package.json
- compilerOptions
- dashboard/page.tsx
- Commerce
- test-planning-reset.mjs
- manifest.json
- app/page.tsx
- Panduan AI Agent — Wedding Planner PWA
- Wedding Planner & Collaborative Workspace PWA
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
- WorkspaceProvider
- 202610120001_secure_foundation.sql
- Backend foundation — local SQL verification, not a release
- test-auth-configured-browser.py
- Handler
- Integrasi auth dan workspace cloud — lokal, belum rilis
- 202610140001_workspace_entitlements_savings.sql
- Admin minimal — hasil lokal, belum rilis
- Hasil tahap pertama berbayar — lokal, belum rilis
- 202610140002_admin_manual_purchases.sql
- Admin-first expand — hasil lokal 14 Oktober 2026
- test-workspace-storage.cjs
- Handler
- Handler
- public.reset_planning_content
- 202610140004_developer_operator_roles.sql
- Providers.tsx
- typescript
- Pemisahan developer / operator — lokal, belum rilis
- test-commerce.cjs
- test-developer-ui.cjs
- Handler
- Empty authenticated workspace UI fix
- test-savings.cjs
- .then
- Staged rollout paid / admin / reset
- Handler
- prepare-admin-release.py

## God Nodes (most connected - your core abstractions)
1. `react` - 20 edges
2. `Commerce` - 19 edges
3. `AdminPanel()` - 17 edges
4. `useWorkspace()` - 17 edges
5. `compilerOptions` - 16 edges
6. `useAuth()` - 15 edges
7. `WorkspaceProvider()` - 14 edges
8. `CloudWorkspace` - 14 edges
9. `checked()` - 14 edges
10. `createClient()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `AdminPanel()` --calls--> `useWorkspace()`  [EXTRACTED]
  src/app/admin/page.tsx → src/context/WorkspaceContext.tsx
- `AdminPanel()` --calls--> `formatRupiah()`  [EXTRACTED]
  src/app/admin/page.tsx → src/lib/utils.ts
- `DashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/context/auth-context.tsx
- `InviteContent()` --calls--> `useWorkspace()`  [EXTRACTED]
  src/app/invite/page.tsx → src/context/WorkspaceContext.tsx
- `PurchasePanel()` --calls--> `useWorkspace()`  [EXTRACTED]
  src/app/purchase/page.tsx → src/context/WorkspaceContext.tsx

## Import Cycles
- None detected.

## Communities (60 total, 14 thin omitted)

### Community 0 - "WorkspaceContext.tsx"
Cohesion: 0.12
Nodes (34): NewGuest, WorkspaceContext, WorkspaceContextType, CloudSnapshot, fields, Table, WorkspaceParams, DEFAULT_BUDGET_CATEGORIES (+26 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (46): dependencies, clsx, lucide-react, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+38 more)

### Community 2 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 3 - "dashboard/page.tsx"
Cohesion: 0.13
Nodes (26): clsx, react, tailwind-merge, DashboardPage(), InviteContent(), OnboardingPage(), FillingExample(), GuestCSVImport() (+18 more)

### Community 4 - "Commerce"
Cohesion: 0.10
Nodes (23): @supabase/supabase-js, AdminPanel(), CallbackPage(), LoginPage(), PurchasePanel(), AuthGate(), AuthContext, AuthProvider() (+15 more)

### Community 6 - "test-planning-reset.mjs"
Cohesion: 0.06
Nodes (12): @electric-sql/pglite, db, spaces, db, db, tables, db, user() (+4 more)

### Community 7 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 8 - "app/page.tsx"
Cohesion: 0.13
Nodes (17): lucide-react, Features, Showcase(), Hero(), FAQ(), faqs, Footer(), HowItWorks() (+9 more)

### Community 9 - "Panduan AI Agent — Wedding Planner PWA"
Cohesion: 0.29
Nodes (6): 1. Prinsip Utama Proyek, 2. Standar Workflow Graphify (Wajib di Setiap Project), 3. Aturan Coding & Arsitektur, Panduan AI Agent — Wedding Planner PWA, Saat Sesi Baru Dimulai:, Setelah Mengubah Kode / Menambah Fitur:

### Community 10 - "Wedding Planner & Collaborative Workspace PWA"
Cohesion: 0.25
Nodes (7): Dokumentasi Proyek, EverRae — canonical Wedding Planner, Fitur Tahap 1 (MVP), Historical baseline documentation (not proof of active cloud features), Menjalankan Secara Lokal, Run and verify, Wedding Planner & Collaborative Workspace PWA

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

### Community 30 - "WorkspaceProvider"
Cohesion: 0.38
Nodes (5): empty(), WorkspaceProvider(), checked(), clean(), CloudWorkspace

### Community 32 - "Backend foundation — local SQL verification, not a release"
Cohesion: 0.33
Nodes (5): Actual TDD and verification, Backend foundation — local SQL verification, not a release, Remaining blockers / explicit limits, Scope and artifacts, Security and RPC contracts

### Community 33 - "test-auth-configured-browser.py"
Cohesion: 0.29
Nodes (3): Handler, SimpleHTTPRequestHandler, Local-only auth transport fixture; NOT real Google/Supabase evidence. Run…

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
Nodes (10): auth, public.audit_immutable, audit_no_change, one_pending_core_purchase, public.purchase_requests, public.verified_transactions, auth.users, public (+2 more)

### Community 40 - "Admin-first expand — hasil lokal 14 Oktober 2026"
Cohesion: 0.20
Nodes (9): Admin-first expand — hasil lokal 14 Oktober 2026, Approval berikutnya, Commands migration — PROPOSAL ONLY, belum dijalankan, Eksekusi nyata, Identitas dan inventory trusted, Implementasi expand-contract, Native/backup gate belum terpenuhi, Paket review terisolasi (+1 more)

### Community 41 - "test-workspace-storage.cjs"
Cohesion: 0.22
Nodes (7): assert, fs, m, Module, s, ts, valid

### Community 42 - "Handler"
Cohesion: 0.33
Nodes (3): Handler, SimpleHTTPRequestHandler, Local transport fixture; every Supabase request intercepted, no hosted writes.

### Community 43 - "Handler"
Cohesion: 0.33
Nodes (3): Handler, SimpleHTTPRequestHandler, Transport fixture only; no hosted auth/payment/database operations.

### Community 45 - "202610140004_developer_operator_roles.sql"
Cohesion: 0.15
Nodes (11): public.protect_last_developer, public.workspace_entitlements, last_developer, public.developer_test_grants, public.grant_developer_test_access(), public.has_developer_test_access(), public.has_workspace_entitlement(), public.set_site_admin() (+3 more)

### Community 46 - "Providers.tsx"
Cohesion: 0.28
Nodes (5): next, metadata, viewport, InstallPwaBanner(), Providers()

### Community 47 - "typescript"
Cohesion: 0.33
Nodes (6): typescript, assert, fs, load(), Module, ts

### Community 48 - "Pemisahan developer / operator — lokal, belum rilis"
Cohesion: 0.29
Nodes (6): Bukti eksekusi, Checklist rollout — preserve akses live dahulu, File, Pemisahan developer / operator — lokal, belum rilis, Provisioning awal — jangan jalankan sekarang, Siap lokal

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

### Community 59 - "Staged rollout paid / admin / reset"
Cohesion: 0.15
Nodes (12): Bukti baru yang diverifikasi, Desain eksplisit grandfather (usulan, BELUM SQL diimplementasikan), Preservasi Git dan baseline, Runner / rehearsal / bootstrap, Staged rollout paid / admin / reset, Tahap 1 — database safety, legacy strategy, admin bootstrap (prepare dahulu), Tahap 2 — admin release; sales tetap disabled, Tahap 3 — paid enforcement terkontrol (+4 more)

### Community 60 - "Handler"
Cohesion: 0.33
Nodes (3): Handler, SimpleHTTPRequestHandler, Admin-only isolated build, intercepted transport, never hosted writes.

## Knowledge Gaps
- **224 isolated node(s):** `extends`, `next/core-web-vitals`, `nextConfig`, `name`, `version` (+219 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 340 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `dashboard/page.tsx` to `WorkspaceContext.tsx`, `package.json`, `Commerce`, `app/page.tsx`, `Providers.tsx`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `typescript` connect `typescript` to `package.json`, `test-workspace-storage.cjs`, `test-guest-csv.cjs`, `test-commerce.cjs`, `test-developer-ui.cjs`, `test-savings.cjs`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `@electric-sql/pglite` connect `test-planning-reset.mjs` to `package.json`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `AdminPanel()` (e.g. with `.admins()` and `.audit()`) actually correct?**
  _`AdminPanel()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `extends`, `next/core-web-vitals`, `nextConfig` to the rest of the system?**
  _224 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WorkspaceContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11605937921727395 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._