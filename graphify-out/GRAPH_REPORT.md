# Graph Report - wedding-planner  (2026-10-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 41 nodes · 40 edges · 4 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3

## God Nodes (most connected - your core abstractions)
1. `scripts` - 6 edges
2. `private` - 1 edges
3. `clsx` - 1 edges
4. `lucide-react` - 1 edges
5. `next` - 1 edges
6. `postcss` - 1 edges
7. `react` - 1 edges
8. `react-dom` - 1 edges
9. `@supabase/ssr` - 1 edges
10. `@supabase/supabase-js` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (4 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (18): description, name, private, version, clsx, lucide-react, next, postcss (+10 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (9): dependencies, clsx, lucide-react, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.29
Nodes (7): devDependencies, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, typescript

### Community 3 - "Community 3"
Cohesion: 0.33
Nodes (6): scripts, build, dev, graphify, lint, start

## Knowledge Gaps
- **37 isolated node(s):** `description`, `name`, `private`, `version`, `clsx` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 37 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.364) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.281) - this node is a cross-community bridge._
- **Why does `scripts` connect `Community 3` to `Community 0`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **What connects `description`, `name`, `private` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._