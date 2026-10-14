# Savings / examples / owner reset — 14 Oktober 2026

## Scope dan preservasi
Isolated latest-main worktree `C:/Users/PC/AppData/Local/hermes/cache/scratch/wedding-savings-release`, baseline `3569f1d912941abb4f4b0fdfaff1c64c3fbb0b91`. Canonical `D:/wedding-planner` dan `D:/everrae` tidak ditulis. Tidak provisioning, grants, customer reset, transaksi pembelian, paywall, paid enforcement, Lynk/settings changes. Admin002/004 dan mobile CSS released tetap byte-identical ke baseline.

Shared savings CRUD, total/per-kontributor/progres/sisa target; ledger tidak menggabungkan saldo legacy savings_accounts. Atribusi catatan bersama bukan bukti transfer/custody. Contoh fiktif read-only setelah auth, tidak mengisi form atau seed cloud. Owner reset exact `RESET RENCANA`, empat tabel saja (budgets/tasks/guests/savings_contributions), audit atomic. Identitas/targets/memberships/invites/commerce/legacy tetap. Client committed reset mengosongkan snapshot sebelum refresh; network failure tidak diklaim sukses.

## Gates yang benar-benar dieksekusi
- RED sebelum port: missing savings module; reset test belum punya migration/activation di baseline. Contract reset diperbarui ke005, tanpa membawa enforcement production.
- PGlite baseline20 + reset5 + admin10 + developer7 PASS. Admin/developer activation hanya disposable local tests, bukan hosted. Staged ledger suite PASS shared CRUD/invalid amount/foreign attribution/tenant immutable/outsider/anon; dua workspace preexisting unentitled tetap membaca/menulis sesudah005.
- Savings helper/cloud/commerce/CSV/storage PASS; lint max-warnings0 dan TypeScript PASS.
- Browser intercepted service_workers=block PASS widths360/390/430/1280: CRUD/progres50→70→30/reload/attribution/delete cancel-confirm/read-only examples/no writes/no paid guard/reset network failure/committed refresh failure/partner denied. Guidance suite PASS exact confirmation, cancel/Escape,403,success,owner-only. Auth-configured PASS signed-out/PKCE/invite/logout/legacy. Admin-expand PASS denial/operator/developer/disabled sales/mobile.
- Native PG17.11 independent sessions: seven concurrency cases PASS. Authorization rechecked after workspace wait; owner membership held through commit; concurrent update/delete handled; FK-blocked insert can commit after reset. Contract READ COMMITTED statement snapshots, atomic transaction, NOT permanent emptiness/global write freeze. Partner writes after reset may reappear; UI warns explicitly.
- Fresh hosted public/auth/history encrypted DPAPI backup, decrypt-and-native-restore PASS exact counts:2 workspaces/2 memberships/3 Auth users/2 admins/2 audit; planning tables empty. Roles exported not replayed; not whole-platform disaster recovery.
- Actual Supabase db push runner injected late005 failure PASS: RPC/EXECUTE/history005 rollback; reviewed retry has one005 row. First connection attempt without password rejected; random disposable local credential retry passed, not stored/logged.
- Fixture build and real-public-config build PASS Next15.5.27,12 pages. Production dependency audit0 vulnerabilities; full npm ci audit reports7 high dev dependencies; no breaking dependency upgrade performed.
- Real SW cache upgrade PASS Times→Arial, stale current cache ignored, offline home styled, uncached503, unrelated cache preserved; CSS200. Sensitive navigation remains network-only.
- Graphify AST update516 nodes/795 edges/53 communities; unsupported25 files, semantic docs not refreshed; graph evidence deliberately unstaged.

## Hosted migration
Verified project `lkudkvjaxdjntjosudni`, remote history001/002/004 plus foundation, reset003 absent. Dry-run only `202610140005_reset_planning_content.sql`; applied only005 after gates. Readback005 present, SECURITY DEFINER empty search_path; authenticated EXECUTE true/anon false; SQL owner authorization inside RPC. Workspaces2/memberships2 unchanged; sales_enabled=false, private sales_activation=false, restrictive policies0. No real reset called.

## Release tracking
Feature commit and Cloudflare active version recorded below after execution. Target Worker `everrae`, account `4c9d871a80b70e0c2275773bcd51db84`, `https://pocketwedding.id`. Explicit file allowlist; no secrets/env/evidence/graph dumps/activation migrations staged. Nonforce HEAD:main only baseline match.

## Evidence and limitations
`C:/Users/PC/AppData/Local/hermes/backups/everrae-savings-20261014/manifest.json` encrypted durable backup; isolated `savings-native-results.json`, `savings-runner-results.json`; scratch `savings-native.py`, `savings-backup-runner.py`, `savings-runner-retry.py`. Browser fixtures are NOT hosted two-account/cross-device persistence or Google login evidence. Native and PGlite verify SQL authorization without customer mutations. No exhaustive platform disaster-recovery claim. Ledger aggregate uses JS number; individual SQL amounts safe integer, aggregate beyond Number.MAX_SAFE_INTEGER is not guaranteed exact.
