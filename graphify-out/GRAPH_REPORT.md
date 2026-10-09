# Graph Report - wedding-planner  (2026-10-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 137 nodes · 198 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f350c422`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `useWorkspace()` - 9 edges
3. `react` - 9 edges
4. `formatDateID()` - 7 edges
5. `lucide-react` - 7 edges
6. `public.workspaces` - 7 edges
7. `DashboardPage()` - 6 edges
8. `scripts` - 6 edges
9. `OnboardingPage()` - 5 edges
10. `calculateDaysRemaining()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `LoginPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/login/page.tsx → src/lib/supabase/client.ts
- `DashboardPage()` --calls--> `useWorkspace()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/context/WorkspaceContext.tsx
- `DashboardPage()` --calls--> `calculateDaysRemaining()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/utils.ts
- `DashboardPage()` --calls--> `formatDateID()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/utils.ts
- `DashboardPage()` --calls--> `formatRupiah()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (13 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.19
Nodes (14): clsx, @supabase/ssr, tailwind-merge, DashboardPage(), InviteLandingPage(), LoginPage(), OnboardingPage(), useWorkspace() (+6 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (16): WorkspaceContext, WorkspaceContextType, DEFAULT_BUDGET_CATEGORIES, INITIAL_KUA_AND_TIMELINE_TASKS, BudgetItem, GuestCategory, GuestItem, Invitation (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (14): description, name, private, version, autoprefixer, postcss, react-dom, @supabase/supabase-js (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.19
Nodes (8): lucide-react, next, react, metadata, viewport, InstallPwaBanner(), Providers(), WorkspaceProvider()

### Community 5 - "Community 5"
Cohesion: 0.36
Nodes (9): auth.users, public.budgets, public.guests, public.invitations, public.is_workspace_member(), public.savings_accounts, public.tasks, public.workspace_members (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (9): dependencies, clsx, lucide-react, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 8 - "Community 8"
Cohesion: 0.25
Nodes (8): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, typescript

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (6): scripts, build, dev, graphify, lint, start

## Knowledge Gaps
- **73 isolated node(s):** `WhatsAppMessageParams`, `WorkspaceContextType`, `GuestCategory`, `Invitation`, `MemberRole` (+68 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 80 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 4` to `Community 0`, `Community 1`, `Community 3`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 6` to `Community 3`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 8` to `Community 3`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **What connects `WhatsAppMessageParams`, `WorkspaceContextType`, `GuestCategory` to the rest of the system?**
  _73 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._