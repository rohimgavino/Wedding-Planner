# Staged rollout paid / admin / reset

> Update lanjutan: lihat `ADMIN-EXPAND-REPORT.md` untuk identitas hosted terverifikasi, inventory terbaru **2 workspace test sendiri/operator**, refactor pending SQL additive tanpa locks/reset EXECUTE, isolated paket 001/002/004 dan hasil test. Bagian audit historis di bawah (3 workspace/grandfather belum ditentukan/original001 mengunci) bukan status implementasi terbaru. Hosted apply/provision/deploy tetap belum approved.

Tanggal audit: 14 Oktober 2026. **Tahap 1 selesai untuk audit lokal + inventory read-only; belum siap apply/deploy.** Target hanya `D:/wedding-planner`, Supabase `lkudkvjaxdjntjosudni` (wedding-planner), Worker `everrae`, akun Cloudflare `4c9d871a80b70e0c2275773bcd51db84`, domain `pocketwedding.id`. `D:/everrae` bukan target.

Tidak ada apply migration, SQL bisnis hosted write, provisioning, reset pelanggan, commit/push/deploy. CLI query memakai Management API login tersimpan dan transaksi `BEGIN READ ONLY`; CLI mencetak `Initialising login role` sebagai setup internal akses. Tidak menjalankan perintah provisioning role sendiri. `.env.local` tidak dibaca/dicetak/disalin/staged; build standar memuatnya seperti biasa. Jangan deploy `out` canonical yang baru dibangun: itu berisi fitur pending.

## Bukti baru yang diverifikasi

- HEAD canonical tetap `a26c615`; released UI baseline `2de765a48bb9b3a6535e466755f53442eef1ae8c` tersedia lokal dan merupakan descendant HEAD. Commit rilis hanya mengubah `src/app/dashboard/dashboard.css` dan `src/components/InstallPwaBanner.tsx`. `git diff --quiet 2de765a -- <kedua file>` exit 0: working files **sudah identik** dengan UI rilis. Dengan demikian patch UI produksi sudah terintegrasi secara konten, tanpa menimpa perubahan paid/admin/reset. Branch pointer tidak digeser pada audit ini.
- `supabase projects list --output json`: satu project linked wedding-planner, ACTIVE_HEALTHY, region ap-southeast-1, PostgreSQL 17.11.0.003. Inventory query lewat `supabase db query --linked` berhasil, tidak perlu secret melalui chat.
- Hosted migrations hanya `202610120001`. Ada **3 workspace, 3 membership, 3 owner, 0 partner**, orphan workspace 0. Budgets/tasks/guests/savings_accounts masing-masing 0 pada snapshot audit. Workspace kosong tetap merupakan pelanggan/tenant existing; jangan menganggap boleh dikunci atau dihapus.
- Hosted `workspace_entitlements` dan `site_admins` belum ada; RPC site_role/reset_planning_content/has_workspace_entitlement/set_site_admin belum ada, paid restrictive policies 0. RLS aktif pada keenam tabel foundation yang diperiksa. Inventory agregat tidak membuktikan seluruh policy benar atau identitas developer.
- Eksekusi nyata lokal: baseline **20**, paid **9**, admin **10**, reset **5**, developer **7** SQL tests PASS (**51 total**, PGlite). Cloud/commerce/savings/developer UI/CSV/storage contract suites PASS. `npm run lint` PASS max-warnings 0. `npm run build` PASS Next 15.5.27, 13 static pages, TypeScript check termasuk build. `git diff --check` PASS, hanya warning konversi LF/CRLF.
- Browser fixture lama ada di laporan modul, **tidak direrun pada audit ini**. Tidak mengklaim test hosted dua akun, Lynk asli, restore backup, race native PostgreSQL atau deploy baru.

## Temuan release-blocking

