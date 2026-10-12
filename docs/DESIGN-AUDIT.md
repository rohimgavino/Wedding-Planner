# EverRae — implementation audit

## Isolation and baseline
- New project: `D:/everrae`, copied from `D:/wedding-planner` after confirming destination did not exist.
- Excluded .git, node_modules, .next, out, .wrangler, graphify-out, all .env files, and build caches. No original credentials copied. Independent git initialized, no commit/push/deployment.
- Original source was clean and no implementation was written there. Its preexisting dirty Graphify files were left untouched; restoration was unnecessary.
- Next.js 14.2.35 App Router, React 18, TypeScript, Tailwind 3, Lucide, Supabase dependencies. Static export retained.
- Existing local WorkspaceContext and dashboard CRUD retained. Cloud sync is not implemented. A separate `everrae_workspace_v1` storage key prevents cross-project storage reuse.

## Composition
Primary surface: Decide/Learn. Reference: cinematic photo hero with copy left; ivory stationery overview; forest-green app showcase; wedding-photo/how-to; separate demo dashboard. Reference is not used as a flattened page image.
Exact tokens: ivory #F8F5EF, cream #EFE8DC, forest #233D32, gold #C6AA78, charcoal #282923. Georgia serif and Arial sans are deliberately local, avoid external font requests. Thin borders, small corner radii, restrained shadows.
Hero real Lake Crescent photo is a licensed alternative, not the exact reference photo. Couple crop and dark overlay were reviewed and adjusted after desktop screenshot inspection. Mobile stacks sections and offers an interactive menu.
Slop audit: 0/10 major diagnostic tells. No neon/tech gradient, icon-topper cards, fake stats, glass blur, or fabricated endorsements. Feature row is reference-directed, lightweight, and not equal boxed cards.

## Active versus planned
- Active local: existing checklist, budget, savings, guests/manual RSVP, onboarding.
- Demo: shared PlannerPreview on landing and /demo; tabs and checkboxes run in React memory, not personal storage.
- Planned: vendor CRUD, public digital invitations, cloud collaboration, production authentication, paid subscriptions.
- Pricing configuration: Starter 99k, Premium 199k, Wedding Pro 399k per month, prominently demo/not sold. No checkout.
- No invented testimonials or verified statistics. Legal/contact page explicitly states company/contact details are not established.

## Scope limitations
Landing and demo implemented first. Existing full dashboard/login/onboarding visual styles largely remain baseline, with EverRae wording and honest local-mode copy; broad dashboard redesign is deferred. No production backend claim. Brand fonts and wedding photography differ from exact reference. Icons inherited on the PWA/auth surfaces still require a full brand pass. Current dependency baseline requires a separate security/upgrade audit before release.

## Accessibility and verification
44px primary controls, focus indicators, semantic headings, native FAQ details, descriptive image alt, reduced-motion handling, user zoom enabled. Real Chrome checks cover 360/390/430/768/1440 viewport behavior, routes, image loads, anchors, mobile menu, FAQ, demo tabs/checklist, storage isolation and page errors. See TEST-RESULTS.json. No production deployment.
