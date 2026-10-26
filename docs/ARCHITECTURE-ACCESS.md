# Arsitektur dan akses berbayar

> Delta kanonis terbaru: `docs/DEVELOPER-OPERATOR-REPORT.md`. Migration 004 (belum applied) memberi role developer/operator dan test grant nonpembayaran owner-developer sendiri. `has_workspace_entitlement` tetap memerlukan membership; operator tidak mengelola admins atau membuka planner tenant. Provisioning awal UUID Auth out-of-band; sesudahnya RPC developer-only audited, last developer dilindungi. Rollout 001–004 wajib mempertahankan akses workspace live dengan inventory/backfill disetujui sebelum locking policy aktif; jangan apply sekarang.

Rujukan scope: `docs/PRD.md`. Next.js 15 static export (`out`) di Worker `everrae`, domain live `https://pocketwedding.id`; Supabase menyediakan auth/PostgREST/PostgreSQL. Tidak menambah API Next server pada static export. Deployment dan database hosted tidak disentuh pada tahap lokal ini.

## Boundary keamanan
1. `auth.uid()` berasal dari auth backend; frontend `getUser()` bukan pengganti JWT verification.
2. `is_workspace_member` memastikan owner/partner dari workspace yang sama, kapasitas dua orang.
3. `workspace_entitlements` keyed `(workspace_id, feature)`: `core`, `lamaran`, `honeymoon`, provider hanya Lynk.id, admin verifier/reference, waktu verifikasi/expiry/revocation. Member hanya SELECT tenant sendiri; tidak ada INSERT/UPDATE/DELETE policy publik. RPC aktivasi baru memerlukan trusted site_admins dan transaksi dashboard terverifikasi manual.
4. `has_workspace_entitlement` SECURITY DEFINER dengan empty search_path, objek qualified dan EXECUTE hanya authenticated; hasil true memerlukan membership + entitlement tidak dicabut/belum expired.
5. Policy **RESTRICTIVE** paid_core digabung AND dengan membership policies di budgets/tasks/guests/savings_accounts dan ledger baru. Guard React hanya UX; request langsung tetap dilindungi SQL.
6. Workspace metadata dan pairing tidak dikunci pembayaran sehingga pengguna bisa membuat workspace/memasangkan pasangan sebelum admin verifikasi. Jangan menambahkan field unlock atau flag entitlement ke workspaces/user_metadata.
7. `savings_contributions` FK komposit `(workspace_id, contributor_id)` ke membership, nominal integer positif maksimal JS safe integer, tanggal wajib, notes maksimal 500. UPDATE workspace_id dilarang trigger. Dua pasangan boleh mengoreksi ledger bersama; tidak dimaksudkan audit perbankan.

Tidak ada aktivasi melalui checkout redirect, query string atau webhook. Database owner/service-role hanya untuk provisioning out-of-band, tidak pernah masuk bundle/browser/repository. Migration `202610140002_admin_manual_purchases.sql` menambah `site_admins` (tanpa policy mutation), settings read publik/mutation RPC admin, purchase read tenant atau admin/mutation hanya RPC. Setiap RPC admin memeriksa `auth.uid()` terhadap daftar admin, SECURITY DEFINER empty search_path dan EXECUTE PUBLIC/anon dicabut. Registry `verified_transactions` mereservasi referensi normalisasi uppercase secara permanen, termasuk legacy entitlement; duplicate/format legacy tidak aman memblok migration sampai rekonsiliasi disetujui. RPC verification locks request dan workspace, unique reference global, snapshot amount/duration, status + entitlement + audit atomic; retry identik no-op. Audit dan registry memiliki trigger anti UPDATE/DELETE, tidak ada policy mutation. Admin tidak mendapat akses universal planner pribadi. Konfirmasi dashboard adalah tindakan manusia tepercaya, bukan API payment verification.

## Urutan migration dan rollout
- Applied baseline **tidak diubah**: `supabase/migrations/202610120001_secure_foundation.sql`.
- Baru **BELUM diterapkan**: `supabase/migrations/202610140001_workspace_entitlements_savings.sql`, kemudian `202610140002_admin_manual_purchases.sql`.
- Migration tidak mengisi entitlement workspace lama; bila diterapkan tanpa backfill disetujui, core lama akan terkunci. Itu adalah release gate, bukan instruksi apply sekarang.
- Sebelum approval: inventory workspace lama, keputusan grandfathering/activation, backup/rehearsal, controlled admin provisioning, hosted two-account tests, concurrency native PostgreSQL dan coordinated schema/frontend release. Tidak ada fallback tidak aman bila schema hilang.
- Legacy `savings_accounts` tetap dipertahankan tanpa konversi diam-diam; ledger baru menjadi satu sumber total kontribusi UI.

## Pengujian provisioning lokal terkontrol
`node scripts/test-paid-stage.mjs` membuat PGlite memory DB disposable, auth minimal dan role lokal. Harness menjalankan baseline lalu migration baru. `RESET ROLE` hanya di harness lokal untuk INSERT entitlement sebagai database owner dengan `payment_reference='LOCAL-ONLY'` dan `verified_by='local-test-admin'`; tidak ada endpoint self-grant; tombol aktivasi pada `/admin` kini memerlukan site_admins dan server enforcement. Tidak menjalankan SQL ini ke hosted database.

`node scripts/test-backend.mjs` tetap menguji baseline 20 kasus. Suite paid-stage menguji schema gabungan/entitlement/ledger/RLS. Browser `scripts/test-auth-configured-browser.py` memakai respons transport fixture di `https://fixture.supabase.co`, bukan pembayaran/auth/database sungguhan. Build fixture harus menggunakan public environment overrides sementara, lalu kembalikan build default dengan `npm run build`. Fixture memblok service worker agar routing transport deterministik; pengujian cache service-worker adalah gate terpisah.

## Batas bukti
PGlite adalah PostgreSQL WASM nyata, bukan pemeriksaan string SQL; tidak menguji PostgREST/JWT/GoTrue atau multi-connection races. Browser fixture membuktikan wiring render/CRUD/reload/lock/responsive, bukan hosted cross-device persistence. Frontend memuat ulang setelah mutasi dan polling/focus 30 detik, bukan realtime subscription. Produk add-on belum punya tabel/module operasional; enum entitlement adalah fondasi saja.
