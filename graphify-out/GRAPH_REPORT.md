# Graph Report - wedding-planner  (2026-10-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 115 nodes · 116 edges · 14 communities (9 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `759d308a`
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
- Community 13

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `public.workspaces` - 7 edges
3. `scripts` - 6 edges
4. `public.workspace_members` - 4 edges
5. `lucide-react` - 2 edges
6. `react` - 2 edges
7. `@supabase/ssr` - 2 edges
8. `tailwindcss` - 2 edges
9. `public.budgets` - 2 edges
10. `public.guests` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (14 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (15): description, name, private, version, autoprefixer, lucide-react, postcss, react (+7 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (17): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (12): BudgetItem, GuestCategory, GuestItem, Invitation, MemberRole, PaymentStatus, RSVPStatus, TaskItem (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.36
Nodes (9): auth.users, public.budgets, public.guests, public.invitations, public.is_workspace_member(), public.savings_accounts, public.tasks, public.workspace_members (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (9): dependencies, clsx, lucide-react, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (8): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, typescript

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (6): scripts, build, dev, graphify, lint, start

### Community 9 - "Community 9"
Cohesion: 0.40
Nodes (3): next, metadata, viewport

## Knowledge Gaps
- **74 isolated node(s):** `WhatsAppMessageParams`, `BudgetItem`, `GuestCategory`, `GuestItem`, `Invitation` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 85 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 6` to `Community 0`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `scripts` connect `Community 8` to `Community 0`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `WhatsAppMessageParams`, `BudgetItem`, `GuestCategory` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._