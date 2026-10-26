# Pindah komputer — Wedding Planner / Everrae

Paket ini adalah snapshot file lokal, termasuk perubahan yang belum di-commit.
Source, public assets, migrasi Supabase, skrip, docs, Graphify, dan dokumen tim disertakan.
Riwayat .git, node_modules, build/cache, security-evidence, supabase/activation,
dan file environment/credential lokal TIDAK disertakan.
Beberapa nilai konfigurasi yang cocok dengan .env lokal telah disamarkan.
Ini bukan backup data Supabase atau data browser/localStorage.

## Menjalankan di komputer baru
1. Instal Node.js LTS yang kompatibel dengan Next.js 15 (disarankan Node 22) dan Git.
2. Ekstrak ZIP, lalu buka terminal di folder Wedding-Planner.
3. Jalankan `npm ci`.
4. Salin `.env.example` menjadi `.env.local`; isi konfigurasi dari dashboard
   Supabase melalui saluran pribadi. Jangan kirim secret ke grup/chat publik.
5. Jalankan `npm run dev`, lalu buka http://localhost:3000.
6. Verifikasi dengan `npm run lint` dan `npm run build`.

Backend Supabase tetap berada di cloud dan tidak ikut ZIP.
Jangan menerapkan ulang migrasi ke database produksi tanpa memeriksa statusnya.
Login GitHub, Cloudflare, dan Supabase perlu dilakukan ulang pada komputer baru.

## Git
Riwayat Git tersedia pada https://github.com/rohimgavino/Wedding-Planner .
Untuk mempertahankan riwayat: clone repo ke folder terpisah lalu salin isi snapshot
ke clone tersebut (termasuk dotfiles, jangan menghapus .git milik clone).
File lokal bisa lebih baru daripada GitHub. Jangan menimpa snapshot dengan clone lama.

## Catatan
Paket diverifikasi integritas ZIP dan hash file, bukan diuji build ulang.
Baca README.md, AGENTS.md, docs/, dan team-docs/ sebelum melanjutkan pengembangan.
