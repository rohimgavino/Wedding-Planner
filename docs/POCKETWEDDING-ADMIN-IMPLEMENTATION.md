# PocketWedding — implementasi admin lokal (21 Oktober 2026)

## Hasil dan batas
- Satu proyek kanonis `D:/wedding-planner`, nama PocketWedding, domain pilihan `pocketwedding.id`. Tidak mengubah DNS/deployment. `D:/everrae` tetap legacy dan tidak disentuh. Perbandingan dua UI/UX ditangani terpisah; tidak merge/redesign/rebrand publik, mengganti storage key, atau menghapus desain/data.
- `/admin` mempertahankan gaya layout/form yang sudah ada. Identitas dan metadata khusus admin diperbarui. AuthGate + `site_role()` backend tetap otoritas; tidak ada identitas hardcoded, localStorage admin flag, atau service key browser. Missing role/schema gagal tertutup. Developer/operator dan last-developer safeguard tetap backend.
- Admin melihat ringkasan permintaan historis, pencarian ID workspace/request, filter status, audit append-only 100 terbaru, serta roster/hak admin dan grant uji milik sendiri khusus developer. Semua mutasi UI meminta konfirmasi native sebelum RPC; Batal tidak mengirim RPC. Penolakan wajib alasan, gagal mempertahankan input, sukses hanya setelah RPC dan reload terotorisasi.
- RPC baru read-only `admin_workspace_overview(limit,offset)` mengembalikan UUID workspace, jumlah anggota dan expiry/status entitlement core historis. Paging UI 50; SQL limit 1–100, offset 0–100000. Tidak mengembalikan nama pasangan, email/telepon, tanggal nikah, isi planner atau auth account data. Tidak memberi akses planner lintas tenant. Role dicek setiap invocation; ordinary/anon/revoked ditolak.
- Status `unentitled/expired/revoked/active` adalah **entitlement pembayaran historis**, bukan akses efektif planner saat expand (belum paid enforcement), bukan status DOKU, bukan grant uji developer. Halaman menjelaskan batas ini. Tidak mengarang customer count/revenue.
- Paket informasi Rp250.000 / **1 tahun / satu workspace pasangan**. Satu tahun kalender belum dipetakan ke schema durasi lama berbasis hari: tidak otomatis menganggap 365 hari. DOKU **belum terintegrasi**. Admin tidak punya form Lynk/sales-enable/verify-paid. Commerce menolak sales-enable dan verify sebelum network. Tidak mengganti label schema Lynk menjadi DOKU palsu.

## Bukti eksekusi aktual
Semua dari repo kanonis, bukan hosted. Logs permanen `docs/admin-evidence/`.
- TDD RED `test-pocketwedding-admin.cjs`: Missing expected rejection saat jalur aktivasi lama masih terbuka; GREEN setelah blok client dan penghapusan form legacy.
- TDD RED `test-pocketwedding-overview.mjs`: function admin_workspace_overview does not exist; GREEN setelah migration additive. Mencakup operator baca/no planner access, ordinary+anon+revoked denial, pagination invalid, expiry/revoke/active.
- Browser RED: heading Workspace & masa akses belum ada; GREEN setelah wiring RPC/UI. `browser.log`: PASS role denial/revocation, overview, DOKU pending, filter, penolakan cancel/error/retained reason/success, developer visibility, no overflow **360/390/430/1280**. Seluruh request eksternal diintersep; hanya fixture.supabase.co diizinkan dan di-fulfill lokal; service worker blocked. Screenshot fixture permanen `admin-360.png`, `admin-390.png`, `admin-430.png`, `admin-1280.png`. Ini bukti UI/transport, bukan hosted JWT/persistensi/transaksi.
- `checks.log`: pocketwedding-admin PASS; overview SQL PASS; commerce contract PASS; developer frontend contract PASS; admin-expand 3 grouped scenarios PASS; admin SQL **10 PASS**; developer SQL **7 PASS**; baseline backend **20 PASS**; lint max-warnings 0 PASS; tsc --noEmit PASS.
- `fixture-build.log`: Next 15.5.27 build PASS 13 static pages. `real-build.log`: default/real-config build PASS 13 static pages. Env hanya dipindah namanya sementara (tidak dibaca), dikembalikan dalam finally. Export fixture dihapus sebelum rebuild default. Tidak ada fixture export tersisa di out. Build default tidak membuktikan auth/schema hosted aktif.
- `graphify update .` final: 755 nodes / 1013 edges / 86 communities, AST-only, zero LLM; 37 unsupported files skipped dan labels berubah, docs semantic belum di-refresh. Snapshot graph otomatis dipertahankan. `git diff --check` PASS dengan warning LF/CRLF saja.
- Tidak ada server preview ditinggalkan: browser memakai server loopback ephemeral selama test. Untuk preview default lokal, gunakan perintah README; tanpa login/operator/schema yang sesuai `/admin` memang akan menolak. Jangan upload out untuk memperlihatkan fixture.

