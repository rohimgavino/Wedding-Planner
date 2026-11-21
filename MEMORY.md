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

### 5. Batas Sesi Login & Auto-Logout 1 Jam (`session limit`)
* **Durasi Maksimal Sesi:** 1 jam (`SESSION_DURATION_MS = 60 * 60 * 1000` = 3.600.000 ms) terhitung sejak login berhasil.
* **Penyimpanan Status Sesi:** Disimpan di `localStorage` (`pw_session_login_time`, `pw_session_expires_at`, `pw_session_user_id`).
* **Mekanisme Otomatis:**
  1. *Realtime Timer:* `auth-context.tsx` memasang timer timeout presisi dan interval pemeriksaan tiap 10 detik.
  2. *Wake-from-sleep & Tab-focus:* Event listener `visibilitychange` dan `focus` memastikan sesi yang ditinggal tidur / minimasi lebih dari 1 jam langsung mendeteksi kadaluwarsa begitu dibuka kembali.
  3. *Multi-tab Sync:* Event listener `storage` menyinkronkan logout ke seluruh tab yang terbuka.
  4. *Warning State:* Jika sisa waktu <= 5 menit, indikator sesi berubah menjadi badge peringatan amber lembut dan menampilkan bar status peringatan.
  5. *Graceful Auto-Logout:* Mengosongkan data sesi lokal via `signOut({ scope: 'local' })` dan mengarahkan pengguna ke `/login?reason=session_expired`.
  6. *Feedback Visual di Login:* Halaman login menampilkan card info elegan bernuansa Amber/Gold yang menginformasikan bahwa sesi telah selesai dan pengguna dapat masuk kembali dengan Google.
* **Pengujian Mandiri:** Script `scripts/test-session-limit.mjs` dijalankan via `npm run test:session` (8/8 skenario lulus).

### 6. Desain & Arsitektur Tema Undangan 3D Nusantara & Luxury (Katalog 12 Template Lengkap)
* **Prinsip Utama (Bukan Sekadar Ganti Warna):**
  - Setiap template wajib memiliki bentuk fisik pintu 3D, ornamen ukiran, emblem adat/budaya, hiasan sudut (*floral/filigree framing*), pola watermark, bentuk bingkai foto prewedding (*arch frame*), dan istilah prosesi adat yang **berbeda total dan otentik**, bukan sekadar palet warna yang berganti.
* **Katalog 12 Varian Template Pilihan (Tersedia di Dashboard & Preview):**
  1. *Royal Keraton Jawa (`jawa-keraton` / `jawa`):* Daun pintu gebyok kayu jati Jepara relief daun & sulur 3D, Gunungan Wayang Kulit emas, ronce melati gantung, Batik Kawung Truntum, kubah Joglo dobel, istilah *Pawiwahan & Panggih Penganten*.
  2. *Traditional Bugis Pinisi (`bugis-pinisi` / `bugis`):* Daun pintu geometris Saqbe Bugis, siluet megah perahu Pinisi 3D berlayar di atas ombak samudra emas, anyaman kisi Walasoji, koral & mawar maritim, istilah *Mappettuada, Sompa, & Mampacci*.
  3. *Minang Kemilau Songket (`minang-songket` / `minang`):* Daun pintu ukiran bertingkat Pucuk Rebung, siluet atap Gonjong Rumah Gadang, rumbai tenun songket Pandai Sikek, istilah *Akad Nikah & Baralek Gadang*.
  4. *Dewata Sanctuary Bali (`bali-dewata` / `bali`):* Gerbang kembar Candi Bentar batu andesit terbelah 3D, taburan kelopak bunga Kamboja (Frangipani) kuning-putih, ukiran emas prada Bali, Meru suci, istilah *Pawiwahan Suci & Semara Ratih*.
  5. *Sunda Parahyangan (`sunda-siger` / `sunda`):* Pintu bilik anyaman bambu halus dengan lengkung gapura, mahkota Siger Pasundan berhias ronce melati, dedaunan teh hijau segar, istilah *Walimatul Nikah & Sawer Panganten*.
  6. *Batak Royal Ulos (`batak-gorga` / `batak`):* Pintu tiang kayu Rumah Bolon dengan pahatan relief Gorga sakral merah-hitam-putih, tanduk kerbau Sopo Guru, tenun Ulos Sadum berumbai benang emas, istilah *Pamasu-masuon & Ulaon Unjuk*.
  7. *Madinah Arabesque Gold (`islamic-arabesque` / `islamic`):* Gerbang lengkung Moorish Horseshoe Arch, kisi Mashrabiya bintang 8 Andalusia (Girih), siluet Kubah Masjid Nabawi, zamrud emerald & emas, istilah *Walimatul 'Ursy*.
  8. *Classic Ivory & Gold (`classic-ivory` / `ivory`):* Pintu panel Prancis beveled lis emas, stempel segel lilin wax seal monogram, French Rococo Acanthus scroll filigree, istilah *Holy Matrimony & Grand Reception*.
  9. *Sage Garden Botanical (`sage-garden` / `sage`):* Pintu kisi-kisi trellis kayu rustic dengan tanaman rambat, karangan bunga eucalyptus & zaitun mekar, sejuknya pesta kebun outdoor, istilah *Intimate Garden Celebration*.
  10. *Romantic Rose Peony (`romantic-rose` / `rose`):* Gerbang lengkung katedral berteralis mawar & pita sutra, buket mekar English Peony & Rose dusty blush, istilah *Sweet Romantic Evening*.
  11. *Midnight Celestial Gold (`midnight-gold` / `midnight`):* Daun pintu obsidian gelap dengan rasi bintang geometris keemasan, bulan sabit berhias starlight galaxy, istilah *Midnight Starlight Gala*.
  12. *Modern Minimalist Editorial (`monochrome-editorial` / `monochrome`):* Pintu arsitektural kaca fluted modern berhandle kuningan, tipografi majalah high-fashion Vogue, garis presisi kontemporer, istilah *Contemporary Matrimony*.
