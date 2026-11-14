# Drift produksi — snapshot review-only, 14 November 2026

**Bukan migration, bukan restore dump, bukan persetujuan cutover.** Snapshot menangkap keadaan struktural saat SELECT, bukan merekonstruksi isi migration historis. Tidak ada SQL DDL/DML hosted, commit/push/deploy, `db pull`, atau `db push`. Hanya SELECT katalog dan metadata ledger version/name di dalam `BEGIN TRANSACTION READ ONLY` / `ROLLBACK`. Tidak membaca row aplikasi, Auth, entitlement, atau isi `statements` ledger. Nama objek/kolom/role adalah metadata skema, bukan identitas pelanggan; UUID/email/bearer/key/kredensial tidak disimpan. Isi fungsi mencakup string contoh fiktif yang memang bagian definisi skema, bukan row pelanggan.

## Artefak dan reproduksi
Dari `C:/Users/MSI/program/Wedding-Planner`:

- `docs/release/production-schema-drift-20261114.json`: metadata tersanitasi; definisi `pg_get_functiondef`, kolom/type/default/nullability, constraints, indexes, RLS/policies, raw ACL, triggers internal/noninternal, schema ACL dan dependency edges.
- `docs/release/production-schema-drift-20261114.select.sql`: query allowlist yang digunakan.
- `docs/release/capture-schema-drift.py`: capture in-memory, validasi sebelum menyimpan, menolak overwrite bukti existing. Bukan pengunduh data aplikasi.
- `docs/release/production-schema-drift-20261114.validation.json`: counts dan SHA-256 terverifikasi.

Command hosted yang benar-benar dipakai oleh wrapper:
```sh
npx supabase db query --linked --project-ref lkudkvjaxdjntjosudni --file docs/release/production-schema-drift-20261114.select.sql
```
Capture awal dan pemeriksaan ulang lokal yang benar-benar lulus:
```sh
python3 docs/release/capture-schema-drift.py
python3 docs/release/capture-schema-drift.py --validate-only
```
Validasi ulang tidak mengakses hosted. Capture pertama berhenti sebelum menulis snapshot karena asumsi keliru bahwa semua tabel punya constraint/index; `package_price_current` memang 0/0. Validator diperbaiki untuk menerima array kosong, bukan memalsukan struktur, lalu capture diulang. Query discovery terpisah juga read-only. Prior audit metadata digunakan sebagai orientasi; artefak ini berasal dari SELECT live baru, bukan menyalin log audit.

**PASS:** 14 tabel, 91 kolom, 47 constraints, 19 indexes, 11 policies, 75 triggers (termasuk internal FK), 11 fungsi, 365 dependency edges, 4 ledger versions. Delapan planner tables RLS aktif dengan satu policy permissive ALL authenticated membership-only per tabel terverifikasi otomatis. Tiga RPC reset/starter terverifikasi SECURITY DEFINER, authenticated EXECUTE=true, anon=false. SHA snapshot: `3dc79a16d092e4f090ef41ef6f8fac118923f4beb766e136de959cfce4800320`.

## Drift yang dipulihkan sebagai bukti, bukan migration palsu
| Ledger live | Nama ledger | Objek yang terlihat sekarang |
|---|---|---|
| 202610140005 | reset_planning_content | `reset_planning_content(uuid,text)`, dependency audit dan receipt; definisi sekarang juga menghapus vendor children dahulu |
| 202610140006 | starter_template | `create_starter_workspace`, `use_starter_template`, `starter_private.requests`, `starter_private.applied` |
| 202610150001 | whatsapp_template | `workspaces.wa_template` nullable jsonb, tanpa default |
| 202610150002 | vendor_planning | vendors, vendor_installments, vendor_payments; composite FK, indexes, immutable-scope trigger/function; reset/template sekarang sudah memperhitungkan vendor |

Keempat version tidak memiliki file lokal yang cocok. File lokal `202610140003_reset_planning_content.sql` bukan pengganti otomatis version 005. Ledger membuktikan version/name, **bukan** asal persis setiap byte definisi terkini; fungsi dapat telah diganti migration sesudahnya. Tidak membuat `supabase/migrations/20261014...005/006` atau `...150001/002` hasil tebakan. Lima-table paid patch dan activation existing tidak diubah.

