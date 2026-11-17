# MEMORY.md — Wedding Planner PWA (Pocket Planner)
> **Single Source of Truth & Persistent Memory Context**
> File ini berisi riwayat keputusan arsitektur, desain, fitur, standar kode, dan preferensi pengguna agar Antigravity dan AI Agent lainnya selalu sinkron ("selalu nyambung") antar-sesi percakapan tanpa perlu alat eksternal seperti Obsidian.

---

## 1. Ikhtisar Proyek & Visi
* **Nama Produk:** Pocket Planner (Wedding Planner PWA)
* **Domain / Live URL:** `https://pocketwedding.id`
* **Target Pengguna:** Pasangan calon pengantin di Indonesia yang menginginkan kolaborasi perencanaan pernikahan yang intim, rapi, terstruktur, dan elegan.
* **Prinsip Utama:**
  1. *Mobile-First & PWA:* Sangat ringan, bisa di-install di layar utama ponsel, ramah kuota.
  2. *Collaborative Shared Workspace:* Satu workspace dapat diakses bersama oleh calon mempelai pria & wanita secara real-time.
  3. *Zero-Cost Base (Free-Tier Friendly):* Memaksimalkan static export di Cloudflare Workers dan Supabase free-tier sebelum scaling berbayar.
  4. *Privasi & Keamanan Ketat:* Data antar pasangan terisolasi penuh dengan Supabase Row-Level Security (RLS).

---

## 2. Tech Stack & Infrastruktur
* **Frontend:** Next.js 15 (App Router, Static Export `output: 'export'`), React 18, Tailwind CSS, Lucide React icons.
* **Edge & Hosting:** Cloudflare Workers via Wrangler (`wrangler.jsonc`).
  - Deploy command: `npx wrangler deploy`
  - Output folder: `out/`
* **Database & Realtime:** Supabase PostgreSQL dengan Row-Level Security (RLS) berbasis `workspace_id` dan otentikasi role (`owner`, `partner`, `collaborator`).
* **Pembayaran:** Integrasi DOKU / Mayar untuk paket premium (Fitur Pro & Lifelong Access).

---

## 3. Brand Identity & Design System

### A. Palet Warna Resmi
* **Deep Forest Green (`#203D32` / `#162C24`):** Warna utama brand (kewibawaan, ketenangan, keabadian alam, dan keanggunan).
* **Royal Champagne Gold (`#C6AA78` / `#DFBA73` / `#E8D5B0`):** Aksen mewah, segel lilin (*wax seal*), badge countdown, pilar indikator aktif, chip kartu debit digital.
* **Romantic Rose / Peach (`#BD5D75` / `#FBEAEB` / `#D48B9B`):** Sentuhan romantis, bunga mawar, kasih sayang, dan kehangatan keluarga.
* **Sage Mist Green (`#E2ECE6` / `#CBDCD2`):** Latar belakang halus penyeimbang kontras.
* **Warm Alabaster / Ivory (`#FAF8F5`):** Kanvas dasar yang bersih namun tidak menyilaukan (lebih hangat dari putih murni).

### B. Motif Budaya Indonesia
* **Batik Kawung Truntum Watermark (`public/images/batik-kawung.svg`):**
  - Vektor SVG autentik berukuran ringan (~2 KB) dengan kontur canting malam bertitik halus.
  - Membawa filosofi Jawa: Kawung (kemurnian dan umur panjang) + Truntum (cinta kasih yang bersemi kembali dan abadi).
  - Diterapkan sebagai latar belakang transparan berulang (*seamless pattern*) dengan opasitas lembut (2% – 5%) pada:
    1. Shell Dashboard (`.planner-shell`)
    2. Admin Portal (`.pw-admin`)
    3. Undangan Publik (`public-invitation-view.tsx`)

### C. Elevasi Card & Interaksi Visual
* Menghindari card yang datar/pucat (*flat washed-out*).
* Menggunakan tactile elevations: `box-shadow: 0 4px 16px rgba(32, 61, 50, 0.04)`.
* Efek hover dinamis: `transform: translateY(-2px)` dengan bayangan lembut keemasan.
* Border bertingkat menggunakan transisi lembut (`border-emerald-900/10` ke `border-[#C6AA78]/40`).

---

## 4. Fitur-Fitur Utama yang Telah Diimplementasikan

### 1. Undangan Digital Royal Luxury (`/u/[slug]` e.g. `/u/rohim-wiwit`)
* **Cover Segel Lilin Kerajaan (Royal Wax Seal):**
  - Tampilan amplop mewah dengan segel monogram emas timbul (*embossed gold seal*).
  - Interaksi klik "Buka Undangan" membuka amplop secara sinematik dengan musik instan.
* **Interactive Vinyl Music Controller:**
  - Piringan hitam berputar (*turntable vinyl disk*) dengan jarum gramofon.
  - Widget mengambang di sudut layar bawah dengan kontrol Play/Pause, indikator beat, dan judul lagu romantis.
* **Floating Bottom Pill Navigation:**
  - Navigasi mengambang berbalut kaca buram (*glassmorphism pill*) dengan tab: Cover, Acara, Kisah Cinta, Hadiah & RSVP.