## File persis pekerjaan ini
Diubah (incremental, tidak reset dirt):
- `README.md`
- `src/app/admin/page.tsx`
- `src/lib/commerce.ts`
- `scripts/test-commerce.cjs` (kontrak verifikasi lama direkonsiliasi menjadi DOKU pending; parser/request legacy masih diuji)
Baru:
- `src/app/admin/layout.tsx`
- `supabase/migrations/202610210001_admin_workspace_overview.sql`
- `scripts/test-pocketwedding-admin.cjs`
- `scripts/test-pocketwedding-overview.mjs`
- `scripts/test-pocketwedding-admin-browser.py`
- `scripts/verify-pocketwedding-admin.py`
- laporan ini dan `docs/admin-evidence/{checks.log,browser.log,fixture-build.log,real-build.log,admin-360.png,admin-390.png,admin-430.png,admin-1280.png}`
- `backups/pocketwedding-admin-20261021-153041/` snapshot nonsecret permanen sebelum edit, termasuk admin/commerce/README dan manifest SHA256; test-commerce disalin sebelum edit. File layout publik/package/manifest yang dicadangkan tidak diubah. Backup bukan backup DB/credentials.
- Output/cache/snapshot Graphify berubah oleh update; dirt graph lama tidak dihapus. Jangan commit backup/evidence/out tanpa review allowlist.

## Blocker terpisah sebelum penggunaan nyata
1. Belum apply migration additive baru maupun stage lama, belum provision siapa pun atau assign operator. Perlu approval schema rollout, verified Auth UUID melalui kanal tepercaya, bootstrap developer out-of-band audited dan operator grant yang disetujui. Jangan menebak email/role atau meminta credentials di chat. DB yang hanya foundation akan gagal tertutup dan perlu rollout terkoordinasi.
2. Existing stage migrations/RPC sales/reset/paid enforcement **tidak diaktifkan**. Stage SQL masih menyimpan rancangan Lynk dan verify RPC legacy; SQL sales gate tetap false by default, dibuktikan test expand. Blok client bukan boundary keamanan. DOKU memerlukan desain server+webhook/idempotensi/replay/verified payment dan revisi schema tersendiri, tidak dikerjakan sekarang.
3. Overview read-only additive memperluas metadata operasional secara eksplisit tetapi tidak membership/RLS planner. Admin tidak mengedit anggota/customer Auth, expiry atau entitlement langsung karena belum ada RPC aman yang mendukung. Tidak membuat grant pembayaran/expiry palsu.
4. Existing privileged mutation/role revocation concurrency belum direhearsal native independent PostgreSQL connections. PGlite serial bukan bukti race safety; existing stage grant/settings/verification lock protocol masih gate sebelum rilis. Backup/restore DB dan hosted two-account/device/auth/cache juga belum dibuktikan.
5. Suite browser historis `test-admin-browser.py`/`test-admin-expand-browser.py` mengharapkan form Lynk/settings UI lama dan belum direkonsiliasi; untuk scope terbaru gunakan `test-pocketwedding-admin-browser.py`. Tidak mengklaim seluruh suite historis lulus. UI `/purchase` publik lama sengaja tidak didesain ulang; masih rancangan stage legacy di luar scope admin dan harus direkonsiliasi sebelum penjualan. SQL gate melarang pembelian stage sebelum deliberate activation.
6. Belum membandingkan divergent desain sibling pada pekerjaan ini; jangan menganggap semua perbedaan sudah dipindahkan. Parent menangani hasil audit read-only terpisah. Tidak commit/stage/push/deploy/hosted write/provision/DNS atau membaca isi .env.
