# Panduan AI Agent — Wedding Planner PWA

Dokumen ini adalah Standard Operating Procedure (SOP) bagi AI Agent (Hermes, Claude Code, Codex, Antigravity) saat membaca, menguji, atau mengembangkan modul di repositori Wedding Planner.

---

## 1. Prinsip Utama Proyek
1. **Fokus Tahap 1 (MVP):** Utamakan kesederhanaan, kecepatan akses di mobile (PWA), kolaborasi berdua (*shared workspace*), dan nol biaya operasional (*free-tier first*).
2. **Pemisahan Project:** Repositori dan database Wedding Planner terisolasi penuh dari DiengHub, AZBOLOGY, dan KasPilot. Jangan mencampur token, secret, schema, atau antrean tugas.
3. **Mobile-First Experience:** Semua komponen UI wajib diuji pada ukuran layar ponsel (360px – 430px) sebelum dianggap selesai.
4. **Keamanan Data Pasangan:** Seluruh query ke tabel bersama wajib memanfaatkan Supabase RLS dengan validasi `workspace_id`. Tidak boleh ada query bypass yang membahayakan privasi pengguna lain.

---

## 2. Standar Workflow Graphify (Wajib di Setiap Project)

Graphify adalah alat pemetaan graf dependensi untuk menghemat token dan menjaga pemahaman arsitektur yang akurat.

### Saat Sesi Baru Dimulai:
1. Periksa keberadaan folder `graphify-out/`.
2. Baca `graphify-out/GRAPH_REPORT.md` untuk memahami arsitektur umum dan file inti (*god nodes*).
3. Hanya buka file spesifik yang berhubungan langsung dengan tugas yang sedang dikerjakan.

### Setelah Mengubah Kode / Menambah Fitur:
1. Sinkronkan graf proyek dengan menjalankan perintah berikut di terminal:
   ```bash
   graphify update .
   ```
2. Pastikan file `graphify-out/graph.json` dan `graphify-out/GRAPH_REPORT.md` diperbarui bersamaan dengan commit fitur:
   ```bash
   git add graphify-out/graph.json graphify-out/GRAPH_REPORT.md
   git commit -m "chore(graph): sync graphify after [nama modul]"
   ```

---

## 3. Aturan Coding & Arsitektur
* **Framework:** Next.js (App Router), TypeScript, Tailwind CSS.
* **Format Penamaan:** `kebab-case` untuk file komponen dan utilitas (contoh: `budget-summary.tsx`, `whatsapp-helper.ts`).
* **Format Angka & Mata Uang:** Gunakan `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })` untuk seluruh nominal uang.
* **Integrasi WhatsApp:** Selalu gunakan format URL `api.whatsapp.com/send` atau `wa.me/` murni tanpa API berbayar.
