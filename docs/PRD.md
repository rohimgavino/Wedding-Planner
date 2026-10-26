# PRD kanonis — EverRae / PocketWedding

Status: tahap pertama roadmap berbayar, implementasi lokal; belum rilis. Repo kanonis `D:/wedding-planner` (`rohimgavino/Wedding-Planner`). Dokumen tim di `C:/Users/PC/AI-Team/WeddingPlanner` adalah referensi historis, bukan sumber keputusan terbaru. `D:/everrae` dan repo EverRae terpisah tidak menjadi target.

## Produk dan akses
- Satu workspace untuk pasangan (owner + partner), bukan lisensi per pengguna.
- Paket inti **berbayar**: anggaran pernikahan, checklist/timeline, daftar tamu dan pencatatan tabungan bersama dasar.
- Add-on **Lamaran berbayar**: ruang perencanaan lamaran; modul lengkap tahap berikutnya.
- Add-on **Honeymoon Budgeting berbayar**: perencanaan anggaran bulan madu, bukan pemesanan perjalanan; tahap setelah lamaran.
- Add-on tidak otomatis termasuk core. Core tetap diperlukan untuk pengalaman planner inti. Tidak menjual modul mendatang sebelum implementasi diuji.
- Google login membuktikan identitas, membership menentukan tenant, entitlement menentukan hak fitur; ketiganya berbeda.
- Workspace dapat dibuat dan pasangan dapat dipasangkan sebelum aktivasi. Metadata/pairing tetap dapat diakses tanpa core; data planner berbayar dilindungi RLS.

## Pembayaran tahap pertama
Provider tetap **Lynk.id**. Admin memeriksa transaksi di kanal resmi Lynk.id, mencocokkan workspace, produk, status lunas dan referensi pembelian, kemudian mengaktifkan entitlement lewat akses database administratif tepercaya. Tidak ada self-grant, webhook otomatis yang belum diverifikasi, atau unlock dari parameter/redirect browser. Harga, product URL, kunci pembayaran, identitas merchant dan kanal dukungan masih harus ditetapkan pemilik; jangan mengarangnya.

## Tabungan bersama dasar
Catatan kontribusi positif dalam Rupiah, tanggal, kontributor anggota workspace dan catatan opsional. Kedua anggota dapat mencatat/mengoreksi/menghapus catatan berdua; kontributor merupakan atribusi, bukan bukti transfer bank atau pencipta record. UI menampilkan total tercatat, jumlah per pasangan, target workspace, progres maksimal 100% dan sisa minimal nol. Tidak ada penggabungan otomatis saldo rekening lama: `savings_accounts.current_balance` bukan ledger kontribusi dan tidak boleh dihitung dua kali.

EverRae hanya mencatat uang; tidak menerima, menyimpan, memindahkan atau mengelola dana, tidak mengakses rekening bank dan bukan layanan custody. Tidak ada saldo fiktif/default contribution. Data lama browser tidak diunggah otomatis.

## Kriteria penerimaan tahap ini
1. Owner dan partner mendapat akses core yang sama hanya jika entitlement workspace aktif; outsider dan anonymous ditolak.
2. Klien tidak dapat membuat/mengubah entitlement, meski grant tabel tidak sengaja diperluas.
3. Revocation/expiry langsung berlaku pada SQL/RLS, bukan bergantung guard frontend.
4. Ledger CRUD cloud ber-scope workspace; nominal/tanggal/kontributor divalidasi database. Tidak dapat memindah record antar workspace.
5. UI add-on tampil terkunci/mendatang, bukan modul siap pakai.
6. Pengujian SQL nyata lokal, build/lint dan fixture browser dipisahkan dari bukti hosted.

## Admin minimal (lokal, belum rilis)
Route `/admin` untuk identitas terdaftar `site_admins` melalui SQL operator, tidak berdasarkan email/user_metadata/signup. Pengaturan email dukungan, harga IDR, durasi hari dan URL produk HTTPS `lynk.id` kosong; sales disabled. Route `/purchase` membuat permintaan paket inti terkait workspace, snapshot harga/durasi/link, lalu link pembayaran. Admin memeriksa transaksi asli di dashboard Lynk.id (lunas, produk, nominal, pembeli, workspace) dan memasukkan referensi + catatan; bukan screenshot/redirect. RPC menggabungkan status, registry referensi permanen, entitlement dan audit dalam transaksi atomic. Retry referensi/permintaan yang sama tidak memperpanjang expiry. Lamaran/Honeymoon tidak dijual.