* **Integrasi Google Calendar:**
  - Tombol 1-klik "Simpan ke Kalender" yang mengenerate URL Google Calendar resmi dengan tanggal, lokasi, dan deskripsi acara lengkap.
* **VIP Cash Gift Debit Card:**
  - Kartu amplop digital bermotif kartu debit VIP hitam-emas lengkap dengan microchip emas dan tombol "Salin Nomor Rekening" instan dengan feedback visual.
* **Love Story (Kisah Cinta):**
  - Timeline vertikal estetik bertahap: Pertama Bertemu, Mengikat Janji, Menuju Pelaminan.
* **Quick RSVP & Doa Restu:**
  - Pilihan konfirmasi kehadiran chip cepat (Hadir, Ragu-ragu, Berhalangan) dan buku tamu doa restu real-time.

### 2. Animated Collapsible Sidebar Menu
* **Desktop Mode:**
  - Tombol toggle `PanelLeftClose` dan `PanelLeftOpen` di header.
  - State `sidebarCollapsed` yang menggeser menu keluar layar dengan animasi smooth `translateX(-100%)` dan memperlebar ruang kerja konten dari `margin-left: 242px` ke `0`.
* **Mobile Mode:**
  - Tombol hamburger membuka spring slide-in drawer dengan backdrop blur.
* **Indikator Aktif:**
  - Menu aktif memiliki *golden vertical pillar indicator* di sisi kiri dan highlight warna hijau pinus bergradasi.
  - Transisi hover staggered cascade saat menu dibuka.

### 3. Modul Ruang Perencanaan (Dashboard)
* **Master Budget (Anggaran & Biaya):**
  - 4-Pilar KPI Card dengan garis indikator atas berwarna:
    - Dialokasikan: Sapphire Blue
    - Terpakai: Emerald Sage
    - Sisa Anggaran: Forest Green
    - Selisih / Overbudget: Amber Warning
  - Pengatur penundaan jadwal (delay shifter) untuk estimasi arus kas.
* **Timeline & Checklist:** Rencana tugas bertahap dari H-12 bulan hingga Hari H.
* **Rundown Hari H:** Jadwal menit demi menit untuk panitia, vendor, dan keluarga.
* **Moodboard Visual:** Galeri inspirasi busana, dekorasi, palet warna, dan fotografi.
* **Lamaran & Seserahan:** Manajemen barang bawaan hantaran, vendor sangjit/lamaran.
* **Honeymoon Planner:** Itinerari liburan bulan madu, tiket pesawat, dan akomodasi.
* **Tabungan Bersama:** Catatan setoran tabungan bersama pasangan untuk transparansi finansial.
* **Pengaturan & Pasangan:** Tautan undangan pasangan (*shared token*), sinkronisasi cloud, reset workspace aman.

### 4. VIP & Tester Allowlist Bypass
* **Daftar Email Terdaftar:** `setiarama1997@gmail.com`
* **Mekanisme Bypass:**
  - Fungsi helper `isTesterBypassEmail` di `src/lib/auth-policy.ts`.
  - Otomatis membuka gate aktivasi (`WorkspaceActivation` / paywall) di `src/app/dashboard/page.tsx`.
  - Menginjeksi `developerTestAccess = true` dan synthetic entitlements (`core`, `wedding_pro`) pada `CloudWorkspace.load` dan `WorkspaceContext.tsx`.
  - Memberikan status aktif di `/purchase` tanpa perlu melakukan checkout pembayaran riil.
* **Cakupan Akses:** Bebas mengecek dan menguji seluruh modul: Dashboard KPI, Master Budget, Timeline & Checklist, Rundown Hari H, Moodboard Visual, Lamaran & Seserahan, Honeymoon Planner, Tabungan Bersama, dan Undangan Digital.

---

## 5. Standar Verifikasi & Deployment
Sebelum menyelesaikan sesi atau melakukan commit ke branch `main`, pastikan rangkaian verifikasi berikut lolos 100%:

```bash
# 1. Linting (Wajib 0 error, 0 warning)
npm run lint

# 2. Type Checking TypeScript (Wajib 0 error)
npx tsc --noEmit

# 3. Backend & Supabase RLS Tests (Wajib 20/20 lulus)
npm run test:backend

# 4. Next.js Static Export Build
npm run build

# 5. Cloudflare Workers Deploy
npx wrangler deploy
```

---

## 6. Preferensi & Catatan Khusus Pengguna (Rohim)
* **Gaya Komunikasi:** Ramah, solutif, to the point, berbahasa Indonesia dengan format GitHub-style markdown.
* **Kerapian & Estetika:** Sangat menyukai detail visual bernilai seni tinggi (perpaduan modern luxury dengan sentuhan tradisional Nusantara seperti Batik Kawung).
* **Keberlanjutan Memori:** AI Agent wajib membaca dokumen ini di awal percakapan dan memperbaruinya setiap kali ada fitur baru atau keputusan desain penting yang disepakati bersama.
