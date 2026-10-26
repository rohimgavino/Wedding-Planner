# PocketWedding admin — menu & penjualan lokal

## Hasil
- Lokal di `D:/wedding-planner`: navigasi **Ringkasan, Penjualan, Workspace & Masa Akses, Audit, Akses Admin**. Menu terakhir hanya developer; RPC backend tetap boundary keamanan. Tampilan publik EverRae, domain pilihan pocketwedding.id, storage keys dan `D:/everrae` tidak diubah.
- Penjualan menampilkan gross nominal snapshot historis/manual, jumlah transaksi, rincian terbaru maksimal 50, tanggal verifikasi inklusif WIB dan pencarian literal ID/reference. Agregat dihitung server atas seluruh hasil filter, bukan 50 rincian atau response cap PostgREST.
- Hanya `purchase_requests.status=verified` dengan `verified_by`, `verified_at` dan pasangan request/workspace/reference pada registry permanen `verified_transactions` dihitung. Verified yang tidak memenuhi syarat dihitung sebagai dikecualikan. Pending/rejected/entitlements/grant uji tidak menjadi penjualan. Penjualan historis tetap catatan historis walaupun entitlement terkait kelak kedaluwarsa; entitlement sendiri tidak pernah dijumlahkan.
- Nominal SQL `sum(bigint)` dikembalikan sebagai string dan diformat BigInt, tidak kehilangan Rupiah di atas safe integer. Ini **gross tercatat**, bukan bank reconciliation. Payout, fees, refund, profit/net belum diketahui, tidak ditampilkan sebagai nol.
- DOKU belum terintegrasi, tidak ada pendapatan DOKU live. Paket Rp250.000/satu tahun kalender/satu workspace hanya informasi, tidak dikalikan jumlah workspace/entitlement. Tidak membuka sales/verify path lama.
- Loading, empty, error dan snapshot timestamp/stale warning eksplisit. Saat refresh/filter gagal, angka lama disembunyikan. Navigasi keluar membatalkan penerapan response lama melalui request sequence. Filter hanya berlaku setelah Terapkan; bukan realtime.

## Perubahan persis
Diubah: `src/app/admin/page.tsx` (navigasi dan penjelasan batas daftar lama).
Baru:
- `src/components/admin-sales.tsx`
- `src/lib/admin-sales.ts`
- `supabase/migrations/202610210002_admin_sales_report.sql`
- `scripts/test-admin-sales.mjs`
- `scripts/test-admin-sales-client.cjs`
- `scripts/test-admin-sales-browser.py`
- `scripts/verify-admin-sales.py`
- laporan ini dan evidence sales di bawah.
`src/lib/commerce.ts` dicadangkan tetapi tidak diubah. Backup nonsecret sebelum edit: `backups/admin-sales-20261021-163402/` dengan manifest SHA256. Dirty files lain dipertahankan, tidak stash/reset/clean/stage/commit/push.

## SQL additive, bukan rollout
RPC STABLE SECURITY DEFINER `admin_sales_report(date,date,text)` memakai empty search_path, explicit qualified tables, role check `site_role()` setiap invocation; PUBLIC/anon EXECUTE dicabut, authenticated boleh memanggil tetapi ordinary/revoked ditolak. Output rincian hanya request ID, workspace UUID, amount string, reference, verification time. Tidak mengembalikan identitas pasangan/kontak/isi planner; tidak menambah membership atau RLS bypass planner. SQL tidak mengubah definisi role/grant/settings, tidak menimpa stale004/current hosted lock fixes. Tidak ada hosted query/write maupun migration apply pada pekerjaan ini.

## Bukti eksekusi aktual
Semua di `docs/admin-evidence/`:
- `sales-sql-red.log`: expected missing function sebelum implementasi.
- `sales-sql-green.log`: PGlite actual SQL PASS. 62 valid registry-backed verified records (>50 detail cap), satu malformed verified, satu pending; exact sum 558446353793941442; date WIB boundary, search kosong/tidak cocok, invalid range, developer/operator, ordinary/anon/revoked denial, planner tenant isolation dan exact response allowlist.
- `sales-client-red.log` → `sales-client-green.log`: missing formatter menjadi PASS exact IDR/BigInt, filter range, exact read-only RPC args dan propagation backend denial.
- `sales-browser-red.log`: expected missing Penjualan navigation sebelum UI.
- `sales-browser.log`: Edge PASS intercepted transport. Operator/developer menu visibility, revoked denial, navigasi, aggregate display, invalid range tanpa request, backend failure menyembunyikan stale total, empty result; geometry tanpa overflow **360/390/430/1280**. Screenshot fixture `sales-360.png`, `sales-390.png`, `sales-430.png`, `sales-1280.png`. Semua external request intercepted (fixture origin fulfilled lokal), service workers blocked; tidak memanggil mutation RPC. Nilai fixture bukan angka bisnis nyata.
- `sales-fixture-build.log` dan `sales-real-build.log`: Next 15.5.27 build exit0, 13 static routes. Env files hanya rename, isinya tidak dibaca/dicetak, restore dalam finally; fixture export dihapus sebelum default rebuild. Scan akhir actual: 0 export files berisi `https://fixture.supabase.co`, 0 env hold files tertinggal.
- `sales-lint.log`: npm run lint max-warnings0 exit0. `sales-tsc.log`: tsc --noEmit exit0.
- `sales-regressions.log`: pocketwedding-admin contract PASS; overview SQL PASS; admin-expand 3 grouped PASS; admin-stage 10 PASS; developer-stage 7 PASS. Historical SQL payment tests memakai disposable fixture activation saja, bukan menyalakan penjualan hosted.
- `sales-graphify.log`: graphify update AST-only PASS **900 nodes/1213 edges/101 communities** pada rerun final. 4444 unsupported files skipped (termasuk artifacts PG lama); 3 community labels renamed. Docs semantic tidak diperbarui dan backup/fixture graph nodes masih masuk, bukan production-only map.
- `sales-diff-check.log`: git diff --check exit0 (warning LF/CRLF saja).

## Batas / pekerjaan berikutnya
- Belum rilis. RPC baru belum tersedia hosted; UI gagal eksplisit tanpa menebak angka bila migration belum tersedia. Overview hosted juga belum tersedia menurut readiness inventory. Rilis perlu approval terpisah isolated additive migrations/frontend, compatibility review current hosted history/lock fixes, backup dan rollout gates.
- Pengguna telah menyatakan login kedua role bekerja; tidak meminta ulang atau mengubah role. Fixture ini tidak membuktikan hosted JWT/PostgREST end-to-end atau settlement nyata.
- Tidak mengklaim seluruh browser suite historis lulus: suite lama yang mengasumsikan semua panel tampil bersamaan perlu memilih menu baru; suite Lynk/settings tetap obsolete seperti laporan terdahulu. Existing penolakan dan grant form dipertahankan, tidak dieksekusi dalam sales browser test ini.
- PGlite membuktikan SQL authorization/calculations pada schema lokal yang diuji, bukan native concurrency/current hosted schema parity. RPC baru read-only; existing mutation race limitations pada readiness report tetap berlaku.
- Tidak deploy, hosted writes, DNS, role provisioning, commit atau push. Default export lokal bukan izin publish.