1. **001 mengunci existing workspace.** `202610140001_workspace_entitlements_savings.sql:19–31,49–50` langsung menambahkan restrictive entitlement checks tanpa backfill. Ketiga workspace hosted tidak punya entitlement. Jangan jalankan 001 sendiri, bahkan dengan sales disabled.
2. **Grant nonpayment legacy belum tersedia.** Paid table memerlukan provider Lynk/reference dan 002 memasukkan semuanya ke registry transaksi. Developer test grant hanya own developer-owner, tidak partner/pelanggan. Keduanya bukan jalur grandfather pelanggan. Menulis `LEGACY`, `LOCAL-ONLY` atau ref fiktif sebagai Lynk bukan solusi.
3. **Frontend pending tidak bisa dirilis sendiri.** `src/lib/cloud-workspace.ts:24–26` selalu memuat ledger/entitlement + RPC developer; hosted saat ini belum punya schema tersebut. Guard dashboard juga hanya memahami paid/test grant; grant legacy baru harus ikut kontrak snapshot/guard, bukan hanya SQL.
4. **Tahap admin terpisah belum dipaketkan.** 002 bergantung 001; 004 bergantung 002. 003 bukan prasyarat logis 004, tetapi urutan file sekarang akan memasangnya lebih dahulu. Menyembunyikan tombol reset tidak mencabut EXECUTE RPC reset. Release runner/schema/feature gates harus dirancang agar reset benar-benar tertahan sampai tahapnya.
5. **Concurrency belum terbukti.** PGlite single-session membuktikan SQL/atomic rollback serial, bukan banyak koneksi. Review statis menemukan role/settings/payment check sebelum row lock pada RPC commerce; test-grant mengecek developer sebelum workspace lock dan revoke tanpa workspace lock. Perlu putuskan semantik revocation/in-flight serta native races; jangan menyebut role revocation langsung membatalkan transaksi yang sudah berjalan. Tidak ada exploit hosted yang diuji.

## Tahap 1 — database safety, legacy strategy, admin bootstrap (prepare dahulu)

### Preservasi Git dan baseline

- Jangan reset/discard/stash massal, `git add -A`, force-push, atau merge dirty tree secara spekulatif. Pertahankan seluruh pending 001–004 dan file unrelated.
- Untuk implementasi/release berikutnya, buat worktree scratch baru **di 2de765a**, bukan a26c615. Transfer delta reviewed terhadap 2de765a secara allowlist termasuk untracked feature files; tidak mengikutsertakan `.env.local`, `.temp`, graph caches, security dirt. Kedua file UI sudah sama baseline sehingga tidak perlu patch ulang.
- Sebelum tindakan, manifest/hash semua modified/untracked nonsecret file + binary backup lokal terkontrol. Bandingkan setelah transfer; canonical HEAD/dirty tetap utuh. Isolated worktree UI rilis existing bukan tempat menumpuk full feature pending.
- Canonical HEAD baru boleh diselaraskan kemudian lewat prosedur approved dengan backup + compare full pending snapshot; konten UI saat ini sudah benar, tidak perlu menggeser pointer sekarang untuk audit.

### Desain eksplisit grandfather (usulan, BELUM SQL diimplementasikan)

Pemilik harus menyetujui **periode/jam expiry**, cutoff cohort, komunikasi pelanggan dan siapa approver. Tidak ada default 30/90 hari maupun indefinite. Rekomendasi mekanisme, bukan keputusan bisnis:

- Tabel grant terpisah `legacy_workspace_grants`: immutable UUID grant, workspace FK, feature hanya core, source tetap `legacy_grandfather`, `starts_at`, **expires_at NOT NULL dan lebih besar starts_at**, revoked_at, approved_by verified Auth UUID, approval_ticket, reason, cutoff/cohort identifier, created_at. Tidak ada payment_reference/provider Lynk. Simpan riwayat/audit perubahan, jangan overwrite ledger atau registry commerce.
- Cohort berasal dari inventory operator pada cutoff tersetujui; insert hanya UUID workspace existing manifest, termasuk workspace kosong. Tidak dari email/sign-up/client metadata. Snapshot ulang sesaat sebelum perubahan agar workspace baru selama audit tidak terlewat; freeze singkat pembuatan workspace atau definisikan inclusion cutoff secara eksplisit.
- Hak efektif: `is_workspace_member(ws) AND (paid active OR core legacy active OR own developer test active)`. Legacy berlaku **owner + partner anggota**, bukan semua admin; expiry/revoke menutup akses SQL. Add-on tidak ikut. Tidak memberi hak tenant lain. Public mutation/claim RPC tidak ada; hanya trusted out-of-band audited transaction. SELECT tenant scoped atau exact STABLE effective-access RPC; update dashboard/cloud types/fixtures agar legacy valid tidak terlihat terkunci.
- Grandfather tidak memperpanjang expiry paid, tidak membuat purchase request, tidak mengisi verified_transactions, tidak dianggap pendapatan. Paid renewal tetap menghitung paid expiry sendiri. Bila grant legacy lebih panjang, UI harus menjelaskan sumber akses dan expiry efektif tanpa menjualnya sebagai pembayaran.
- Sebelum locking policies terlihat oleh traffic, grant manifest harus lengkap dan effective-access function mengenali legacy. Rehearsal membuktikan owner/partner cohort dapat CRUD sebelum/sesudah, new unentitled tidak ikut legacy, expiry/revoke, outside tenant denied, malformed/missing approval denied, retry backfill tidak memberi durasi ekstra, audit rollback. Jangan membuat interval lock antara commit 001 dan grant patch setelahnya.

