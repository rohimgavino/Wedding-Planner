# Aturan & Konteks Antigravity — Pocket Wedding Planner

Selamat datang di repositori Pocket Planner (`https://pocketwedding.id`).

## 1. Aturan Memori & Kontinuitas Sesi (Wajib)
1. **Baca Memori Proyek:** Di awal setiap sesi atau saat memulai tugas baru, periksa file [MEMORY.md](file:///C:/Users/MSI/program/Wedding-Planner/MEMORY.md). File tersebut berisi rekam jejak lengkap keputusan arsitektur, estetika visual, riwayat fitur, dan preferensi pengguna (Rohim).
2. **Perbarui Memori:** Jika terjadi perubahan besar, penambahan fitur baru, atau keputusan desain baru, perbarui `MEMORY.md` agar konteks percakapan di masa depan selalu bersambung secara otomatis.

---

## 2. Identitas Visual & Panduan Desain
* **Palet Warna:**
  - **Forest Green (`#203D32`):** Warna utama, maskulin-elegan, tenang.
  - **Champagne Gold (`#C6AA78` / `#DFBA73`):** Aksen mewah, segel lilin (*wax seal*), badge countdown, border aktif.
  - **Romantic Rose / Peach (`#BD5D75` / `#FBEAEB`):** Sentuhan romantis, kasih sayang, kehangatan.
  - **Alabaster / Ivory (`#FAF8F5`):** Background kanvas utama.
* **Tekstur Budaya:** Gunakan watermark Batik Kawung Truntum (`public/images/batik-kawung.svg`) secara halus dan transparan pada background dashboard dan undangan publik.
* **Elevasi Card:** Hindari tampilan card yang terlalu datar atau washed-out. Berikan bayangan halus (`box-shadow: 0 4px 16px rgba(32, 61, 50, 0.04)`) dan efek hover yang tactile.

---

## 3. Aturan Teknis & Batasan
1. **Next.js Static Export:** Proyek ini menggunakan `output: 'export'`. Jangan menggunakan fitur server-side runtime Next.js yang tidak kompatibel dengan static export (seperti `getServerSideProps` atau dynamic runtime API routes di Cloudflare Workers tanpa konfigurasi edge).
2. **Supabase RLS:** Semua query tabel wajib divalidasi dengan `workspace_id` dan mematuhi RLS.
3. **Format Mata Uang:** Seluruh nominal wajib menggunakan `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`.

---

## 4. Standar Validasi Sebelum Selesai
Setiap selesai mengedit kode, wajib menjalankan:
1. `npm run lint` — ESLint bebas error dan warning.
2. `npx tsc --noEmit` — Type-check TypeScript bebas error.
3. `npm run test:backend` — Seluruh tes SQL RLS lulus.
4. `npm run build` — Build static export lulus tanpa kendala.
