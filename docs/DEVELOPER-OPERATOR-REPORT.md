# Pemisahan developer / operator — lokal, belum rilis

## Siap lokal
- Migration tambahan `202610140004_developer_operator_roles.sql` sesudah 001/002/003; semuanya **belum applied hosted**. Baseline dan tiga migration sebelumnya tidak diubah. Grant admin lama menjadi `operator`, bukan auto-developer.
- `site_admins.role` hanya `operator` / `developer`, sumber identitas `auth.uid()` + tabel privat. Email, Google login, user_metadata dan klaim role klien tidak memberi hak situs. Operator memeriksa/menolak pembayaran, mengelola settings paket/kontak yang sudah disetujui, membaca audit commerce saja. Tidak membaca roster/hak admin, audit reset tenant, atau mengelola grant developer.
- Developer dapat membaca roster dan mengelola grant/revoke lewat `set_site_admin(UUID,role,reason)` dengan audit atomic, validasi Auth FK, alasan wajib dan lock tabel. Role diperiksa ulang setelah lock. Trigger melarang pencabutan/demotion developer terakhir termasuk SQL DELETE biasa. Tidak ada public bootstrap/self-grant. Developer boleh mengelola dirinya setelah ada developer lain; tidak boleh menghilangkan developer terakhir. Database owner yang mematikan trigger/TRUNCATE tetap trust boundary, bukan kemampuan aplikasi.
- Test grant terpisah `developer_test_grants`, bukan entitlement pembayaran, request Lynk atau registry transaksi palsu. RPC grant/revoke hanya developer **owner** workspace dirinya, core saja, 1–30 hari, alasan + audit `payment:false`. Tidak diwariskan ke partner. Expiry, revoke, kehilangan developer/ownership menutup akses SQL. Role situs tidak menggantikan membership RLS; admin unrelated tidak bisa membaca planner/reset. `has_workspace_entitlement` menggabungkan membership dengan paid entitlement atau test grant sendiri.
- UI `/admin` menampilkan role, operator hanya settings/payment/audit commerce; form roster/grant/test hanya developer. Test workspace berasal dari workspace pengguna sendiri, tidak ada pilihan tenant lain atau UUID identitas default. Dashboard memakai hasil RPC read-only `has_developer_test_access` (transport POST, tidak mutasi); bukan metadata lokal. Login tetap tidak dikunci pembayaran dan panel admin tidak memerlukan pembelian. Missing schema tetap fail-closed.

## Provisioning awal — jangan jalankan sekarang
`ahmadnurrochim11@gmail.com` hanya informasi pengguna, **belum diverifikasi hosted**, bukan selector provisioning. Verifikasi akun Auth/Google dan UUID sesungguhnya melalui kanal organisasi tepercaya sebelum tindakan. Jangan membuat UUID identitas atau memakai lookup email otomatis.

Sesudah gate rollout disetujui dan migration direhearsal, database owner tepercaya dapat bootstrap developer pertama dengan transaksi SQL template berikut (placeholder sengaja bukan UUID valid):
```sql
BEGIN;
LOCK TABLE public.site_admins IN SHARE ROW EXCLUSIVE MODE;
INSERT INTO public.site_admins(user_id,role)
VALUES ('UUID-AUTH-TERVERIFIKASI'::uuid,'developer')
ON CONFLICT(user_id) DO UPDATE SET role=excluded.role;
INSERT INTO public.admin_audit(actor_id,action,subject_id,details)
VALUES ('UUID-AUTH-TERVERIFIKASI'::uuid,'admin.provisioned',
        'UUID-AUTH-TERVERIFIKASI'::uuid,
        jsonb_build_object('role','developer','operator_ticket','TIKET-PERSETUJUAN'));
COMMIT;
```
Tidak dijalankan pada sesi ini. Selanjutnya developer mengelola operator/developer melalui RPC audited; operator tidak mengelola admin. Grant UUID di UI memerlukan verifikasi manusia terlebih dahulu; keberadaan Auth UUID saja bukan bukti verifikasi organisasi. Simpan tiket/penanggung jawab provisioning, jangan masukkan service-role ke browser/repository. Recovery kehilangan akun developer memerlukan SQL owner out-of-band + approval/audit, bukan endpoint publik.