## Developer / operator (lokal, belum rilis)
`docs/DEVELOPER-OPERATOR-REPORT.md` menggantikan provisioning admin tunggal: operator hanya commerce/settings/audit commerce, developer mengelola grants via RPC audited dengan perlindungan developer terakhir. Bootstrap UUID Auth terverifikasi out-of-band, bukan email/metadata; email pengguna hanya informasi belum diverifikasi hosted. Test grant core 1–30 hari hanya developer owner workspace sendiri, tidak partner, bukan pembayaran Lynk. Admin tidak mendapat tenant bypass. Migration 004 belum applied; login dan panel admin tetap tanpa syarat pembelian.

## Batas rollout
Migration baru belum diterapkan. Jangan apply/deploy tahap ini langsung ke produksi: inventaris workspace aktif, kebijakan akses pelanggan lama/backfill disetujui, rehearsal migration, pemeriksaan dua akun hosted serta concurrency PostgreSQL diperlukan. Frontend baru memerlukan schema baru; deploy frontend sendirian membuat load gagal tertutup. Workspace live tidak berubah oleh pekerjaan lokal ini.

## Contoh pengisian dan reset rencana (lokal, belum rilis)
- `Contoh pengisian` tersedia pada onboarding, dashboard kosong, dashboard aktif dan halaman menunggu aktivasi. Disclosure keyboard-accessible menampilkan pasangan/tanggal/anggaran/target tabungan/kontribusi fiktif beserta langkah mengisi budget, tugas dan tamu. Hanya baca: tidak menyalin ke formulir, melakukan seed, atau menyimpan ke cloud. Nominal bukan harga paket.
- `Reset rencana dari nol` untuk owner workspace saja, pada Ringkasan/Pengaturan dan menunggu aktivasi. Bukan reset saat login. Dialog menyebut dampak pada kedua pasangan, daftar data tepat, tidak dapat diurungkan dan kebutuhan backup/persetujuan pasangan. Pengguna harus mengetik tepat `RESET RENCANA`; Batal/Escape tidak menulis. Tombol/pending/error/status aksesibel; state dimuat ulang sesudah RPC.
- RPC `reset_planning_content(uuid,text)` dari migration baru `202610140003_reset_planning_content.sql` menghapus **hanya budgets, tasks, guests, savings_contributions** workspace pemanggil dalam satu transaksi dan mencatat `planning.reset` ke audit. Owner ditentukan lewat UUID auth + membership server, bukan email, entitlement atau role admin; partner/outsider/admin unrelated tidak berhak. Cleanup diizinkan meski entitlement expired, tanpa membuka akses baca/tulis planner lain.
- Tetap disimpan: akun Auth, workspace + nama/tanggal/target, membership, invitations, savings_accounts lama, entitlements, purchase_requests, verified_transactions dan seluruh audit sebelumnya. Tidak memindahkan dana, membatalkan pembelian, atau mengembalikan akses paket. Failure SQL termasuk audit membatalkan seluruh reset.
- Reset bukan kunci permanen penulisan partner. Data baru yang disimpan sesudah transaksi selesai dapat muncul; pasangan perlu sepakat berhenti mengedit. Timeout jaringan dapat terjadi setelah commit: muat ulang sebelum retry, jangan menganggap jaringan gagal berarti delete belum terjadi. State planner lama dibersihkan setelah respons RPC sukses, termasuk saat refresh berikutnya gagal.
- Migration belum applied; ikut gate schema/frontend/backfill/rehearsal yang sama dengan tahap paid/admin. Tes PGlite/transport fixture bukan bukti hosted atau multi-connection concurrency.

## Scope berikutnya
Revocation administratif dan operasi refund, penetapan harga/link resmi Lynk.id oleh pemilik, ekspor/pemulihan ledger, editing target tabungan, review support/legal, lamaran lengkap, honeymoon budgeting lengkap. Otomasi pembayaran hanya setelah kontrak callback/webhook Lynk.id terbukti dan verifikasi server + replay protection + idempotensi diuji.
