# Admin-first expand — hasil lokal 14 Oktober 2026

**NO-GO hosted apply/provision/push/deploy sampai review.** Tidak ada hosted business write, penghapusan tambahan atau provisioning. `db query --linked --project-ref lkudkvjaxdjntjosudni` memakai `BEGIN READ ONLY` (CLI internal `Initialising login role`). Percobaan awal flag `--sql` ditolak; query berikutnya salah kolom `owner_id` ditolak; query final satu JSON berhasil. Tidak membaca credential values / `.env.local`.

## Identitas dan inventory trusted

- Developer: `ahmadnurrochim11@gmail.com` → Auth `7b94a773-bf81-4f65-a243-a1f0e8992f23`, email confirmed, owner workspace `0aea37af-aa4d-4863-ba0a-62d3e1e81e94`.
- Operator: `setiarama1997@gmail.com` → Auth `acc8dbea-d1a2-472a-8568-605fae1150e5`, email confirmed, owner workspace `33da3413-4906-40a3-8324-9b238b126dd3`.
- Tepat **2 workspace, 2 owner membership, 0 partner**; hosted history hanya `202610120001`. Ini lookup exact approved identities, bukan otomatis grant role. User mengklasifikasikan keduanya test sendiri/operator: usulan grandfather pelanggan lama tidak diperlukan. Workspace trial yang sebelumnya dihapus tidak ada di inventory; tidak menghapus Auth/tenant lain.

## Implementasi expand-contract

Pending migrations belum pernah applied; foundation tidak diubah.

- 001 additive entitlement/savings + private `release_controls.sales_activation=false`. **Tidak memasang paid restrictive policies**; tenant RLS tetap.
- 002 admin/settings/purchase/audit; settings tetap NULL/sales false. SQL menolak enable sales, request purchase, verify purchase sebelum DBA sales activation. Operator tidak bisa membuka gate via API; private table RLS tanpa mutation policy.
- 003 memasang reset function tetapi **REVOKE authenticated/PUBLIC/anon**, bukan sekadar menyembunyikan tombol. **Tidak masuk paket admin**.
- 004 multiple developer/operator + last-developer protection + own developer expiring nonpayment grant; tidak tergantung 003.
- `supabase/activation/paid-enforcement.sql` terpisah dari auto migrations: deliberate restrictive RLS cutover.
- `supabase/activation/reset-execute.sql` terpisah: deliberate reset EXECUTE cutover.
- Tidak menambahkan fake purchase/grandfather payment reference; operator planner tetap terbuka pada tahap expand tanpa paid/test grant.

## Paket review terisolasi

`C:/Users/PC/AppData/Local/hermes/cache/scratch/wedding-admin-release`, detached baseline `2de765a48bb9b3a6535e466755f53442eef1ae8c`.

Reproduce pada worktree **bersih baru**, bukan worktree UI release lama:

```bash
git worktree add --detach C:/Users/PC/AppData/Local/hermes/cache/scratch/wedding-admin-release-NEW 2de765a
python scripts/prepare-admin-release.py C:/Users/PC/AppData/Local/hermes/cache/scratch/wedding-admin-release-NEW
```

Allowlist exact 5 files: `src/app/admin/page.tsx`, `src/lib/commerce.ts`, migrations **001,002,004**. SHA256 tiap file di `admin-release-manifest.json`. Admin checkbox disabled dan submit settings selalu `enabled=false`. Planner dashboard/context/cloud/auth tetap baseline; tidak membawa purchase route, paid dashboard guard, reset UI/RPC, secrets, graph caches, canonical `out`. Admin route tetap bisa dibuka langsung `/admin`; belum ada link navigation tambahan.

Paket tidak membawa reset migration003; **jangan memakai canonical `supabase db push`**. Untuk tahap reset berikutnya, buat migration timestamp baru yang disetujui dari definition003 + deliberate activation; jangan memasukkan timestamp003 retroaktif tanpa prosedur history review.

### Commands migration — PROPOSAL ONLY, belum dijalankan

Dalam workdir isolated package, sesudah restore/native rehearsal dan approval:

```bash
supabase link --project-ref lkudkvjaxdjntjosudni
supabase migration list --linked
supabase db push --linked --dry-run
# review dry-run: hanya 202610140001, 202610140002, 202610140004
supabase db push --linked
```

