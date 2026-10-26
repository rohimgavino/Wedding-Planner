# Admin minimal — hasil lokal, belum rilis

> Riwayat tahap 002/003. SOP provisioning lama di bawah **digantikan** `docs/DEVELOPER-OPERATOR-REPORT.md` + migration 004: developer vs operator, audited RPC grant/revoke dan last-developer safeguard. Jangan jalankan contoh SQL lama; tidak ada email auto-admin.

## Hasil
`D:/wedding-planner` saja. Admin `/admin`, permintaan `/purchase`, settings email dukungan/harga IDR/durasi/URL produk Lynk.id, manual verification/rejection, atomic activation dan audit append-only. Pengaturan awal NULL, sales disabled; tidak mengarang harga/durasi/produk/kontak. Core saja; Lamaran/Honeymoon tidak dijual. Existing paid-stage, graph/security dirt dipertahankan. Tidak apply hosted DB, commit, push atau deploy. `.env.local` tidak dibaca/diubah/staged; Next build memuat konfigurasi standar tanpa menampilkan nilai secret.

## Provisioning admin — SQL out-of-band, BUKAN dijalankan sekarang
Setelah persetujuan rollout/backfill dan rehearsal migration, operator database tepercaya memverifikasi identitas akun Google di Supabase Auth melalui kanal organisasi terpisah. Catat UUID yang benar; tidak mencari admin dengan email dugaan, tidak mengambil `user_metadata.role` dan tidak membuka signup admin.

Contoh template SQL operator (ganti UUID placeholder setelah verifikasi; bukan UUID/email default):
```sql
BEGIN;
INSERT INTO public.site_admins(user_id)
VALUES ('UUID-AUTH-TERVERIFIKASI'::uuid);
INSERT INTO public.admin_audit(actor_id,action,details)
VALUES ('UUID-AUTH-TERVERIFIKASI'::uuid,'admin.provisioned',
        jsonb_build_object('operator_ticket','TIKET-PERSETUJUAN'));
COMMIT;
```
Cabut hak melalui operator, bukan browser:
```sql
BEGIN;
DELETE FROM public.site_admins
WHERE user_id='UUID-AUTH-TERVERIFIKASI'::uuid;
INSERT INTO public.admin_audit(actor_id,action,details)
VALUES ('UUID-AUTH-TERVERIFIKASI'::uuid,'admin.revoked',
        jsonb_build_object('operator_ticket','TIKET-PENCABUTAN'));
COMMIT;
```
Tidak ada RPC/public policy untuk menulis daftar admin. JWT sesi harus berasal dari auth backend; akun biasa tidak berubah menjadi admin karena tahu route. Hak dicabut langsung menghalangi RPC berikutnya, meski UI lama masih terlihat. Database owner tetap trust boundary dan bisa mengubah schema; audit bukan tamper-proof terhadap superuser yang mematikan trigger.

## SOP transaksi
1. Pengguna masuk, buat workspace, buka `/purchase`, buat permintaan. Snapshot produk/harga/durasi tidak berubah ketika settings diganti.
2. Pengguna membayar hanya link snapshot resmi Lynk.id, mencatat ID request/workspace pada catatan transaksi atau menghubungi email dukungan. Aplikasi tidak mengumpulkan kartu, OTP, password, bank secrets atau screenshot.
3. Admin membuka dashboard Lynk.id resmi secara mandiri; cocokkan status **lunas**, produk/link, nominal, identitas pembeli dan workspace/request. Bila korelasi tidak jelas: jangan aktivasi, minta klarifikasi lewat dukungan. Checkbox UI adalah pernyataan admin manusia, bukan bukti API.
4. Isi referensi dashboard, nominal nyata, catatan dan konfirmasi lalu verifikasi. SQL menormalisasi uppercase referensi, mencadangkan registry global, menulis status/entitlement/audit atomic. Duplicate lintas workspace gagal dan rollback; retry request/ref identik tidak menambah waktu. Pembelian baru memperpanjang expiry aktif, atau mulai sekarang jika revoked/expired. Ditolak tidak mengaktifkan dan harus dibuat request baru.
5. Tidak percaya screenshot, email palsu, redirect/query atau klaim klien. Admin tepercaya tetap bertanggung jawab memastikan produk/pembeli sesuai dashboard. Tidak ada webhook/integrasi otomatis.

