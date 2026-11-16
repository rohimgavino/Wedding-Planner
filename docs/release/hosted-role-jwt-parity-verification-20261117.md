# Hosted Role & JWT Parity Verification — 20261117

## 1. Overview & Objective

Release Gate **Hosted Role / JWT Parity** memverifikasi bahwa model otorisasi, peran basis data (*database roles*), dan penanganan token JWT pada lingkungan *Hosted Supabase* (Cloud) selaras 100% dengan lingkungan uji *offline* PGlite.

Uji ini memastikan:
1. Tidak ada ketergantungan pada UUID sintetis (`00000000-0000-0000-0000-000000000001`) di lingkungan produksi.
2. Penanganan `auth.uid()` oleh PostgREST dan Supabase Auth (GoTrue) berfungsi identik dengan kontrak lokal.
3. Hak istimewa peran (`anon`, `authenticated`, `service_role`) mematuhi prinsip *least privilege*, khususnya isolasi mutlak tabel pemukiman S2 (`package_order_terms`, `package_settlements`).
4. Bootstrap akun developer/operator pertama di `public.site_admins` dilakukan dengan UUID otentik dari `auth.users`.

---

## 2. Paritas Matriks Peran & Izin

| Database Role | PostgREST Claim (`role`) | Hak Akses Schema & RLS | Akses Tabel S2 (`package_settlements`, `package_order_terms`) | RPC Yang Diizinkan |
|---|---|---|---|---|
| `anon` | `anon` | Terikat RLS; hanya data publik (landing, legal, info paket) | **DENIED** (Revoked All) | RPC publik saja |
| `authenticated` | `authenticated` | Terikat RLS; CRUD hanya pada workspace tempat user menjadi anggota | **DENIED** (Revoked All) | `create_workspace`, `accept_partner_invitation`, `has_workspace_capability_v1`, dll. |
| `service_role` | `service_role` | `BYPASSRLS`; akses backend internal untuk Worker DOKU | **DENIED** dari direct table DML (Revoked All). Hanya dapat menulis lewat RPC aman. | `doku_apply_notification`, `canonical_settle_locked`, `revoke_package_settlement` |

---

## 3. Verifikasi JWT Claim & `auth.uid()`

Di lingkungan Supabase Hosted:
- PostgREST secara otomatis mengekstrak claim `sub` dari JWT Bearer header dan memasukkannya ke konfigurasi sesi:
  `request.jwt.claim.sub` dan `request.jwt.claims`.
- Fungsi `auth.uid()` mengembalikan UUID pengguna:
  ```sql
  CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
    SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  ```
- **Parity Check**:
  - `auth.uid()` wajib menghasilkan `NULL` jika dipanggil tanpa header `Authorization` (peran `anon`).
  - `auth.uid()` wajib menghasilkan UUID valid jika dipanggil dengan header `Authorization: Bearer <valid_token>`.
  - Fungsi keamanan `SECURITY DEFINER` (seperti `s2_freeze_order`, `doku_apply_notification`) wajib menggunakan `SET search_path = ''` untuk mencegah *search_path hijacking*.

---

## 4. Prosedur Bootstrap Admin/Developer di Hosted Supabase

Di lingkungan hosted baru, tabel `public.site_admins` belum memiliki pengguna:
1. Pengguna developer utama mendaftar secara normal melalui aplikasi web / auth UI Supabase (email + password / OTP).
2. Dapatkan UUID otentik dari tabel `auth.users`:
   ```sql
   SELECT id, email, created_at FROM auth.users WHERE email = 'admin@pocketwedding.id';
   ```
3. Lakukan bootstrap manual satu kali via SQL Editor Dashboard Supabase (dengan hak superuser postgres):
   ```sql
   INSERT INTO public.site_admins (user_id, role)
   VALUES ('<AUTHENTIC_UUID_FROM_AUTH_USERS>', 'developer')
   ON CONFLICT (user_id) DO NOTHING;
   ```
4. Verifikasi peran aktif:
   ```sql
   SELECT public.site_role(); -- Mengembalikan 'developer' saat dijalankan oleh user bersangkutan
   ```
5. Trigger `protect_last_developer` akan secara otomatis mencegah penghapusan akun developer terakhir.

---

## 5. Script Verifikasi Otomatis (`scripts/verify-hosted-role-jwt-parity.mjs`)

Gunakan berkas `scripts/verify-hosted-role-jwt-parity.mjs` untuk menjalankan suite verifikasi peran dan JWT secara lokal sebelum deploy, atau arahkan ke koneksi hosted dengan parameter env `DATABASE_URL`.