CLI harus mengelola transaksi/history; jangan outer BEGIN file yang sudah BEGIN/COMMIT. Belum ada bukti dry-run, linked isolated, rollback injected history, atau native migration-runner verification. Bootstrap pertama hanya reviewed audited DBA transaction + verified UUID di atas. **Belum dibuat/dijalankan bootstrap executable** sebab approval/ticket belum ada. Sesudah developer bootstrap, operator grant via developer `set_site_admin(UUID,'operator',approved_reason)` dan audit. Own developer test grant duration/reason harus approved, bukan default business duration. Paid-enforcement/reset/sales activation tidak termasuk tahap ini; sales gate SQL terpisah memerlukan approval tambahan.

## Eksekusi nyata

- TDD RED upgrade existing baseline → 001–004: tasks owner menjadi 0, assert gagal. GREEN sesudah split: dua workspace preexisting tasks tetap read/write tanpa entitlement; outsider denied; operator no roster/self-promotion; widened grants tetap no self-enrol; last developer protected; reset permission denied; sales enable/verify denied. Deliberate paid activation menutup operator unentitled dan menjaga own developer grant.
- `node scripts/test-admin-expand.mjs`: **3 grouped scenarios PASS**.
- Existing SQL suites dengan explicit disposable activation: baseline20 + paid9 + admin10 + developer7 + reset5 = **51 tests PASS**. Admin/developer rerun setelah verify gate patch PASS.
- Isolated `npm ci --ignore-scripts` selesai; lint PASS. Full `npm audit` benar-benar dijalankan: **7 high** dependency dev (braces/chokidar/micromatch/fast-glob/Tailwind/ESLint), proposed force fix Tailwind4 breaking tidak diterapkan. `npm audit --omit=dev --audit-level=high`: **0 vulnerabilities**. Build final tanpa fixture env PASS12 pages fail-closed (belum real public config, bukan export deploy-ready). `git diff --quiet 2de765a -- src/app/dashboard src/context/WorkspaceContext.tsx src/lib/cloud-workspace.ts src/lib/auth-policy.ts` exit0 membuktikan planner/auth baseline untouched.
- Isolated fixture build Next15.5.27 **PASS 12 static pages**, `/admin` ada, `/purchase` tidak ada. Build pertama key fixture invalid gagal auth browser guard; rebuilt memakai `sb_publishable_fixture`, browser PASS.
- `python scripts/test-admin-expand-browser.py <isolated-path>` **PASS** deny/operator/developer role update, sales POST false, planner baseline load tanpa ledger/entitlement/reset RPC, responsive360/390/430/1280. Transport fixture only; tidak hosted JWT/mutation. Service worker blocked; cached SW production upgrade belum diuji.
- Canonical lint PASS; `git diff --check` PASS LF/CRLF warnings. Graphify updated592 nodes/891 edges/64 communities; AST-only, semantic docs belum refresh.

## Native/backup gate belum terpenuhi

`psql`/`postgres` tidak tersedia PATH; Docker CLI ada tetapi Docker Desktop Linux daemon pipe tidak tersedia. Tidak mengklaim native concurrency atau backup/restore berhasil. PGlite satu session bukan native multi-connection. Supabase backup inventory/restore belum diminta/dijalankan; snapshot UUID bukan backup.

Sebelum apply: aktifkan environment isolated PostgreSQL17/Supabase staging yang disetujui; export schema/data/Auth secara aman dan restore; verify counts/RLS/history; inject late migration failure; native multi-connection role revocation vs settings/verify/grant/revoke, last-developer concurrent removal. Definisi revocation in-flight tetap perlu diputuskan. Tidak menyatakan pending commerce races selesai.

## Preservasi

Backup nonsecret40 pending files sebelum perubahan: scratch `wedding-admin-preservation/before.zip` + SHA256 `manifest.json`. Canonical HEAD tidak digeser; tidak commit/stage/push/deploy. Unrelated dirty work dipertahankan. Secret/security/temp/graph cache excluded backup. Paket SQL002 hash direfresh sesudah verify gate patch.

## Approval berikutnya

Review lima-file manifest dan SQL split; native restore/concurrency + dependency audit; approve additive-only migrations/bootstrap UUID/ticket/developer-test expiry; approve real public-config build dan Cloudflare everrae account exact deployment terpisah. Tahap admin tidak meminta harga/durasi/Lynk URL, tidak mengunci planner, tidak mengaktifkan reset. Jangan deploy fixture export.
