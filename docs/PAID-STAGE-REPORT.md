# Hasil tahap pertama berbayar — lokal, belum rilis

Catatan lanjutan: laporan ini merekam tahap fondasi sebelumnya. Workflow admin UI, append-only audit dan idempotensi transaksi kini diimplementasikan lokal pada `docs/ADMIN-STAGE-REPORT.md`; batas belum apply/deploy/backfill tetap berlaku.

## Hasil
PRD dan arsitektur/access kanonis berbahasa Indonesia; Lynk.id manual verified activation per workspace, bukan per user. Migration baru entitlement dan ledger, guard frontend, tabungan CRUD/total per pasangan/progres/sisa target, serta Lamaran/Honeymoon terkunci mendatang. Migration baseline tidak diubah. Tidak commit/push/deploy/apply atau menulis hosted DB. `.env.local` tidak dibaca, diubah, ditampilkan atau staged; dirty graph/security evidence/link metadata lama dipertahankan.

## Bukti eksekusi
- RED SQL sebelum entitlement: `Missing expected rejection` pada write tasks tanpa akses. Setelah implementasi, entitlement cases lulus; ledger awal gagal karena tabel belum tersedia, kemudian lulus setelah schema ledger.
- RED cloud contract: assertion query ledger/entitlement scoped workspace gagal; GREEN setelah cloud snapshot/CRUD diperluas.
- RED savings helper: file belum ada; GREEN setelah total/partner/progress/remaining dan expiry/revocation helper dibuat.
- `node scripts/test-paid-stage.mjs`: **9 paid-stage SQL tests passed**, schema gabungan baseline + migration baru dalam PGlite disposable. Denial semua tabel core, no self-grant meski grant diperluas, pasangan berbagi core, add-on terpisah, ledger CRUD/total/invalid money/FK, outsider/anonymous denial, tenant move immutable, revoke/expire.
- `node scripts/test-backend.mjs`: **20 backend SQL tests passed**, baseline regression tetap utuh.
- `node scripts/test-cloud.cjs`, `node scripts/test-savings.cjs`, `node scripts/test-guest-csv.cjs`, `node scripts/test-workspace-storage.cjs`: PASS.
- `npm run lint`: PASS, max-warnings 0.
- `npm run build`: PASS, Next 15.5.27, 11 static pages, default `.env.local` configuration dipulihkan setelah build fixture.
- `python scripts/test-auth-configured-browser.py`: PASS transport fixture saja, signed-out/Google PKCE, savings create/edit/delete/reload, no entitlement lock, invite/logout, retained legacy; tidak overflow 360/390/430/1280px. Kegagalan awal accessible select label diperbaiki `aria-label`; fixture service-worker diblok agar route deterministik. Bukan hosted persistence/auth/payment evidence.
- `git diff --check`: PASS, hanya warning LF/CRLF Git.
- `graphify update .`: **413 nodes, 627 edges, 39 communities**, AST-only, 32 unsupported files tidak diindeks; community labels perlu refresh dan Markdown baru belum semantically indexed. Graph backup dibuat otomatis; unrelated graph dirt tidak dihapus.

## Batas keamanan dan release gates
Entitlement tidak punya public mutation/grant RPC; hanya trusted DB admin. RLS restrictive core AND membership melindungi request langsung. Ledger kontributor FK anggota workspace; uang positive integer safe range; immutable tenant. Catatan bersama dapat dikoreksi kedua anggota, bukan audit/custody uang.

**Tidak langsung deploy:** migration baru belum diterapkan, memerlukan audit/backfill kebijakan workspace lama agar tidak terkunci, coordinated schema/frontend rollout. Frontend baru gagal tertutup jika schema belum ada. Hosted JWT/PostgREST/two-account/cross-device dan native multi-connection concurrency belum diuji. Tidak ada prices/product URL/keys yang dikarang. Admin activation belum UI operasional atau immutable audit/idempotency pembelian; manual pemeriksaan ref/pembelian ulang wajib. Lamaran/honeymoon belum lengkap. Editing target tabungan, export/recovery ledger dan legal/support/payment operations tetap tahap lanjutan.
