# Product Requirements Document (PRD) — Tahap 1 (MVP)
## Proyek: Wedding Planner & Collaborative Couple Workspace (PWA)

* **Versi Dokumen:** 1.0 (MVP / Tahap 1)
* **Status:** Siap Pengembangan (Ready for Dev)
* **Target Rilis Tahap 1:** 4 – 6 Minggu
* **Inspirasi Referensi:** `app-meettomarry.com/?nav=weddingkit` (adaptasi untuk pasar pasangan muda Indonesia)
* **Model Aplikasi:** Mobile-First Web App & Progressive Web App (PWA)

---

## 1. Ringkasan Eksekutif & Latar Belakang (Executive Summary)

Perencanaan pernikahan di Indonesia terkenal rumit, memakan waktu 3–12 bulan, dan melibatkan banyak pihak (kedua mempelai, keluarga besar, serta vendor). Masalah utama calon pengantin saat ini:
1. **Pemisahan Informasi:** Anggaran di Excel, catatan vendor di WhatsApp, to-do list di Google Keep/kertas, dan daftar tamu berserakan di spreadsheet.
2. **Kurangnya Kolaborasi Berdua:** Salah satu mempelai sering merasa terbebani sendirian karena tidak ada platform bersama yang transparan dan sinkron real-time antar HP.
3. **Budget Jebol (Overbudget):** Sulit memantau realisasi pengeluaran riil terhadap target tabungan dan plafon anggaran per kategori.

### Solusi Tahap 1 (MVP)
Aplikasi PWA sederhana, elegan, ringan, dan fokus:
* **"Nikahnya Berdua, Planning-nya Juga"** — Ruang kerja bersama (*Shared Workspace*) di mana calon mempelai pria dan wanita terhubung ke satu dasbor pernikahan.
* Data tersinkronisasi real-time antar perangkat HP tanpa perlu install aplikasi native dari App Store / Play Store.
* Gratis digunakan mandiri, dengan fokus utilitas murni: Tabungan, Budgeting, Checklist Waktu, Dokumen Nikah KUA, dan Manajemen Tamu dengan Generator Tautan WhatsApp.

---

## 2. Sasaran & Metrik Keberhasilan (Goals & KPIs)

### 2.1 Sasaran Bisnis & Produk Tahap 1
1. **Validasi Kebutuhan:** Pasangan benar-benar aktif menginput data (minimal 10 tugas checklist dan 20 daftar tamu).
2. **Keterlibatan Pasangan (Pairing Rate):** >50% pengguna yang mendaftar mengundang pasangannya ke workspace.
3. **Efisiensi Biaya Operasional:** Biaya server Rp 0 (atau <Rp 70.000/bulan) pada 1.000 pengguna pertama memanfaatkan Supabase Free Tier + Cloudflare Pages.

### 2.2 Metrik Kunci (KPIs)
* **Aktivasi:** Pengguna menyelesaikan onboarding, menetapkan tanggal pernikahan & target anggaran.
* **Kolaborasi:** Pasangan kedua bergabung via invite link/kode dalam 48 jam.
* **Retensi Harian/Mingguan:** Setidaknya ada 2–3 update status checklist atau pos anggaran per minggu hingga tanggal H.

---

## 3. Ruang Lingkup Tahap 1 vs Tahap Selanjutnya

### ✅ Dalam Ruang Lingkup (Tahap 1 / MVP)
1. **Autentikasi & Akun:** Login Google dan Email OTP/Magic Link (Supabase Auth).
2. **Couple Pairing (Shared Workspace):**
   * Pembuat workspace (Partner 1) dapat mengundang pasangan (Partner 2) via email atau tautan pairing unik.
   * Kedua akun membaca dan mengedit data workspace yang sama secara real-time.
3. **Dashboard Ringkasan (Overview):**
   * Countdown Hari H (Hari Pernikahan).
   * Progress Bar Tabungan (Terkumpul vs Target).
   * Progress Bar Anggaran (Terpakai vs Alokasi Maksimal).
   * Status Penyelesaian Checklist Persiapan (%).
4. **Modul Keuangan (Tabungan & Budgeting):**
   * Tracker Pos Tabungan (Target bersama & saldo pos rekening per bank/e-wallet).
   * Alokasi Anggaran per Kategori (Venue, Katering, MUA/Busana, Dekorasi, Foto/Video, Souvenir/Undangan, Lain-lain).
   * Pencatatan Pengeluaran Riil (Actual Expense) + Status Pembayaran (Belum DP, Sudah DP, Lunas).
5. **Modul Tugas & Timeline (To-Do Checklist):**
   * Template checklist default terstruktur berdasarkan waktu (H-6 Bulan, H-3 Bulan, H-1 Bulan, H-2 Minggu, Hari H).
   * Checklist Persyaratan Dokumen Nikah Resmi KUA / Catatan Sipil.
   * Penugasan PIC tugas (Pria / Wanita / Bersama).
