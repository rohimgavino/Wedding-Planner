# Graph Report - wedding-planner  (2026-10-12)

## Corpus Check
- 56 files · ~49,490 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .css 4, .example 1, (none) 1)

## Summary
- 273 nodes · 386 edges · 30 communities (17 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9b0a77a1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- WorkspaceContext.tsx
- package.json
- compilerOptions
- dashboard/page.tsx
- react
- schema.sql
- dependencies
- manifest.json
- app/page.tsx
- Panduan AI Agent — Wedding Planner PWA
- Wedding Planner & Collaborative Workspace PWA
- next.config.mjs
- postcss.config.mjs
- sw.js
- test-guest-csv.cjs
- guest-csv-import.tsx
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

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `react` - 13 edges
3. `lucide-react` - 12 edges
4. `useWorkspace()` - 11 edges
5. `GuestItem` - 8 edges
6. `DashboardPage()` - 7 edges
7. `formatDateID()` - 7 edges
8. `BudgetItem` - 7 edges
9. `TaskItem` - 7 edges
10. `public.workspaces` - 7 edges

## Surprising Connections (you probably didn't know these)
- `GuestCSVImport()` --calls--> `useWorkspace()`  [EXTRACTED]
  src/components/everrae/guest-csv-import.tsx → src/context/WorkspaceContext.tsx
- `DashboardPage()` --calls--> `useWorkspace()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/context/WorkspaceContext.tsx
- `DashboardPage()` --calls--> `serializeGuestCSV()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/guest-csv.ts
- `DashboardPage()` --calls--> `calculateDaysRemaining()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/utils.ts
- `DashboardPage()` --calls--> `formatDateID()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (30 total, 11 thin omitted)

### Community 0 - "WorkspaceContext.tsx"
Cohesion: 0.13
Nodes (28): WorkspaceContext, WorkspaceContextType, WorkspaceProvider(), DEFAULT_BUDGET_CATEGORIES, INITIAL_KUA_AND_TIMELINE_TASKS, empty(), LEGACY_KEY, loadWorkspace() (+20 more)

### Community 1 - "package.json"
Cohesion: 0.06
Nodes (31): description, devDependencies, autoprefixer, eslint, eslint-config-next, postcss, tailwindcss, @types/node (+23 more)

### Community 2 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 3 - "dashboard/page.tsx"
Cohesion: 0.16
Nodes (16): clsx, @supabase/ssr, tailwind-merge, DashboardPage(), InviteContent(), LoginPage(), OnboardingPage(), PlannerDialog() (+8 more)

### Community 4 - "react"
Cohesion: 0.27
Nodes (6): next, react, metadata, viewport, InstallPwaBanner(), Providers()

### Community 5 - "schema.sql"
Cohesion: 0.36
Nodes (9): auth.users, public.budgets, public.guests, public.invitations, public.is_workspace_member(), public.savings_accounts, public.tasks, public.workspace_members (+1 more)

### Community 6 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, clsx, lucide-react, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+1 more)

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
Cohesion: 0.11
Nodes (16): typescript, assert, fs, guest, mod, Module, source, template (+8 more)

### Community 15 - "guest-csv-import.tsx"
Cohesion: 0.42
Nodes (7): GuestCSVImport(), GUEST_CATEGORIES, GUEST_CSV_HEADERS, GUEST_RSVP, GuestCSVRow, guestDuplicateError(), parseGuestCSV()

### Community 16 - "EverRae — implementation audit"
Cohesion: 0.29
Nodes (6): Accessibility and verification, Active versus planned, Composition, EverRae — implementation audit, Isolation and baseline, Scope limitations

### Community 17 - "EverRae visual preferences"
Cohesion: 0.33
Nodes (5): Asset review checklist, Current imagery, EverRae visual preferences, Implementation choice, Scope

### Community 18 - "Handler"
Cohesion: 0.47
Nodes (3): Handler, Local static-export preview with clean route rewrites, no deployment., SimpleHTTPRequestHandler

### Community 19 - "Mobile CSS loss after rebuild"
Cohesion: 0.40
Nodes (4): Cause and proof, Fix, Mobile CSS loss after rebuild, Verification

## Knowledge Gaps
- **122 isolated node(s):** `extends`, `next/core-web-vitals`, `nextConfig`, `name`, `version` (+117 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 153 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `WorkspaceContext.tsx`, `package.json`, `dashboard/page.tsx`, `app/page.tsx`, `guest-csv-import.tsx`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `app/page.tsx` to `package.json`, `dashboard/page.tsx`, `react`, `guest-csv-import.tsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `typescript` connect `test-guest-csv.cjs` to `package.json`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `nextConfig` to the rest of the system?**
  _122 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `WorkspaceContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12903225806451613 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._