Snapshot 14 tabel sengaja scoped: 8 planner + workspaces + admin_audit + 2 starter receipts + 2 package_price tables. Ini bukan inventaris seluruh schema produksi atau backup pemulihan. `pg_depend` tidak exhaustively merekam referensi PL/pgSQL; baca body fungsi dan source juga. Graph existing diketahui stale dan CLI tidak tersedia; tidak direbuild/dikarang. Validasi struktur bukan bukti native restore, konkurensi, JWT/PostgREST, atau kelayakan bisnis.

## Fakta akses dan keputusan cutover yang masih diblokir
1. **Patch lokal lima tabel tidak cukup untuk keadaan live.** budgets, tasks, guests, savings_accounts, savings_contributions, vendors, vendor_installments, vendor_payments masih membership-only; patch tidak mencakup tiga vendor tables.
2. Reset dan starter RPC SECURITY DEFINER executable oleh authenticated; body melakukan pemeriksaan autentikasi/owner/confirmation/eligibility/receipt, tetapi tidak memanggil entitlement core. RLS langsung tidak otomatis membatasi operasi definer milik postgres. Reset menghapus planning bersama milik workspace owner, bukan akun Auth/workspace/membership/pembayaran, dan mempertahankan legacy savings. Template adalah provisioning contoh fiktif, bukan CRUD umum berbayar.
3. **Rekomendasi menunggu keputusan pengguna, belum disetujui:** onboarding/login/pairing gratis; reset rencana sendiri gratis dengan owner/konfirmasi/audit tetap; provisioning contoh template gratis dengan empty-workspace/idempotency receipt tetap; vendor CRUD masuk core; workspace settings (termasuk metadata/WA template) gratis, **tanpa blanket locking workspaces**. “Gratis” bukan anon atau lintas tenant: semua pemeriksaan identity/ownership/membership tetap.
4. Pengguna perlu menyetujui batas free/core dan perlakuan akses workspace existing terlebih dahulu. Konteks preflight sebelumnya hanya agregat: 3 workspace, 2 core aktif, 1 tanpa core; yang terakhir tidak otomatis pelanggan terkunci karena developer-own exception mungkin berlaku. Sesi ini tidak membaca ulang row cohort. Jangan backfill/grandfather atau menciptakan transaksi pembayaran tanpa keputusan. Grant developer hanya own active server-authorized; partner tidak otomatis mewarisinya.
5. Setelah keputusan produk: susun **perubahan baru** berbasis live snapshot yang direview, rehearsal native dengan definer + JWT/PostgREST + owner/partner/unpaid/developer cases, preservasi data/access existing, independent review, backup/restore dan approval cutover terpisah. Review sebelumnya hanya meluluskan read-only preflight; tidak memberi izin deploy. Tidak ada rollout otomatis dari artefak ini.

## Hardening terpisah: package_price_*
`package_price_current` dan `package_price_versions` memiliki ACL luas anon/authenticated (`arwdDxtm`) dan RLS aktif tanpa policies di snapshot. Ini tidak sama dengan bukti public SELECT/INSERT berhasil: RLS tanpa policy deny-default untuk operasi yang tunduk RLS. Namun TRUNCATE/REFERENCES/TRIGGER bukan semuanya ditutup RLS; ACL perlu ditinjau/revoke least privilege dalam pekerjaan hardening **terpisah**. Tidak mengubah ACL sekarang, tidak menggabungkannya diam-diam ke paid boundary patch.

## Worktree
Dirty awal: docs/PAID-STAGE-REPORT.md, package.json, scripts/test-paid-rls.mjs, supabase/.temp/, supabase/activation/, supabase/migrations/202611140001_paid_access_rls.sql. Semuanya dipertahankan; hanya laporan ditambah bagian terbaru dan artefak docs/release dibuat. Tidak membaca `.env.local`, tidak menulis secret/data pelanggan, tidak menjalankan fungsi mutasi dari definisi snapshot.
