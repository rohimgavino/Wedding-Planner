# Preflight reset password database PocketWedding

Diperiksa 21 Oktober 2026. Canonical: `D:/wedding-planner`; situs `pocketwedding.id`; Supabase `lkudkvjaxdjntjosudni`.

## Keputusan

**Boleh lanjut reset manual dengan caveat:** tidak ditemukan ketergantungan password Postgres pada runtime aplikasi di source/config yang diperiksa. Ini bukan jaminan semua konsumen eksternal aman. Reset mengganti kredensial login database, bukan password akun Supabase, password pengguna aplikasi, atau kunci enkripsi backup. Klien Postgres yang memakai password lama perlu diperbarui; koneksi/reconnect dapat terganggu. Jangan lanjut migrasi/rilis admin sampai backup terenkripsi yang benar-benar dapat dipulihkan tersedia.

## Bukti terverifikasi (read-only)

- `AGENTS.md` dibaca, lalu Graphify query koneksi/password/backup dijalankan sebelum inspeksi source. Hasil graf sebagian terpotong; temuan berikut diverifikasi langsung dari file relevan, bukan disimpulkan dari graf saja.
- `src/lib/supabase/client.ts:1–12`: SDK `@supabase/supabase-js` memakai **hanya** `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Keduanya adalah konfigurasi HTTPS/API browser, bukan username/password Postgres. RPC di `src/lib/cloud-workspace.ts`, `commerce.ts`, dan `admin-sales.ts` berjalan melalui SDK tersebut. Pencarian seluruh source tidak menemukan `DATABASE_URL`, `DIRECT_URL`, `PGPASSWORD`, atau koneksi driver Postgres produksi.
- `next.config.mjs`: `output: "export"`. `wrangler.jsonc:1–11` untuk Worker bernama historis `everrae` hanya mengonfigurasi static assets `./out`; tidak ada `main`, `vars`, Hyperdrive, services, D1, KV, atau R2 binding pada config ini. Tidak mengubah direktori legacy `D:/everrae`.
- Metadata provider: perintah langsung `wrangler secret list --name everrae` berhasil exit 0, hasil `[]` (tidak ada nama Worker secret pada target default config). Percobaan pertama melalui nested shell gagal; percobaan langsung berhasil. Ini tidak menginventaris build variables, environment lain, seluruh Worker/version binding, atau layanan lain.
- Tidak ada `.github/workflows` maupun direktori `.github` pada checkout ini; tidak ada nama CI secret GitHub yang dapat diverifikasi di sini. Inventaris nama dependency tidak menunjukkan driver hosted Postgres; PGlite dipakai untuk pengujian lokal, bukan bukti koneksi hosted.
- **Konsumen password database yang nyata:** `D:/pocketwedding-tools/backup/Check-Database-Connection.cmd:3–10` memakai portable `psql -X -W`, TLS `verify-full`, transaksi read-only dan `SELECT 1`; password dimasukkan pengguna sendiri melalui prompt tersembunyi. Launcher mengosongkan `PGPASSWORD`, bukan menyimpan password.
- `D:/pocketwedding-tools/backup/backup.py:38–43,72–96,127–133`: menolak input noninteraktif; prompt password database terpisah dari kunci backup; password hanya diteruskan di environment proses anak `pg_dump` lalu dibuang dari mapping. Ini tetap melibatkan RAM/environment proses lokal, bukan penyimpanan vault otomatis. Export memerlukan otorisasi terpisah; **tidak dijalankan pada preflight ini**.
- `connection.json` dan `connection.example.json` diperiksa dalam memori: tepat lima nama key `project_ref`, `host`, `port`, `user`, `database`; tidak ada field credential atau URI berpassword. Kedua launcher `.cmd` yang tersedia tidak memiliki assignment `PGPASSWORD` nonkosong atau URI Postgres berpassword. Tidak ada nilai secret dibaca/dicetak; dotenv tidak dibuka.
- Target yang disetujui: session pooler `aws-0-ap-southeast-1.pooler.supabase.com:5432`, database `postgres`, user `postgres.lkudkvjaxdjntjosudni`. TLS chain/hostname sebelumnya sudah lulus dan login tersembunyi pengguna ditolak password menurut konteks operator; **tidak diulang pada inspeksi ini**. README backup masih memuat catatan CA/login lama; jangan menganggap catatan historis itu status terbaru.

## Belum diketahui / batasan

Tidak menginventaris Dashboard integrations, external CI secrets, build variables Cloudflare, Supabase Edge Function secrets, scheduler, BI/ETL, ORM/developer tools, komputer lain, atau konsumen direct/transaction pooler. Pengguna perlu memastikan apakah pernah memasang koneksi Postgres di layanan tersebut dan menyiapkan pembaruan password di sana. Tidak membaca credentials sesi/provider, tidak query data pelanggan, tidak reset/ubah role, export, deploy, atau tes login pada sesi ini.

API key biasanya **tidak berubah akibat reset password database**: aplikasi yang memakai URL/anon apikey tidak perlu mengganti key hanya untuk rotasi ini. Ini bukan bukti semua integrasi eksternal aman. Jangan rotate/invalidate JWT signing key, anon/publishable key, service-role/secret key, atau sesi Auth sebagai bagian reset ini.

## Langkah manual pengguna berikutnya

1. Konfirmasi tidak ada konsumen Postgres eksternal yang belum tercakup; jika ada, catat tempat pembaruannya dan pilih waktu rendah trafik. Siapkan item Bitwarden **baru/terpisah**, misalnya `PocketWedding — Database postgres`; buat password kuat unik, bukan kunci backup.
2. Buka sendiri **https://supabase.com/dashboard/project/lkudkvjaxdjntjosudni/database/settings**. Pastikan project benar, gunakan **Reset database password** di Database → Settings. Masukkan password baru secara privat melalui UI tepercaya dan simpan di Bitwarden. Jangan kirim password/key/screenshot secret di chat. Jangan ubah API keys atau role lain.
3. Tunggu perubahan berlaku. Jalankan sendiri `D:/pocketwedding-tools/backup/Check-Database-Connection.cmd` di console Windows lokal tepercaya; masukkan **password DATABASE baru** pada prompt tersembunyi. Tidak perlu mengedit metadata koneksi atau launcher. Laporkan hanya berhasil/gagal tanpa password. Jika pooler segera memberi `28P01`, tunggu/retry dengan password baru; jangan melakukan reset berulang atau melemahkan TLS. Teks launcher lama yang melarang reset adalah guard historis, bukan otorisasi reset otomatis.
4. Perbarui hanya konsumen Postgres yang memang memakai login tersebut; periksa login/read aplikasi secara normal dan monitor error. Tidak perlu redeploy frontend hanya karena password database berubah.
5. Setelah login berhasil, minta otorisasi terpisah untuk backup terenkripsi dan uji pemulihan terisolasi. Rotasi sukses sendiri belum membuka gate rilis admin.

Referensi resmi: [reset password database](https://supabase.com/docs/guides/troubleshooting/how-do-i-reset-my-supabase-database-password-oTs5sB) (Database → Settings; shared pooler dapat sementara menolak setelah rotasi), [API keys](https://supabase.com/docs/guides/api/api-keys). Halaman reset diverifikasi melalui hasil pencarian dokumentasi resmi; extractor halaman tidak tersedia pada backend sesi ini.