6. **Modul Buku Tamu (Guest List & WhatsApp RSVP):**
   * Input nama tamu, kategori (Keluarga, Kantor, Sahabat, VIP), dan perkiraan jumlah orang (Pax).
   * Status RSVP (Pending / Hadir / Berhalangan).
   * Generator link pesan WhatsApp langsung (`wa.me/...`) untuk mengirim undangan / reminder tanpa biaya API.
   * Export daftar tamu ke format Excel / CSV.
7. **PWA Standar:**
   * Web manifest, icon, service worker offline fallback dasar, dan popup "Tambahkan ke Layar Utama (Add to Home Screen)".

### ❌ Dikeluarkan dari Tahap 1 (Ditunda ke Tahap 2)
* Marketplace/katalog direktori vendor eksternal & booking berbayar langsung.
* Payment gateway otomatis (Midtrans/Xendit) — Tahap 1 pairing workspace digratiskan atau memakai aktivasi manual.
* Pembuat website undangan digital interaktif (Wedding Landing Page / Web Undangan Tamu).
* Upload foto seserahan & berkas media ukuran besar (cukup catatan teks & link URL).

---

## 4. Persona Pengguna

1. **Rian (Calon Pengantin Pria, 27 th):**
   * Perhatian utama: Disiplin finansial, transparansi total biaya, dan timeline vendor agar tidak mendadak.
   * Kebutuhan: Tahu berapa sisa tabungan yang harus disetor bulan ini dan apa tugas berikutnya yang menjadi tanggung jawabnya.
2. **Dina (Calon Pengantin Wanita, 25 th):**
   * Perhatian utama: Kelengkapan detail acara, berkas KUA, daftar tamu keluarga & teman kantor, serta rundown acara.
   * Kebutuhan: Aplikasi estetik, mudah diakses di HP, tidak ribet buka laptop, dan pasangan bisa melihat to-do list yang sama.

---

## 5. Rincian Kebutuhan Fungsional (Functional Requirements)

### 5.1 Onboarding & Pairing Pasangan
* **FR-01:** Pengguna dapat mendaftar menggunakan Akun Google atau Email.
* **FR-02:** Pengguna pertama membuat "Wedding Workspace" baru dengan menginput:
  * Nama Panggilan Kedua Mempelai (Contoh: "Rian & Dina")
  * Tanggal Acara Pernikahan (Wedding Date)
  * Target Total Anggaran Pernikahan (Target Budget)
* **FR-03:** Pengguna dapat meng-generate **Undang Pasangan (Invite Partner Link)** yang berisi token unik masa aktif 7 hari.
* **FR-04:** Pasangan yang membuka tautan undangan langsung terhubung ke workspace yang sama setelah login.

### 5.2 Dashboard Utama
* **FR-05:** Menampilkan header sambutan, nama pasangan, dan hitung mundur `[X] Hari Menuju Hari Bahagia`.
* **FR-06:** Kartu metrik ringkas: Total Tabungan Terkumpul, Total Anggaran Terpakai vs Sisa, dan Persentase Tugas Selesai.
* **FR-07:** Widget "Tugas Penting Terdekat" yang memunculkan to-do list berstatus belum selesai dalam tenggat waktu terdekat.

### 5.3 Modul Budget & Tabungan
* **FR-08:** Pengguna dapat membuat pos tabungan (contoh: Rekening BCA Bersama, Tabungan Bank Jago, E-wallet) beserta target dan saldo saat ini.
* **FR-09:** Sistem menyediakan kategori anggaran default (Venue, Katering, Rias/MUA, Busana, Dokumentasi, Hiburan, Souvenir, Cincin/Mahar, Lain-lain) yang dapat ditambah/diedit.
* **FR-10:** Untuk setiap pos anggaran, pengguna dapat mencatat:
  * Alokasi Anggaran (Estimated Budget)
  * Realisasi Pengeluaran (Actual Cost)
  * Catatan Termin Pembayaran (Nominal DP, Sisa Pelunasan, Tanggal Jatuh Tempo)
  * Bukti/Catatan (Teks/URL)
* **FR-11:** Indikator visual otomatis (*Warning Alert*) jika pengeluaran riil melebihi anggaran yang dialokasikan.

### 5.4 Modul Checklist Persiapan & Berkas KUA
* **FR-12:** Sistem otomatis men-generate checklist standar saat workspace dibuat:
  * Persyaratan Berkas Nikah KUA (Surat N1-N4, Surat Sehat/Puskesmas, Foto background biru, Paspor/KTP).
  * Tahapan persiapan per timeline waktu (H-6 bulan, H-3 bulan, H-1 bulan, H-1 minggu, Hari H).
* **FR-13:** Pengguna dapat menambahkan, mengubah, menghapus, dan menandai centang (selesai) pada setiap tugas.
* **FR-14:** Penugasan PIC: Tugas dapat dialokasikan ke "Pria", "Wanita", atau "Bersama".

