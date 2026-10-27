# PocketWedding admin readiness — 21 Oktober 2026

## Hasil aktual: role sudah ada, jangan provision ulang

Read-only Management API pada project exact `lkudkvjaxdjntjosudni`, `BEGIN READ ONLY`, menggunakan UUID dari inventory trusted `ADMIN-EXPAND-REPORT.md` (bukan UUID tebakan / lookup email baru):
- UUID developer `7b94a773-bf81-4f65-a243-a1f0e8992f23`: **developer**.
- UUID Setiarama `acc8dbea-d1a2-472a-8568-605fae1150e5`: **operator** (hak admin operasional, bukan developer).
- Bukti permanen `docs/admin-evidence/readiness-live-final.{sql,log}`. Ini verifikasi tabel role current, bukan bukti browser sedang login sebagai kedua orang itu.
- Browser aktual https://pocketwedding.id/admin menampilkan `Memvalidasi sesi… Sesi tidak valid. Silakan masuk kembali.` Tidak ada sesi authenticated yang dapat dipakai; tidak membaca token/storage/cookie atau memasukkan credentials. **Gate manual: pengguna login lewat UI aman lalu verifikasi /admin sebagai developer dan Setiarama/operator.** Tidak diperlukan pembuatan/perubahan role.

## Hosted schema berbeda dari laporan lama

History current: 202610120001, 202610140001, 202610140002, 202610140004, 202610140005, 202610140006, 202610150001, 202610150002. Jadi laporan historis yang mengatakan foundation-only atau semua stage belum applied bukan status current.

`site_admins`, `site_role`, entitlements tersedia. **RPC admin_workspace_overview(integer,integer) belum tersedia**; migration lokal 202610210001 belum applied. `sales_activation=false`, `sales_enabled=false`. DOKU tetap pending, penjualan tidak dibuka. Jangan `supabase db push` dari canonical dirty tree; hosted memiliki migrations tambahan yang tidak ada lokal. Butuh inventory/diff schema dan isolated additive-only release manifest approval terlebih dahulu. Tidak apply semua commerce/reset/paid migrations.

Read-only function inspection `readiness-function-readonly.{sql,log}` membuktikan live grant/settings sudah memakai `LOCK TABLE public.site_admins IN SHARE ROW EXCLUSIVE MODE` sebelum role check. Local 004 lama **tidak sama** dengan current live grant. Jangan menimpa live fix dengan pending SQL lama.

## Native PostgreSQL rehearsal benar-benar dijalankan

Runnable: `python scripts/test-admin-native-readiness.py --pg-bin D:/pocketwedding-local-tools/pg17/pgsql/bin` (dependency Python psycopg[binary]). PostgreSQL portable **17.6**, bukan hosted 17.11 exact/Supabase stack. Download vendor EDB resmi; Docker daemon tidak tersedia, sehingga portable cluster merupakan alternatif lokal. Cluster uniquely owned, trust auth **loopback saja**, tidak mengubah password/server bersama. Semua identitas/data synthetic. Server dihentikan pada finally; dump bukan backup customer.

Bukti final `docs/admin-evidence/native-readiness-run.log`, folder `docs/admin-evidence/native-3cc97a49cb/`:
1. PASS overview migration injected late failure rollback: function tidak tertinggal.
2. PASS native operator overview metadata; planner tenant tidak terbuka.
3. PASS pg_dump → fresh database restore synthetic data, role rows, overview EXECUTE ACL dan anon denial. Dump `synthetic-backup.sql`, bukan hosted backup/restore.
4. **Reproduksi defect local stale004**: grant menunggu workspace lock, developer didemote dari koneksi kedua, grant tetap commit sesudah demotion (persisted=1). Ini release-blocker **jika stale004 dipakai sebagai current definition**, bukan klaim exploit current hosted.
5. PASS exact grant function definition current live direplay pada local disposable DB: demotion menunggu role lock sampai grant selesai; setelah demotion, grant berikutnya ditolak `developer required`. Semantik: operasi in-flight yang memegang role lock boleh selesai sebelum revocation commit, bukan dibatalkan mundur. Tidak melakukan hosted mutation/race.
6. PASS concurrent last-developer self-demotions: tepat satu commit, satu ditolak `cannot remove last developer`, satu developer tersisa.

Tidak mengklaim seluruh concurrency settings/payment/revoke sudah lulus: current live settings direview read-only, belum native seluruh race matrix; payment/renewal/invite/revoke dan exact hosted migration runner/history rollback tetap gate terpisah.

Eksekusi regresi actual exit0: pocketwedding-admin contract; overview PGlite; admin-expand 3 grouped; developer-stage 7; lint max-warnings0; tsc --noEmit. PGlite bukan bukti native concurrency. Tidak build/deploy baru dalam verifikasi ini. Final `graphify update .` PASS: 834 nodes / 1109 edges / 90 communities, AST-only; docs semantic belum refresh. Warning 4431 unsupported files (termasuk disposable PG cluster artifacts) skipped dan 8 community labels renamed; graph ikut membaca supported SQL fixture/dump sehingga bukan peta production-only. `git diff --check` exit0, hanya warning LF/CRLF.

## Runbook dan keputusan release

- Bootstrap template historis hanya untuk first developer yang belum ada. **SKIP** untuk kedua UUID di atas: role sudah benar. Tidak menjalankan bootstrap, set_site_admin atau mutation hosted apa pun.
- Sebelum release overview: approval terpisah schema additive 202610210001 + isolated frontend allowlist, inventory/diff migrations hosted005/006/150001/150002 vs lokal, review compatibility (jangan regress lock fixes), approved hosted backup/restore plan dan exact migration runner rollback/history rehearsal.
- Login manual dua role, JWT/PostgREST/RLS dan cache/service-worker/cross-device/mobile smoke tetap belum diverifikasi; HTTP200 bukan bukti role UI.
- Overview rollback yang direhearsal adalah abort transaction sebelum COMMIT. Sesudah rilis, prefer rollback frontend/preserve additive schema; tidak drop data/roles/audit. Restore rehearsal synthetic bukan permission restore hosted.
- Semua produksi perlu approval baru; jangan activate sales/paid/reset/DOKU, jangan commit/push/deploy/DNS. EverRae public design/storage keys dan `D:/everrae` tidak disentuh.

## Artifacts dan preservasi

Baru: test native, laporan ini, `docs/admin-evidence/readiness-*.sql`, logs live nonsecret, native output/log/dump folders. Tidak mengedit source bisnis/migration lama atau .env. Existing dirty changes dipertahankan. Portable tools di `D:/pocketwedding-local-tools/` jangan commit. Evidence cluster/dump/backups juga jangan commit tanpa allowlist review. Percobaan native pertama timeout karena Windows inherited stdout pipe; runner diperbaiki memakai file handles; run final selesai dan server stopped (pg_ctl.log). Folder percobaan dipertahankan sebagai bukti, bukan deploy artifact.
