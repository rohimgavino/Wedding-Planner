# Graph Report - wedding-planner  (2026-10-10)

## Corpus Check
- 26 files · ~11,609 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .css 2, (none) 1, .ico 1)

## Summary
- 163 nodes · 229 edges · 15 communities (12 shown, 3 thin omitted)
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
- devDependencies
- Panduan AI Agent — Wedding Planner PWA
- Wedding Planner & Collaborative Workspace PWA
- next.config.mjs
- postcss.config.mjs
- sw.js
- Meet to Marry — UI direction

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `react` - 9 edges
3. `useWorkspace()` - 9 edges
4. `lucide-react` - 7 edges
5. `formatRupiah()` - 7 edges
6. `formatDateID()` - 7 edges
7. `public.workspaces` - 7 edges
8. `scripts` - 6 edges
9. `DashboardPage()` - 6 edges
10. `Meet to Marry — UI direction` - 6 edges

## Surprising Connections (you probably didn't know these)
- `DashboardPage()` --calls--> `useWorkspace()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/context/WorkspaceContext.tsx
- `DashboardPage()` --calls--> `calculateDaysRemaining()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/utils.ts
- `DashboardPage()` --calls--> `formatDateID()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/utils.ts
- `DashboardPage()` --calls--> `formatRupiah()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/utils.ts
- `DashboardPage()` --calls--> `generateWhatsAppLink()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/whatsapp.ts

## Import Cycles
- None detected.

## Communities (15 total, 3 thin omitted)

### Community 0 - "WorkspaceContext.tsx"
Cohesion: 0.19
Nodes (16): WorkspaceContext, WorkspaceContextType, DEFAULT_BUDGET_CATEGORIES, INITIAL_KUA_AND_TIMELINE_TASKS, BudgetItem, GuestCategory, GuestItem, Invitation (+8 more)

### Community 1 - "package.json"
Cohesion: 0.09
Nodes (20): description, name, private, scripts, build, dev, graphify, lint (+12 more)

### Community 2 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 3 - "dashboard/page.tsx"
Cohesion: 0.14
Nodes (18): clsx, lucide-react, @supabase/ssr, tailwind-merge, DashboardPage(), InviteContent(), LoginPage(), OnboardingPage() (+10 more)

### Community 4 - "react"
Cohesion: 0.24
Nodes (7): next, react, metadata, viewport, InstallPwaBanner(), Providers(), WorkspaceProvider()

### Community 5 - "schema.sql"
Cohesion: 0.36
Nodes (9): auth.users, public.budgets, public.guests, public.invitations, public.is_workspace_member(), public.savings_accounts, public.tasks, public.workspace_members (+1 more)

### Community 6 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, clsx, lucide-react, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+1 more)

### Community 7 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 8 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, typescript

### Community 9 - "Panduan AI Agent — Wedding Planner PWA"
Cohesion: 0.29
Nodes (6): 1. Prinsip Utama Proyek, 2. Standar Workflow Graphify (Wajib di Setiap Project), 3. Aturan Coding & Arsitektur, Panduan AI Agent — Wedding Planner PWA, Saat Sesi Baru Dimulai:, Setelah Mengubah Kode / Menambah Fitur:

### Community 10 - "Wedding Planner & Collaborative Workspace PWA"
Cohesion: 0.40
Nodes (4): Dokumentasi Proyek, Fitur Tahap 1 (MVP), Menjalankan Secara Lokal, Wedding Planner & Collaborative Workspace PWA

### Community 14 - "Meet to Marry — UI direction"
Cohesion: 0.29
Nodes (6): Composition, Interaction and honesty, Meet to Marry — UI direction, Self-audit, Verification, Visual language

## Knowledge Gaps
- **86 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `description` (+81 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 97 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `WorkspaceContext.tsx`, `package.json`, `dashboard/page.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `dashboard/page.tsx` to `package.json`, `react`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _86 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `dashboard/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13793103448275862 - nodes in this community are weakly interconnected._