* **Struktur Halaman Undangan Mewah (*Full-Bleed Scrolling Experience*):**
  1. *3D Door Swing Reveal:* Dua daun pintu berayun membuka 115° secara 3D dengan perspektif 1400px saat tombol *"✨ Buka Undangan ✨"* diklik, disertai kepakan sayap kupu-kupu emas (*fluttering 3D butterflies*) dan partikel bunga.
  2. *Hero Section Kaya Ornamen:* Karangan bunga/filigree di sudut atas, emblem budaya adat, kaligrafi sambung megah berbayang emas berkilau, bingkai foto kubah prewedding, serta Live Countdown Timer 4 Pilar (Hari, Jam, Menit, Detik).
  3. *Profil Kedua Mempelai:* Foto kubah mempelai pria & wanita, nama lengkap bergelar, nama orang tua, dan tombol tautan Instagram.
  4. *Rangkaian Acara:* Kartu kubah ganda dengan tombol 1-klik *"Simpan ke Google Calendar"* dan panduan rute *"Buka Google Maps"*.
  5. *VIP Cashless Digital Envelope:* Kartu ATM eksklusif dengan chip micro emas, nomor rekening timbul, dan tombol salin nomor rekening instan.
  6. *Buku Tamu Doa Restu & RSVP:* Form konfirmasi kehadiran dan kolom doa restu real-time ke Supabase.
  7. *Floating Bottom Navigation Dock:* Menu bar melayang di bawah layar `[🏠 Sampul] [💍 Mempelai] [🗓️ Acara] [🎁 Hadiah] [💌 Ucapan]` untuk navigasi instan antar-seksi.
* **Efisiensi & Performa Mobile:**
  - 0 MB video beban (bebas kuota), 100% murni *GPU-accelerated CSS 3D transforms* (`preserve-3d`, `rotateY`), dan aset vektor SVG tajam di semua layar Retina ponsel.
  - **Status Integrasi:** Efek 3D Door Swing Reveal, ukiran pintu SVG, emblem budaya hero, dan bingkai arch photo kini telah **terintegrasi penuh secara native** di komponen Next.js (`src/components/everrae/public-invitation-view.tsx` & `src/components/everrae/invitation-theme-config.tsx`), serta tetap dapat diuji di file prototype standalone `public/preview-themes.html`.
* **Miniature Preview Thumbnails di Dashboard (`theme-thumbnail.tsx`):**
  - Setiap kartu template di Dashboard dilengkapi thumbnail pratinjau mini visual yang merefleksikan gradasi atmosfer pintu, pola watermark latar, emblem budaya, bingkai kubah foto, dan segel wax seal.
  - Interaksi hover *"👁️ Pratinjau Desain"* yang membuka live preview simulasi secara langsung.
