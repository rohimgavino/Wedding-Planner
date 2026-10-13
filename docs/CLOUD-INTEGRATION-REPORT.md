# Integrasi auth dan workspace cloud — lokal, belum rilis

## Hasil implementasi
- Google OAuth memakai Supabase JS singleton, PKCE, callback client `/auth/callback` yang berhasil diekspor statis. Code ditukar eksplisit; identity divalidasi lewat `getUser`; URL callback dibersihkan; tujuan redirect hanya dashboard/onboarding/invite dengan token valid. Error callback ditampilkan tanpa mencetak credential/code/token.
- AuthProvider memvalidasi sesi, mengikuti auth events tanpa deadlock callback, menghapus UI private saat sign-out/account berubah. AuthGate membungkus onboarding/dashboard/invite. Konfigurasi kosong/placeholder/secret/service-role gagal tertutup. Logout scope local memutus sesi perangkat ini.
- Tidak ada demo bypass, email-local bypass, atau fast-track onboarding. CTA mulai di homepage/navigation/footer/demo dihapus, bukan diganti nama. Log In tetap ada; showcase demo tetap terpisah dan fiktif.
- WorkspaceContext tidak lagi membaca data rencana lokal sebagai state aktif, menulis localStorage, membuat ID/token sendiri, atau mengisi demo records. CloudWorkspace mengakses tabel RLS untuk workspace/members/budgets/tasks/guests, menambahkan workspace_id eksplisit dan filter tenant untuk update/delete, allowlist writable fields. CSV import menggunakan satu bulk INSERT setelah persetujuan.
- Create menggunakan `create_workspace(p_title,p_wedding_date)`; metadata nama/target disimpan lewat update authorized terpisah. Pairing menggunakan `create_partner_invitation(p_workspace_id)` / `accept_partner_invitation(p_token)`, bukan direct membership/invitation writes. Bearer disimpan di memory UI saja; tidak ditampilkan di invite landing dan tidak di-log. Issuance owner/capacity UI dibantu membership; DB RPC tetap otoritas.
- Legacy key tetap utuh; hanya deteksi keberadaannya dan pemberitahuan bahwa data tidak diunggah otomatis. Tidak ada import otomatis/deletion lokal.
- Refresh cloud setelah write, saat focus, dan setiap 30 detik. Ini polling, BUKAN realtime subscription. Responsive styles lama dipertahankan.

## Bukti eksekusi
- `node scripts/test-cloud.cjs`: PASS kontrak redirect/config/callback, signed-out denial, tenant-scoped CRUD/immutable IDs, bulk insert, secure RPC dan error rejection. Harness menjalankan TS produksi via transpile; Supabase transport disubstitusi test double, bukan backend hosted.
- RED yang benar-benar diamati sebelum production helper dibuat: ENOENT `src/lib/auth-policy.ts`; kemudian GREEN suite helper cloud. Tidak semua React flow mempunyai checkpoint RED vertikal tersendiri; browser coverage ditambahkan setelah implementasi. Jangan menyebut ini strict TDD penuh untuk seluruh React integration.
- `npm run test:backend` / `scripts/test-backend.mjs`: 20 SQL PostgreSQL/PGlite test PASS (foundation yang sudah ada dipertahankan).
- `node scripts/test-guest-csv.cjs`, `node scripts/test-workspace-storage.cjs`: PASS regression.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`: PASS; Next 15.5.27 menghasilkan route statis termasuk callback.
- `python scripts/test-auth-browser.py`: PASS exported real UI pada 360/390/430px, tanpa config: gate tertutup, Google disabled, CTA login-only, tidak ada form bypass, legacy utuh, callback error URL dibersihkan. Menggunakan Edge Chromium karena default Playwright Chromium belum terinstall.
- `NEXT_PUBLIC_SUPABASE_URL=https://fixture.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_fixture npm run build` kemudian `python scripts/test-auth-configured-browser.py`: PASS browser dengan transport fixture lokal: signed-out redirect, Google authorize PKCE URL, cloud rendering/reload, acceptance RPC, logout/UI clear, legacy retained, geometry 390px. Fixture ditandai tegas sebagai mock; bukan bukti Google/GoTrue/hosted CRUD nyata. Build default dikembalikan setelah fixture test.
- `git diff --check`: PASS setelah blank line EOF dibersihkan. Existing CRLF git warnings tidak mengubah hasil.
- `graphify update .`: AST-only; graph/report/html diperbarui. Changed docs tidak diindeks semantik; unsupported files dan community labels perlu refresh.

## Blocker dan batas verifikasi
- Tidak ada env Supabase nyata yang ditulis; default build gagal tertutup. Parent harus memasang hanya URL project + public anon/publishable key (bukan service role), lalu rebuild. Google secret tidak dibaca/dicetak.
- Migration hosted belum diterapkan; sebelum itu secure RPC tidak tersedia. Tidak ada deploy/push/commit, hosted migration, Google login interaktif, atau hosted write pada pekerjaan ini.
- Parent perlu memverifikasi Supabase Site URL dan allowed redirect `https://wedding-planner-a8z.pages.dev/auth/callback` (beserta query tujuan yang digunakan), login Google user sesungguhnya, dua akun/perangkat, CRUD persist reload, pairing/replay/expired token dan tenant isolation di PostgREST. Callback PKCE harus diselesaikan di browser yang memulai login.
- PGlite tidak menguji JWT/GoTrue/PostgREST ataupun multi-session concurrency. Native database concurrent acceptance tetap release gate seperti report foundation.
- Create RPC atomic workspace+owner, tetapi metadata update tidak atomic dengan RPC: kegagalan update dapat meninggalkan workspace blank yang sudah sah dibuat. Perlu desain RPC metadata/idempotency lanjutan bila ingin jaminan all-or-nothing onboarding. Jangan retry create membabi buta.
- Tidak ada workspace switcher; latest visible workspace dipilih setelah reload penuh. Savings UI terpisah belum ada, payment entitlement, profiles, export/import legacy, delete/owner transfer, RSVP publik dan rate limit tetap di luar scope.
- Salinan pemasaran/legal lama masih mempunyai pernyataan prototype lokal yang perlu audit copy terpisah sebelum rilis. Tidak membuat klaim sync instan/realtime terverifikasi.