### Runner / rehearsal / bootstrap

- Pilih expand-contract release: schema/commerce/roles ditambahkan dahulu dengan enforcement **belum aktif**; baru paid RLS di tahap 3. Karena migration pending belum hosted, split/refactor pending migrations boleh diusulkan, tetapi harus direview + dites ulang dengan runner/history manifest exact. Jangan mengubah foundation applied. Jangan mengandalkan UI flag untuk enforcement atau rollback database.
- Alternatif bundle atomic original 001–004 + legacy cukup untuk preserve cohort, tetapi mengaktifkan paid/new-user dan reset terlalu dini; bukan rollout admin-only yang diminta. Pilih expand-contract sebelum eksekusi.
- Migration memiliki BEGIN/COMMIT sendiri. Jangan membungkus file mentah dengan BEGIN luar: inner COMMIT dapat mematahkan atomicity. Runner harus secara eksplisit mengelola batas transaksi + migration history dan dites di clone native PG17. Tidak ada `supabase db push` sekarang.
- Backup schema/data/Auth sesuai prosedur Supabase, restore ke isolated native PostgreSQL/Supabase staging, manifest cohort private dan approval ticket. Agregat inventory di atas bukan backup. Test fail injected setelah policy/backfill/audit dan pastikan tak ada akses pelanggan terputus atau history setengah applied.
- `ahmadnurrochim11@gmail.com` hanya kandidat identitas dari pengguna. Login yang dilaporkan bukan bukti UUID terverifikasi audit. Verifikasi organisasi + Supabase Auth UUID melalui kanal trusted, jangan email auto-provision. Bootstrap developer pertama SQL out-of-band + lock site_admins + audit persis template migration004/report developer, **setelah approval**. Setelahnya roster/grant lewat developer RPC beralasan. Operator tidak dapat self-promote; multiple admin didukung, last-developer safeguard tetap aktif. Ops recovery kehilangan developer wajib ticket/audit owner DB, bukan public bootstrap.

**Exit gate tahap 1:** keputusan grandfather tertulis, identity verified, implementasi legacy/expand-contract + regression suites, backup restore rehearsal + native concurrency. Tanpa itu tetap NO-GO hosted mutation.

## Tahap 2 — admin release; sales tetap disabled

- Apply hanya schema compatibility/commerce/roles approved tahap 1, tanpa paid restrictive checks aktif dan tanpa EXECUTE reset publik. Bootstrap UUID verified secara audited. Settings awal harga/durasi/link/support NULL, `sales_enabled=false`; jangan mengarang nilai.
- Build release allowlist di baseline 2de765a + admin-only client integration. Preserve planner existing serta onboarding/auth/pairing. Jangan membawa paid dashboard guard/reset hanya karena build lulus. Alternatif compatibility effective-access UX hanya jika contract fase nonenforcement sudah diuji; bukan fallback permissive tenant RLS.
- Hosted tests approved dengan akun/workspace QA owned: ordinary user gagal admin/self-role, operator tidak roster/grants/developer audit, developer authorized admin changes dengan reason/audit, last developer tak bisa hilang. No unrelated admin planner bypass. Existing cohort planner tetap berfungsi. Sales request ditolak server, bukan tombol saja.
- Rilis Worker hanya setelah exact account/remote baseline/deployment approval. UI baseline fix tetap ada. Jalur `.env.local` tidak staged/public assets; export bukan fixture. Uji cache service worker lama dan baru.

## Tahap 3 — paid enforcement terkontrol

