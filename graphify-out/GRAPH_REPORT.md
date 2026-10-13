# Graph Report - wedding-planner  (2026-10-13)

## Corpus Check
- 79 files · ~61,180 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 31 file(s) not represented in the graph (top: .log 15, (none) 9, .css 4)

## Summary
- 366 nodes · 556 edges · 36 communities (21 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `baf1d4cd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- WorkspaceContext.tsx
- package.json
- compilerOptions
- dashboard/page.tsx
- react
- dependencies
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
- BACKEND-NEXT-STAGE.md
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

## God Nodes (most connected - your core abstractions)
1. `react` - 16 edges
2. `compilerOptions` - 16 edges
3. `WorkspaceProvider()` - 13 edges
4. `CloudWorkspace` - 13 edges
5. `lucide-react` - 12 edges
6. `useAuth()` - 11 edges
7. `createClient()` - 10 edges
8. `GuestItem` - 10 edges
9. `useWorkspace()` - 9 edges
10. `checked()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `DashboardPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/context/auth-context.tsx
- `InviteContent()` --calls--> `useWorkspace()`  [EXTRACTED]
  src/app/invite/page.tsx → src/context/WorkspaceContext.tsx
- `WorkspaceProvider()` --calls--> `useAuth()`  [EXTRACTED]
  src/context/WorkspaceContext.tsx → src/context/auth-context.tsx
- `WorkspaceProvider()` --calls--> `createClient()`  [EXTRACTED]
  src/context/WorkspaceContext.tsx → src/lib/supabase/client.ts
- `CallbackPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/auth/callback/page.tsx → src/context/auth-context.tsx

## Import Cycles
- None detected.

## Communities (36 total, 12 thin omitted)

### Community 0 - "WorkspaceContext.tsx"
Cohesion: 0.12
Nodes (32): NewGuest, WorkspaceContext, WorkspaceContextType, CloudSnapshot, fields, Table, WorkspaceParams, DEFAULT_BUDGET_CATEGORIES (+24 more)

### Community 1 - "package.json"
Cohesion: 0.04
Nodes (42): description, devDependencies, autoprefixer, @electric-sql/pglite, eslint, eslint-config-next, postcss, tailwindcss (+34 more)

### Community 2 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 3 - "dashboard/page.tsx"
Cohesion: 0.16
Nodes (19): lucide-react, DashboardPage(), InviteContent(), OnboardingPage(), GuestCSVImport(), PlannerDialog(), useWorkspace(), GUEST_CATEGORIES (+11 more)

### Community 4 - "react"
Cohesion: 0.13
Nodes (19): next, react, @supabase/supabase-js, CallbackPage(), metadata, viewport, LoginPage(), AuthGate() (+11 more)

### Community 6 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, clsx, lucide-react, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+1 more)

### Community 7 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 8 - "app/page.tsx"
Cohesion: 0.12
Nodes (16): Features, Showcase(), Hero(), FAQ(), faqs, Footer(), HowItWorks(), Pricing() (+8 more)

### Community 9 - "Panduan AI Agent — Wedding Planner PWA"
Cohesion: 0.29
Nodes (6): 1. Prinsip Utama Proyek, 2. Standar Workflow Graphify (Wajib di Setiap Project), 3. Aturan Coding & Arsitektur, Panduan AI Agent — Wedding Planner PWA, Saat Sesi Baru Dimulai:, Setelah Mengubah Kode / Menambah Fitur:

### Community 10 - "Wedding Planner & Collaborative Workspace PWA"
Cohesion: 0.25
Nodes (7): Dokumentasi Proyek, EverRae — canonical Wedding Planner, Fitur Tahap 1 (MVP), Historical baseline documentation (not proof of active cloud features), Menjalankan Secara Lokal, Run and verify, Wedding Planner & Collaborative Workspace PWA

### Community 14 - "test-guest-csv.cjs"
Cohesion: 0.08
Nodes (23): typescript, assert, from(), q, fs, load(), Module, ts (+15 more)

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

### Community 30 - "WorkspaceProvider"
Cohesion: 0.40
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

## Knowledge Gaps
- **148 isolated node(s):** `extends`, `next/core-web-vitals`, `nextConfig`, `name`, `version` (+143 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 203 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `app/page.tsx`, `package.json`, `dashboard/page.tsx`, `WorkspaceContext.tsx`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `typescript` connect `test-guest-csv.cjs` to `package.json`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `dashboard/page.tsx` to `app/page.tsx`, `package.json`, `react`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `WorkspaceProvider()` (e.g. with `empty()` and `.accept()`) actually correct?**
  _`WorkspaceProvider()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `extends`, `next/core-web-vitals`, `nextConfig` to the rest of the system?**
  _148 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WorkspaceContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11711711711711711 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._