## Bukti eksekusi nyata
- TDD RED: fungsi admin belum ada; settings table belum ada; request RPC belum ada; verification menolak sebelum implementasi; rejection RPC belum ada; permanent legacy registry belum ada. GREEN setelah tiap slice.
- `node scripts/test-admin-stage.mjs`: **10 SQL tests PASS**, PGlite schema baseline + dua migration. Admin/no self-provision (widened grants), config empty/nonadmin denial, tenant request/disabled sales, atomic activation/amount/confirmation/retry, duplicate global rollback, rejection audit, reserved legacy reference, email/money/duration/HTTPS URL validation, direct mutation/RLS/anon/append-only denial.
- `node scripts/test-commerce.cjs`: PASS validasi + kontrak RPC. `node scripts/test-cloud.cjs`: PASS termasuk safe redirect `/admin` dan `/purchase` setelah RED assertion.
- Baseline `test-backend.mjs`: **20 PASS**; paid-stage **9 PASS**; savings/CSV/workspace-storage PASS.
- `npm run lint`: PASS max-warnings 0 setelah dependencies hook diperbaiki.
- `npm run build`: PASS Next 15.5.27, **13 static pages**, `/admin` dan `/purchase`. Fixture build public overrides sementara, lalu build default dipulihkan.
- `python scripts/test-admin-browser.py`: PASS Edge transport fixture: ordinary-user denial, empty setup, settings save, purchase snapshot link, manual verification payload/status, tidak overflow 360/390/430/1280. RED route missing sebelum implementasi. Kegagalan fixture karena belum memilih request diperbaiki test agar mengikuti UX nyata.
- `python scripts/test-auth-configured-browser.py`: PASS regresi fixture auth/PKCE/savings/pairing/logout/legacy/geometry.
- `graphify update .`: **473 nodes, 746 edges, 46 communities**, AST-only; 32 unsupported files skipped, community labels berubah; Markdown belum semantically indexed. Existing graph backup/dirt dipertahankan.
- `git diff --check`: PASS (warning LF/CRLF saja).

## File
Baru: `D:/wedding-planner/supabase/migrations/202610140002_admin_manual_purchases.sql`, `src/lib/commerce.ts`, `src/app/admin/page.tsx`, `src/app/purchase/page.tsx`, `scripts/test-admin-stage.mjs`, `scripts/test-commerce.cjs`, `scripts/test-admin-browser.py`, laporan ini.
Diubah incremental: `D:/wedding-planner/src/lib/auth-policy.ts`, `src/app/dashboard/page.tsx`, `scripts/test-cloud.cjs`, `docs/PRD.md`, `docs/ARCHITECTURE-ACCESS.md`, output Graphify. Tidak mengubah migration baseline atau migration paid-stage sebelumnya.