## Checklist rollout — preserve akses live dahulu
1. **Stop sebelum apply/deploy:** tidak commit/push/deploy, hosted provisioning, mutation database atau destructive reset dalam pekerjaan ini. Jangan apply 001 sendiri: restrictive entitlement RLS akan mengunci workspace lama.
2. Inventory workspace live + membership + akses sekarang, backup dan restore rehearsal; sepakati tertulis grandfathering/backfill untuk mempertahankan semua akses workspace aktif sebelum aturan entitlement diberlakukan. Jangan memakai test grant untuk mengganti hak pelanggan lama atau mengarang transaksi Lynk. Skema entitlement saat ini wajib reference Lynk: jika grandfathering bukan pembayaran nyata, desain sumber grant legacy terpisah harus disetujui/dibangun dahulu; **block rollout** sampai jalur preservasi akses benar-benar tersedia.
3. Rekonsiliasi referensi legacy/duplicate, paket URL/harga/durasi/email dukungan resmi (belum diberikan); sales tetap disabled sampai disetujui. Backfill pembayaran nyata harus reserve registry reference dalam transaksi yang sama. Jangan bypass uniqueness/hapus audit.
4. Rehearsal native PostgreSQL: baseline + 001–004 dan approved backfill dalam jendela/transaksi terkoordinasi sehingga tidak ada interval workspace existing terkunci. Pastikan 002 registry mencakup backfill references, dan migrasi SQL transaction nesting ditangani release runner. Verifikasi sebelum membuka traffic; rollback plan bukan penghapusan data pelanggan.
5. Verifikasi UUID developer hosted, bootstrap out-of-band dan audit; uji dua akun + operator + developer, PostgREST/JWT/RLS, expired/revoked grants, partner tidak mewarisi grant uji. Stress-test native multi-connection untuk concurrent grant/demotion developer terakhir, payment retry/renewal dan invite. PGlite single-session bukan bukti concurrency.
6. Koordinasikan frontend dengan seluruh schema, backfill dan provisioning; frontend baru sendiri akan gagal load. Uji cache service-worker lama/upgrade domain kanonis, mobile 360/390/430 dan desktop; review support/legal. Hanya deploy setelah approval eksplisit.

## Bukti eksekusi
- TDD RED nyata: SQL `site_role()` belum ada; frontend `role()` belum ada; cloud `developerTestAccess` undefined. GREEN sesudah implementasi.
- `node scripts/test-developer-stage.mjs`: **7 PGlite tests PASS** baseline + 001–004, termasuk email/metadata spoof, widened grants/no self-bootstrap, operator restrictions, audited secure grant/revoke, last developer, payment verification tanpa tenant bypass, own-only nonpayment grant, partner denial, expiry/revoke/demotion, direct mutation denial, audit append-only dan anon.
- Baseline **20 PASS**, paid-stage **9 PASS**, admin **10 PASS**, planning-reset **5 PASS**; cloud/commerce/savings/CSV/storage dan developer frontend RPC contracts PASS.
- Lint max-warnings 0 PASS; Next 15.5.27 build PASS, **13 static pages**. Build fixture memakai public overrides sementara; default build dipulihkan tanpa membaca/menampilkan secret `.env.local`.
- Edge admin browser fixture PASS ordinary denial, operator menyembunyikan developer forms, developer role management + own test payload, settings/payment dan geometry 360/390/430/1280. Auth fixture PASS. Static server admin sempat WinError 10053 saat browser membatalkan koneksi navigasi; assertions/exit code PASS, bukan hosted evidence. Reset fixture assertion awal diperbaiki untuk mengizinkan **hanya RPC STABLE read-only** yang menggunakan POST; bukan melonggarkan larangan mutasi onboarding.
- Reset/guidance browser fixture rerun PASS setelah assertion read-only RPC diperbarui; build default restore PASS.
- `graphify update .` PASS **549 nodes, 853 edges, 52 communities** AST-only, zero LLM tokens; 32 unsupported files skipped dan label komunitas berubah. Dokumen Markdown baru belum semantically indexed. Backup/dirt graf lama dipertahankan. `git diff --check` PASS (warning LF/CRLF saja).
- Fixture browser hanya wiring UI/transport, bukan hosted identity, transaksi Lynk, persistensi multi-device atau concurrency. Tidak ada verifikasi UUID hosted pada sesi ini.

## File
Baru: migration 004, `scripts/test-developer-stage.mjs`, `scripts/test-developer-ui.cjs`, laporan ini. Incremental: commerce, admin UI, cloud-workspace/context/dashboard, cloud/admin/auth/reset fixture tests, PRD/architecture/admin report, output Graphify. Seluruh paid/admin/reset dan dirty unrelated dipertahankan; `D:/everrae` tidak disentuh.
