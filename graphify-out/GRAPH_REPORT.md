# Graph Report - wedding-planner  (2026-10-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 131 nodes · 183 edges · 12 communities (10 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e37542b3`
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

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `formatDateID()` - 7 edges
3. `useWorkspace()` - 7 edges
4. `react` - 7 edges
5. `public.workspaces` - 7 edges
6. `DashboardPage()` - 6 edges
7. `scripts` - 6 edges
8. `calculateDaysRemaining()` - 5 edges
9. `formatRupiah()` - 5 edges
10. `OnboardingPage()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `DashboardPage()` --calls--> `generateWhatsAppLink()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/whatsapp.ts
- `DashboardPage()` --calls--> `calculateDaysRemaining()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/utils.ts
- `OnboardingPage()` --calls--> `calculateDaysRemaining()`  [EXTRACTED]
  src/app/onboarding/page.tsx → src/lib/utils.ts
- `DashboardPage()` --calls--> `formatDateID()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/utils.ts
- `InviteLandingPage()` --calls--> `formatDateID()`  [EXTRACTED]
  src/app/invite/[token]/page.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (12 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.22
Nodes (13): clsx, lucide-react, react, tailwind-merge, DashboardPage(), InviteLandingPage(), OnboardingPage(), useWorkspace() (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (15): description, name, private, version, autoprefixer, postcss, react-dom, @supabase/ssr (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.16
Nodes (16): WorkspaceContext, WorkspaceContextType, DEFAULT_BUDGET_CATEGORIES, INITIAL_KUA_AND_TIMELINE_TASKS, BudgetItem, GuestCategory, GuestItem, Invitation (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.36
Nodes (9): auth.users, public.budgets, public.guests, public.invitations, public.is_workspace_member(), public.savings_accounts, public.tasks, public.workspace_members (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (9): dependencies, clsx, lucide-react, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (8): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, typescript

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (5): next, metadata, viewport, Providers(), WorkspaceProvider()

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (6): scripts, build, dev, graphify, lint, start

## Knowledge Gaps
- **72 isolated node(s):** `WhatsAppMessageParams`, `GuestCategory`, `Invitation`, `MemberRole`, `PaymentStatus` (+67 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 79 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Community 0` to `Community 8`, `Community 1`, `Community 2`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 5` to `Community 1`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 7` to `Community 1`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `WhatsAppMessageParams`, `GuestCategory`, `Invitation` to the rest of the system?**
  _72 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._