* **Kustomisasi Foto Prewedding & Akun Instagram:**
  - Input URL foto prewedding di Tab 2 (*Data Mempelai*) dengan tombol pilihan cepat (*🌸 Bunga Mewah*, *🏞️ Panorama Danau*) dan kotak pratinjau live langsung di dashboard.
  - Input akun Instagram mempelai pria (`groom_instagram`) & wanita (`bride_instagram`) dengan prefix `@` yang otomatis memunculkan tombol tautan Instagram di kartu profil kedua mempelai pada undangan publik.
* **Pemilih Musik Latar Belakang (Audio Backsound MP3) & Audio Test Player:**
  - Preset audio siap pakai: *🎵 Akustik Pop Romantis*, *🏛️ Gamelan Tradisional Jawa (Sakral)*, *🌴 Rindik Tradisional Bali (Damai)*, *🪕 Gambus & Oud Islami (Syahdu)*.
  - Opsi memasukkan URL audio MP3 kustom dari hosting sendiri.
  - Tombol kontrol Uji Dengar (*Play/Pause*) langsung di dalam dashboard.
* **Skema Database SQL Migration 12 Tema (`202611180002_invitations_extra_columns.sql`):**
  - Memperbarui check constraint tabel `wedding_invitations` dari 4 tema menjadi 12 tema lengkap.
  - Menambahkan kolom `cover_photo_url`, `groom_instagram`, dan `bride_instagram`.

### 7. Arsitektur Paket Pembelian & Pembatasan Hak Akses (Tier Gating)
Tiap paket memiliki hak akses modul yang terisolasi secara ketat dan terverifikasi baik di sisi database (Supabase RLS & entitlements) maupun antarmuka dashboard:

