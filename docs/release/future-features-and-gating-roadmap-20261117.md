# Future Features & Capability Gating Roadmap — 20261117

## 1. Overview & Current Status

Dokumen ini memetakan status implementasi, pembatasan hak akses (*capability gating*), dan peta jalan (*roadmap*) untuk fitur-fitur masa depan PocketWedding:
1. **Savings Gating (`shared_savings`)**
2. **Moodboard & Digital Invitation (`moodboard`, `digital_invitation`)**
3. **Honeymoon & Engagement Planner (`honeymoon`, `engagement`)**

---

## 2. Feature Capability & Gating Matrix

| Fitur / Modul | Capability Key di S2 | Status Database (RLS) | Status UI / Frontend | Ketersediaan Paket |
|---|---|---|---|---|
| **Tabungan Bersama (Shared Savings)** | `shared_savings` | **Aktif & Terlindungi**: RLS pada `savings_accounts` dan `savings_contributions` menolak penulisan jika capability tidak dimiliki. | **Tersedia**: Komponen `SharedSavings` di tab navigasi `savings`. Menampilkan ringkasan dan form kontribusi. | Tersedia di paket **Premium**, **Wedding Pro**, dan seluruh order historis (Core Legacy). Dibatasi pada paket Starter baru (Starter = 6 bulan, tanpa savings). |
| **Moodboard Visual** | `moodboard` | **Tercakup dalam S2**: Hak kapabilitas telah dibekukan dalam `package_order_terms.benefits` untuk tier `premium` & `wedding_pro`. | **Placeholder / Terkunci**: Belum dibuka sebagai route publik aktif. | Direncanakan aktif untuk **Premium** & **Wedding Pro**. |
| **Undangan Digital (Digital Invitation)** | `digital_invitation` | **Tercakup dalam S2**: Hak kapabilitas telah dibekukan dalam `package_order_terms.benefits`. | **Placeholder / Terkunci**: Integrasi builder undangan terpisah. | Direncanakan aktif untuk **Premium** & **Wedding Pro**. |
| **Engagement / Lamaran Planner** | `engagement` | **Tercakup dalam S2**: Hak kapabilitas dibekukan dalam `package_order_terms.benefits` untuk tier `wedding_pro`. | **Ditampilkan Terkunci di Dashboard**: Komponen `Modul mendatang` memberi label *"Lamaran · Terkunci (Add-on berbayar mendatang)"*. | Direncanakan khusus **Wedding Pro**. |
| **Honeymoon Budgeting** | `honeymoon` | **Tercakup dalam S2**: Hak kapabilitas dibekukan dalam `package_order_terms.benefits` untuk tier `wedding_pro`. | **Ditampilkan Terkunci di Dashboard**: Komponen `Modul mendatang` memberi label *"Honeymoon Budgeting · Terkunci (Add-on berbayar mendatang)"*. | Direncanakan khusus **Wedding Pro**. |

---

## 3. Mekanisme Gating di Level Frontend & Backend

1. **Backend (Database & RLS Level - Authoritative)**:
   - Akses RLS tabel planner dilindungi fungsi PostgreSQL:
     ```sql
     public.has_workspace_capability_v1(workspace_id, 'shared_savings')
     ```
   - Pengguna dengan paket Starter baru yang mencoba mengirimkan form `savings_contributions` akan ditolak secara mutlak oleh RLS dengan kode error `42501 (insufficient_privilege / row-level security policy violation)`.
2. **Frontend (UI Level - UX Guard)**:
   - Di `dashboard/page.tsx`, modul masa depan ditampilkan secara transparan di bawah `<section aria-label="Modul mendatang">`.
   - Pasangan dapat melihat fitur yang akan datang tanpa menimbulkan ekspektasi keliru bahwa fitur tersebut sudah dapat dibeli atau digunakan saat ini.

---

## 4. Rencana Rilis Bertahap (Roadmap)

1. **Rilis Saat Ini (Release Candidate 20261117)**:
   - Integritas S2 stabil (1-invoice-per-RPC).
   - Core Planner MVP lengkap (Timeline, Checklist, Budgeting, Buku Tamu).
   - Tabungan Bersama aktif bagi pemilik hak `shared_savings`.
   - Modul lanjutan terkunci dengan aman.
2. **Tahap Selanjutnya (Next Milestone)**:
   - Membangun skema tabel spesifik untuk `moodboard` (media assets, color palette storage).
   - Membangun skema `digital_invitations` (slug unik, RSVP form publik).
   - Membuka akses navigasi dashboard setelah pengujian e2e selesai.
