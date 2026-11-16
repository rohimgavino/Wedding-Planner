# Owner Decision Brief: Cutoff & Refund Policy Options — 20261117

## 1. Context & Problem Statement

Berdasarkan analisis konkurensi (`s2-applicability-20261116-owned/REPORT.md`) dan kontrak transaksi rilis (`transaction-and-concurrency-contract-20261117.md`), aplikasi `PocketWedding` saat ini beroperasi dengan model **satu faktur per satu commit RPC** (`1-invoice-per-RPC`).

Terdapat gap kebijakan terkait skenario **Revokasi Massal (Bulk Cutoff)** dan **Pengembalian Dana (Refund)**:
1. Jika operator menjalankan revokasi massal pada entitas legacy (`UPDATE public.workspace_entitlements SET revoked_at = now()`), trigger `revoke_core_settlements` menembakkan `INSERT SELECT` atas pemukiman (`package_settlements`) yang sudah terlihat pada saat snapshot transaksi itu dibaca.
2. Karena sifat MVCC PostgreSQL, transaksi webhook DOKU (`doku_apply_notification`) yang sedang berjalan bersamaan (in-flight) dapat melakukan commit sesaat setelah revokasi berjalan, sehingga hak akses pemukiman baru tersebut tetap aktif.
3. Transaksi batch multi-faktur tidak memiliki jaminan bebas deadlock (40P01) bila digabungkan dalam satu koneksi database tanpa protokol urutan global (`invoice ascending`).

---

## 2. Pilihan Kebijakan untuk Owner (Owner Decision Options)

### Pilihan A (Direkomendasikan — Sesuai Kontrak Terpasang):
**Revokasi Eksklusif Berbasis Faktur Tunggal (Single-Invoice Revocation Only)**

- **Mekanisme**:
  - Revokasi hak akses dan refund hanya dieksekusi per-faktur menggunakan RPC resmi:
    `public.revoke_package_settlement(p_invoice text, p_reason text)`.
  - Tidak mengekspos endpoint atau script DML massal arbitrary.
  - Jika terdapat pembatalan/refund untuk beberapa faktur, operator/worker memprosesnya melalui perulangan terpisah (*loop of separate commits*), di mana setiap faktur memiliki transaksi terisolasi.
- **Kelebihan**:
  - 100% selaras dengan *Transaction and Concurrency Contract 20261117*.
  - Terbukti lolos uji 23/23 skenario konkurensi tanpa deadlock.
  - Audit trail yang sangat rapi di tabel `public.package_settlement_revocations` (tercatat alasan spesifik dan timestamp per faktur).
- **Konsekuensi**:
  - Operator tidak boleh melakukan `UPDATE workspace_entitlements` massal secara langsung di database produksi tanpa prosedur maintenance terisolasi.

---

### Pilihan B (Ekstensi Arsitektur Masa Depan):
**Sistem Pembekuan Workspace Global (Workspace-Level Suspension Guard)**

- **Mekanisme**:
  - Menambahkan kolom status pembekuan pada tabel induk `public.workspaces`:
    `is_suspended BOOLEAN DEFAULT FALSE`, `suspended_at TIMESTAMPTZ`.
  - Fungsi verifikasi kapabilitas `has_workspace_capability_v1` memeriksa:
    `NOT EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = p_workspace_id AND w.is_suspended = true)`.
  - Fungsi reservasi `doku_reserve_order` dan notifikasi `doku_apply_notification` menolak order baru jika workspace dalam status *suspended*.
- **Kelebihan**:
  - Memberikan tombol darurat instan (*kill switch*) satu langkah untuk mematikan seluruh hak akses workspace tanpa harus melacak setiap faktur historis.
- **Konsekuensi**:
  - Membutuhkan migrasi DDL baru pada tabel `workspaces` dan pembaruan fungsi inti `has_workspace_capability_v1`.
  - Berada di luar cakupan rilis kandidat saat ini (memerlukan siklus uji regresi tambahan).

---

## 3. Rekomendasi Langkah

1. **Owner menyetujui Pilihan A** untuk rilis saat ini: mengukuhkan batas kontrak per-faktur dan mengecualikan revokasi massal ad-hoc dari sistem produksi.
2. Kebijakan Refund yang telah dimasukkan ke dalam halaman `/legal#refund` (7 hari garansi sebelum penggunaan modul vendor/undangan aktif) diproses secara operasional melalui `revoke_package_settlement`.