### 5.5 Modul Manajemen Tamu & WhatsApp RSVP
* **FR-15:** Tabel daftar tamu dengan kolom: Nama Tamu, Kategori (Keluarga Pria, Keluarga Wanita, Rekan Kerja, Sahabat), Jumlah Tamu (Pax: 1/2/keluarga), dan No. WhatsApp.
* **FR-16:** Status RSVP: `Belum Dikontak`, `Terkirim`, `Konfirmasi Hadir`, `Tidak Hadir`.
* **FR-17:** Tombol **"Kirim Pesan WhatsApp"**:
  * Menggunakan skema URL `https://api.whatsapp.com/send?phone=[NOMOR]&text=[PESAN_TEMPLATE]`.
  * Template pesan otomatis menyisipkan Nama Tamu, Nama Pasangan, dan Tanggal Acara.
  * Membuka langsung aplikasi WhatsApp di HP pengguna tanpa memotong pulsa/kredit API pihak ketiga.
* **FR-18:** Tombol **"Export ke CSV/Excel"** untuk mengunduh seluruh daftar tamu dan rekap jumlah pax yang hadir.

---

## 6. Kebutuhan Non-Fungsional (Non-Functional Requirements)

1. **Mobile-First & Responsiveness:** Desain antarmuka 100% dioptimalkan untuk rasio layar smartphone (360px – 430px lebar), namun tetap bersih dan nyaman dibuka di desktop/tablet.
2. **Performa Kecepatan:** First Contentful Paint (FCP) < 1.5 detik, PWA installable, ukuran bundle awal < 300KB gzip.
3. **Keamanan & Isolasi Data (RLS):** Data antar pasangan terisolasi ketat menggunakan Supabase Row Level Security (RLS). Pengguna A & B hanya dapat membaca dan menulis data di `workspace_id` mereka sendiri.
4. **Offline Capability Dasar:** Service worker menyimpan cache aset visual dan shell halaman agar app tetap bisa dibuka meski koneksi internet tidak stabil.
5. **Kepatuhan Biaya (Zero Infra Cost Target):** Menggunakan Supabase Free Plan (database <500MB) dan Cloudflare Pages (tanpa batas request bandwidth) untuk meminimalkan beban operasional.

---

## 7. Skema Database Inti (PostgreSQL / Supabase Schema)

### Tabel `workspaces`
* `id` (UUID, Primary Key)
* `title` (TEXT, contoh: "Pernikahan Rian & Dina")
* `wedding_date` (DATE)
* `target_budget` (BIGINT, default 0)
* `target_savings` (BIGINT, default 0)
* `created_at` (TIMESTAMPTZ)

### Tabel `workspace_members`
* `id` (UUID, Primary Key)
* `workspace_id` (UUID, Foreign Key -> workspaces.id)
* `user_id` (UUID, Foreign Key -> auth.users.id)
* `role` (TEXT: 'owner', 'partner')
* `display_name` (TEXT)
* `created_at` (TIMESTAMPTZ)

### Tabel `invitations`
* `id` (UUID, Primary Key)
* `workspace_id` (UUID, Foreign Key -> workspaces.id)
* `token` (TEXT, UNIQUE)
* `invited_email` (TEXT)
* `status` (TEXT: 'pending', 'accepted', 'expired')
* `expires_at` (TIMESTAMPTZ)

### Tabel `budgets`
* `id` (UUID, Primary Key)
* `workspace_id` (UUID, Foreign Key -> workspaces.id)
* `category` (TEXT)
* `allocated_amount` (BIGINT, default 0)
* `spent_amount` (BIGINT, default 0)
* `payment_status` (TEXT: 'unpaid', 'dp', 'paid')
* `notes` (TEXT)

### Tabel `tasks`
* `id` (UUID, Primary Key)
* `workspace_id` (UUID, Foreign Key -> workspaces.id)
* `title` (TEXT)
* `phase` (TEXT: 'H-6 Bulan', 'H-3 Bulan', 'H-1 Bulan', 'H-1 Minggu', 'Hari H', 'KUA Dokumen')
* `pic` (TEXT: 'groom', 'bride', 'both')
* `is_completed` (BOOLEAN, default false)
* `due_date` (DATE)

### Tabel `guests`
* `id` (UUID, Primary Key)
* `workspace_id` (UUID, Foreign Key -> workspaces.id)
* `name` (TEXT)
* `category` (TEXT: 'keluarga_pria', 'keluarga_wanita', 'teman', 'vip', 'lainnya')
* `pax` (INTEGER, default 1)
* `phone` (TEXT)
* `rsvp_status` (TEXT: 'uncontacted', 'sent', 'attending', 'declined')
* `notes` (TEXT)

---

## 8. Jadwal Pelaksanaan & Milestone Tahap 1

* **Minggu 1:** Setup Repository, UI Kit (Tailwind + Shadcn/Radix), Supabase Auth & RLS Schema.
* **Minggu 2:** Modul Onboarding, Workspace Creation, dan Alur Pairing Pasangan (Invite Link Token).
* **Minggu 3:** Modul Finansial: Budgeting, Pos Tabungan, dan Pencatatan Biaya Real-time.
* **Minggu 4:** Modul Checklist Tugas, Timeline, dan Berkas KUA.
* **Minggu 5:** Modul Buku Tamu (Guest List), Filter Status, WhatsApp Click-to-Chat, dan Export CSV.
* **Minggu 6:** Testing PWA (Android/iOS Add-to-Home), audit performa/keamanan, bug fixing, dan peluncuran MVP.