1. **Belum Membayar (Unactivated / Free Workspace):**
   - **Status:** Terkunci total oleh gerbang `WorkspaceActivation` (`!entitlementActive(entitlements, 'core')`).
   - Seluruh tab dashboard ditutup kecuali menu pengaturan / tautan pasangan (`pairing`), dengan arahan aktivasi ke [`/purchase`](https://pocketwedding.id/purchase).
2. **Paket Starter (Rp 49.900 · 6 Bulan Akses Cloud):**
   - **Fitur Terbuka (Unlocked):**
     - Dashboard Ringkasan & Progres Persiapan
     - Timeline & Wedding Checklist (termasuk Berkas KUA)
     - Rundown Hari H (Akad & Resepsi)
     - Master Budget & Pelacakan Pengeluaran
     - Buku Tamu & RSVP WhatsApp (termasuk Export CSV)
     - Undangan Digital 3D (12 Tema Lengkap, Foto Prewedding, Backsound Musik)
     - Tautan Pasangan (Kolaborasi Akun Berdua)
   - **Fitur Terkunci (Locked / Paywall):**
     - 🔒 **Moodboard Visual & Palet Warna:** Berstatus *Mode Pratinjau*. Tombol tambah inspirasi & ganti palet warna dinonaktifkan (Memerlukan paket Premium).
     - 🔒 **Tabungan Bersama Pasangan (`shared-savings.tsx`):** Berstatus *Mode Pratinjau*. Form pencatatan kontribusi dinonaktifkan (Memerlukan paket Premium).
     - 👑 **Lamaran & Seserahan Planner:** Berstatus *Mode Pratinjau*. Form susunan prosesi & checklist seserahan dinonaktifkan (Memerlukan paket Wedding Pro).
     - 👑 **Honeymoon Planner:** Berstatus *Mode Pratinjau*. Form itinerary & pos biaya liburan dinonaktifkan (Memerlukan paket Wedding Pro).
3. **Paket Premium (Rp 79.900 · 1 Tahun Akses Cloud):**
   - **Fitur Terbuka (Unlocked):**
     - Seluruh fitur pada paket Starter.
     - 🔓 **Moodboard Visual & Palet Warna:** Terbuka penuh tanpa batasan.
     - 🔓 **Tabungan Bersama Pasangan:** Terbuka penuh untuk mencatat setoran berdua dan grafik target.
     - Masa aktif 365 hari (12 bulan kalender).
   - **Fitur Terkunci (Locked):**
     - 👑 **Lamaran & Seserahan Planner:** (Khusus Wedding Pro).
     - 👑 **Honeymoon Planner:** (Khusus Wedding Pro).
4. **Paket Wedding Pro (Rp 99.900 · Akses Penuh VIP):**
   - **Semua Fitur Terbuka 100% (Fully Unlocked):**
     - Seluruh fitur Starter & Premium.
     - 🔓 **Engagement / Lamaran Planner:** Terbuka penuh.
     - 🔓 **Honeymoon Planner:** Terbuka penuh.
     - Tanpa banner gembok, tanpa batasan formulir.
5. **Indikator Visual di Menu Dashboard:**
   - Bilah navigasi sidebar menampilkan badge penanda status paket:
     - Badge emas `🔒 Premium` pada tab Moodboard & Tabungan Bersama (jika belum aktif).
     - Badge ungu `👑 Pro` pada tab Lamaran & Honeymoon (jika belum aktif).
   - Bilah pintasan mobile (*shortcuts*) menampilkan dot indikator peringatan amber pada fitur yang memerlukan upgrade tier.

---

### 8. Arsitektur SEO, AI-SEO (GEO), & Schema Markup
* **Robots.txt (public/robots.txt):** Mengizinkan perayap pencarian standar (Googlebot, Bingbot) serta bot pencarian AI (OAI-SearchBot, PerplexityBot, Claude-SearchBot, meta-webindexer) dengan memblokir rute internal privat (/dashboard/, /admin/, /auth/, /onboarding/, /invite/).
* **Sitemap.xml (public/sitemap.xml):** Peta situs XML resmi memuat rute publik kanonikal (/, /purchase, /demo, /u, /u/rohim-wiwit, /legal, dll).
* **AI Machine-Readable Context (public/llms.txt):** Dokumentasi spesifikasi standar LLMs.txt yang merangkum proposisi nilai, fitur utama, rincian paket harga, dan arsitektur teknis agar mudah dibaca oleh agen AI (ChatGPT, Perplexity, Claude).
* **Machine-Readable Pricing (public/pricing.md):** Format harga terstruktur bebas JavaScript untuk autonomous buying agents.
* **Schema.org Structured Data (src/components/JsonLd.tsx):**
  - WebSite: Identitas situs dan nama brand (Pocket Planner / Pocket Wedding).
  - Organization: Profil entitas pengelola resmi (Ahmad Nur Rochim).
  - WebApplication: Kategori aplikasi perencana pernikahan, platform PWA, dan penawaran paket harga Starter, Premium, Wedding Pro.
  - FAQPage: Struktur tanya jawab sesuai tampilan FAQ di halaman beranda.
  - Event (src/app/u/[slug]/page.tsx): Struktur data acara pernikahan untuk halaman undangan digital.
* **Metadata & Canonical URL Tagging:** Seluruh halaman memiliki tag canonical yang valid, OpenGraph lengkap, keywords relevan dengan pernikahan Indonesia, dan direktif obots: { index: false, follow: false } pada halaman private/autentikasi.

---

## 5. Standar Verifikasi & Deployment
Sebelum menyelesaikan sesi atau melakukan commit ke branch `main`, pastikan rangkaian verifikasi berikut lolos 100%:

```bash
# 1. Linting (Wajib 0 error, 0 warning)
npm run lint

# 2. Type Checking TypeScript (Wajib 0 error)
npx tsc --noEmit

# 3. Unit Test Session Limit & Auto-Logout (8/8 lulus)
npm run test:session

# 4. Backend & Supabase RLS Tests (Wajib 20/20 lulus)
npm run test:backend

# 5. Digital Invitation & 12 Theme Integration Tests (Wajib 12/12 lulus)
npm run test:invitation

# 6. Next.js Static Export Build
npm run build

# 7. Cloudflare Workers Deploy
npx wrangler deploy
```

---

## 6. Riwayat Versi & Deployment Produksi
* **Domain Utama:** `https://pocketwedding.id`
* **Edge Worker:** `https://everrae.taarufplanner12.workers.dev`
* **Git Commit Terakhir:** `2b3e9a9` on branch `main` (`origin/main`)
* **Cloudflare Workers Version ID:** `752b1cd1-353b-4432-969f-97038e7d1672`
* **Status Terakhir:** Bersih (*working tree clean*), seluruh test suite lulus 100%, semua halaman static diekspor sempurna.

---

## 7. Preferensi & Catatan Khusus Pengguna (Rohim)
* **Gaya Komunikasi:** Ramah, solutif, to the point, berbahasa Indonesia dengan format GitHub-style markdown.
* **Kerapian & Estetika:** Sangat menyukai detail visual bernilai seni tinggi (perpaduan modern luxury dengan sentuhan tradisional Nusantara seperti Batik Kawung).
* **Keberlanjutan Memori:** AI Agent wajib membaca dokumen ini di awal percakapan dan memperbaruinya setiap kali ada fitur baru atau keputusan desain penting yang disepakati bersama.