## Tambahan onboarding/reset — lokal, belum rilis
- Panduan `Contoh pengisian` fiktif/hanya baca pada onboarding dan dashboard; tidak seed, mengisi input atau menulis cloud. Reset manual owner-only, bukan saat login, tersedia pada Ringkasan/Pengaturan dan halaman menunggu aktivasi. Partner maupun site admin unrelated tidak dapat mereset workspace.
- Migration baru **202610140003_reset_planning_content.sql belum applied**; baseline dan dua migration tahap sebelumnya tidak diubah. RPC `reset_planning_content(p_workspace_id,p_confirmation)` memerlukan UUID auth/membership owner dan string tepat `RESET RENCANA`. Security definer dengan search_path kosong dan EXECUTE authenticated saja. Empat DELETE scoped + audit `planning.reset` atomic; entitlement aktif tidak diperlukan untuk cleanup.
- Hapus hanya `budgets`, `tasks`, `guests`, `savings_contributions`. Tetap: Auth/users, workspace dan nama/tanggal/target, membership, invitation, legacy savings_accounts, entitlement, purchase request, registry transaksi dan audit sebelumnya. Tidak ada client multi-delete atau perubahan dana. Persetujuan pasangan/backup perlu sebelum reset; tidak ada undo. Penulisan partner sesudah transaksi dapat membuat data baru; timeout jaringan memerlukan reload sebelum retry.
- Bukti TDD RED nyata: SQL function missing, cloud method missing, browser guidance missing. GREEN: `test-planning-reset.mjs` **5 PASS** (owner/partner/outsider/admin unrelated/anon, exact confirm, tenant isolation, preservation termasuk audit lama, late-trigger rollback seluruh tabel/audit, expired entitlement/idempotent empty reset). `test-cloud.cjs` PASS RPC tunggal/invalid confirm/no-auth.
- `test-guidance-reset-browser.py` PASS read-only example/input tetap kosong/no POST onboarding, Batal/Escape/no RPC, wrong confirmation disabled, error/retained dialog, success/reload/partner guard, no client DELETE, geometry 360/390/430/1280. Edge transport fixture sepenuhnya intercepted, bukan hosted. Test locator error diperbaiki untuk scope alert dialog, bukan perubahan hasil produk.
- Regresi baseline **20 SQL PASS**, paid **9 PASS**, admin **10 PASS**, savings/commerce/cloud PASS; admin/auth browser fixture PASS. Admin browser sempat mencetak WinError 10053 dari static-server connection aborted saat navigasi, tetapi assertions dan exit code PASS; tidak diklaim sebagai hosted evidence. Lint max-warnings 0 PASS, build fixture dan default restore PASS **13 static pages**, diff --check PASS (warning line endings saja).
- Graphify AST update **506 nodes, 795 edges, 45 communities**; 32 unsupported files skipped, label komunitas berubah. Dokumen Markdown belum semantically indexed. File baru: dua komponen filling-example/planning-reset, migration ketiga, scripts test-planning-reset.mjs/test-guidance-reset-browser.py. Diubah incremental: onboarding/dashboard, context/cloud-workspace, test-cloud.cjs, PRD/laporan ini, output graph. Existing uncommitted paid/admin/unrelated dirt dipertahankan. `.env.local` tidak dibaca/diubah/staged; build memuat config standar tanpa mencetak secret.
- Tidak hosted writes, provisioning admin, commit, push atau deploy. Release gate tetap berlaku: schema/backfill/frontend terkoordinasi, two-account hosted/native concurrency/service-worker verification. Jangan apply migration sekarang.

## Batas dan release gate
**Jangan rilis/apply sekarang.** Inventory/backfill legacy workspace harus disetujui. Registry legacy migration sengaja gagal bila reference duplicate/format nonkanonis: rekonsiliasi operator dahulu, jangan hapus audit/registry atau bypass unique untuk meloloskan migration. Backfill entitlement sesudah migration kedua harus mencadangkan ref di registry dalam transaksi operator yang sama. Tidak ada hosted JWT/PostgREST/GoTrue/two-account/cross-device test, transaksi Lynk nyata, atau native multi-connection concurrency test. PGlite single session bukan bukti races; unique + row locks diuji serial. Rehearsal native PostgreSQL, approval produk/harga/durasi/kontak, admin provisioning terkendali, koordinasi schema/frontend, cached service-worker upgrade dan review support/legal wajib. Revocation/refund dashboard dan ekspor audit/pagination lebih lanjut belum dibuat; admin list sederhana, audit hanya 100 terbaru. Email support menjadi kontak situs tunggal, bukan perubahan metadata marketing/legal lain. SQL/RLS menegakkan akses walau guard UI dilewati.
