# Mobile CSS loss after rebuild

## Cause and proof
The legacy `wedding-planner-v1` worker precached `/` and returned cache-first HTML indefinitely. A rebuild can remove the CSS hash referenced by that HTML. Fresh visitors receive current HTML and CSS; returning clients can receive old HTML with a 404 stylesheet, producing default serif/raw document layout.

`python scripts/test-service-worker.py` uses real Chrome, the exact legacy worker fixture, and cached homepage HTML whose CSS URL is changed to a nonexistent deleted-build hash. It reproduced CSS 404 and computed `Times New Roman`. Before the fix, updating the worker left the same stale serif page (RED). After the fix, the same browser updates to the actual served worker, reloads with `Arial, Helvetica, sans-serif`, removes the legacy cache, and preserves an unrelated cache (GREEN). This is a deterministic causal reproduction, not retrieval of the particular phone's original deleted hash.

## Fix
`public/sw.js` uses `everrae-public-v2`, network-first navigation with HTTP-cache bypass, and refreshes only successful public homepage HTML. Public static assets are cached for offline styling. Cross-origin, non-GET, API, user data, and token/query requests are not cached. Only known legacy/app caches are removed. Offline home uses its genuine cached response; uncached navigation returns a safe 503. PWA registration and install behavior remain enabled. Existing registration uses `/sw.js`; `skipWaiting` and `clients.claim` activate upgrades. An already-rendered stale page needs a subsequent navigation/reload after worker activation; no forced reload risks unsaved dashboard input.

## Verification
- `npm run lint`: no warnings/errors.
- `npm run build`: successful static export (10 pages); updated worker copied to `out/sw.js`.
- `npx tsc --noEmit`: passed.
- `graphify update .`: updated graph/report; community-label refresh advisory (27 communities, 24 previous labels).
- Service-worker browser regression: legacy failure reproduced, upgrade recovery, same-version stale-cache replacement, offline styled home, uncached offline 503, unrelated-cache preservation.
- Preview browser suite: seven routes HTTP 200; images loaded; responsive checks at 360/390/430/768/1440; CSS font/background assertions; menu/demo interactions and reduced-motion checks.
- Dashboard browser suite: fresh empty workspace, CRUD, RSVP/task updates, reload persistence, validation, dialogs, CSV, reset, responsive views, zero runtime errors.
- Public temporary preview GET and stylesheet GETs return 200; mobile scoped font is Arial and both images load.

Screenshots in `C:/Users/PC/AppData/Local/hermes/cache/scratch/`:
- `everrae-sw-stale-mobile.png`
- `everrae-sw-recovered-mobile.png`
- `everrae-public-mobile-css-fixed.png`

No old project deployment or permanent production deployment performed; only D:/everrae and the existing temporary preview were used.