- Reinventory cohort dan existing paid refs; rekonsiliasi normalized duplicate/format registry tanpa menghapus audit/uniqueness. Hosted saat ini belum punya paid refs; itu bukan izin mengarang pembayaran.
- Owner menentukan harga IDR, durasi, HTTPS product URL resmi Lynk, support/email/legal dan tanggal mulai enforcement. Sales tetap disabled sampai semua approved dan manual SOP merchant diuji; grant legacy tidak memerlukan sales on.
- Dalam transaksi/cutover rehearsed: approved cohort grants + audit lengkap, effective-access SQL/client kompatibel, lalu restrictive policies aktif. Verifikasi counts + effective access seluruh cohort sebelum buka traffic; rollback safety siap.
- Native multi-connection: request ganda satu pending; verify/reject race; verify retry ref identik tidak memperpanjang; ref identik lintas workspace hanya satu sukses tanpa partial audit/status; dua renewals tepat penjumlahan snapshot durasi; expired/revoked mulai sekarang; indefinite paid legacy harus punya keputusan explicit (current SQL renewal null expiry menjadi finite), tidak silently downgrade. Test role revocation concurrent verify/settings dan grant/revoke test access; tetapkan apakah existing in-flight boleh selesai.
- Hosted two-account/JWT/PostgREST: owner/partner sharing, outsider isolation, expired/revoked paid+legacy, no self-grant/no redirect unlock, metadata/pairing tetap tersedia. Uji controlled QA pembayaran nyata hanya dengan approval merchant; tidak membuat transaksi pelanggan demi smoke test.

## Tahap 4 — reset release terpisah

- Hanya setelah backup/export pemulihan tersedia dan approved, enable migration/RPC EXECUTE dan UI reset. Jika function dipasang lebih awal, revoke authenticated EXECUTE dahulu; stage activation audited/reviewed. UI flag saja tidak cukup.
- Native concurrent reset/delete/write harus dites. Workspace FOR UPDATE serializes RPC yang ikut lock dan FK insert tertentu, **bukan global pause edit partner**; update planner biasa tidak semuanya ikut workspace lock. Tetapkan kontrak: reset snapshot atomic, writes sesudahnya boleh muncul. Pengguna harus berhenti edit berdua; jika janji stronger dibutuhkan, semua write path/RLS harus punya koordinasi server dan regression test terlebih dahulu.
- Owned QA workspace saja: owner exact `RESET RENCANA`, partner/outsider/admin unrelated denied; expired access tetap boleh cleanup; late failure rollback semua empat tabel+audit; metadata/auth/membership/invites/legacy savings/paid/registry tetap. Browser cancel/Escape/error/success/refresh-failure; network timeout setelah commit harus reload, bukan retry membuta. Jangan reset workspace pelanggan existing sebagai pengujian.

## Tahap 5 — production tests dan rollback setiap tahap

- Recheck Cloudflare identity/deployment exact Worker + account; Supabase project ref exact. Catat release SHA, schema manifest, approval ticket, cohort grant counts, sales flag, backup restore evidence. No commit/push/deploy tanpa approval berikutnya.
- Smoke canonical login/callback, session refresh, existing cohort planner reload, pairing dua akun/cross-device, /admin role, /purchase disabled/enabled sesuai tahap, mobile 360/390/430 + desktop, cached SW upgrade. HTTP 200/build sukses bukan bukti flow lengkap.
- Rollback UI: deploy export isolated 2de765a atau last-known-good staged UI, bukan canonical dirty out. Rollback UI **tidak menghapus paid RLS**. Emergency paid safety harus script DBA reviewed restoring pre-enforcement policies/effective access untuk cohort; tenant membership RLS tetap, audit/registry/data tidak dihapus. Sales off tidak membuka planner yang terkunci.
- Rollback admin: disable sales, revoke compromised admin dengan developer/DB owner audited, preserve last developer/recovery path. Pertahankan additive schema dan registry; jangan down/drop CASCADE yang membuang data.
- Rollback reset: revoke EXECUTE/hide feature segera, tetapi committed reset tidak bisa di-undo dengan deploy; restore terarah dari backup sesuai approval pasangan, jangan overwrite seluruh DB/tenant lain.
- Abort jika ada cohort denied, schema contract mismatch, duplicate refs, role escalation, audit partial, race expiry salah, atau cache UI lama berbahaya. Jangan lanjut tahap berikutnya untuk menutupi failure.

## Tindakan berikutnya yang memerlukan keputusan

1. Pemilik memilih grandfather period + exact expiry/cutoff dan komunikasi untuk **3 workspace existing** (reinventory lagi sebelum apply).
2. Verifikasi UUID developer melalui kanal trusted; bukan credential/secret chat dan bukan lookup auto email.
3. Setelah kedua keputusan, implementasi **lokal dahulu** legacy grants + expand-contract runner/admin-only packaging, regression/native concurrency + restore rehearsal; baru minta approval tahap 2 hosted. Audit ini tidak memberikan izin apply/deploy full pending modules.
