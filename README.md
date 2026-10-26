# PocketWedding — canonical Wedding Planner

## Satu proyek, satu sumber kerja
- Nama produk yang dipilih: **PocketWedding**; domain yang dipilih: **pocketwedding.id**. Ini keputusan identitas, bukan bukti DNS/deployment/domain sudah aktif.
- Seluruh pekerjaan permanen dilakukan di `D:/wedding-planner`. `D:/everrae` adalah salinan desain legacy, bukan proyek kedua yang dikembangkan. Jangan merge, hapus atau pindahkan kode/data/credentials dari sana tanpa perbandingan dan persetujuan.
- Ada ingatan dua UI/UX berbeda; keputusan desain menunggu perbandingan read-only. Tampilan publik dan storage key EverRae sengaja dipertahankan untuk menjaga desain/data. Tidak ada rebrand visual massal.
- Admin lokal `/admin`: lihat `docs/POCKETWEDDING-ADMIN-IMPLEMENTATION.md`. Paket yang disepakati Rp250.000 / 1 tahun / satu workspace pasangan. DOKU dipilih untuk website langsung, **belum terintegrasi**; bukan Lynk.id. Dokumen pembayaran Lynk di bawah adalah riwayat rancangan, bukan kontrak pembayaran saat ini.
- Tidak ada provisioning admin, migration hosted, deployment atau DNS yang dijalankan pada tahap admin lokal ini.

Canonical repository: `D:/wedding-planner`, remote `rohimgavino/Wedding-Planner`, branch `main`. `D:/everrae` remains the design copy; future work belongs here. Public Pages project: `wedding-planner`, https://wedding-planner-a8z.pages.dev. Publish only `out`, never source, credentials or archives.

Archive: `D:/backups/wedding-planner-before-everrae-20261012-114201` contains old source/docs, planning documents, dirty graph, full `.git`, Git bundle and state/diff. Actual env files were excluded and left untouched (none present at inventory). Previous production deployment for rollback: `afef8996-fd2f-48b6-8cf4-69e61d68fd7c` (source `d98bd46`). Restore only explicit source paths or use Pages rollback; never blanket reset/clean.

Migration: valid same-origin `wedding_planner_workspace_clean_v2` is copied only when `everrae_workspace_v1` is absent. The legacy key is retained and current data wins. Unsupported/malformed schemas remain untouched, with saving disabled and a visible alert. Reset writes an empty current workspace to prevent re-import. No cross-origin migration or cloud backup.

Security audit after remediation: production dependencies 0; all dependencies 7 high development-tooling issues rooted in braces 3.0.3 with no published patch. Next is pinned to 15.5.27 with reviewed PostCSS/selector-parser patches. Static output only; no backend activation. See docs/DEPENDENCY-SECURITY.md for exact remaining advisory, compatibility choices, evidence and rollback.

## Run and verify
- `npm ci`
- `npm run dev -- -H 0.0.0.0 -p 3000`
- `npm run lint` and `npx tsc --noEmit`
- `npm run build` creates `out`
- `python scripts/preview.py` serves clean routes at http://localhost:4190
- `python scripts/test-preview.py` checks the export using Python Playwright and installed Chrome
- `graphify update .`

Routes: `/`, `/demo` (memory-only fictional data), `/legal`, inherited local `/login`, `/onboarding`, `/dashboard`, `/invite`.
See docs/DESIGN-AUDIT.md, docs/BACKEND-NEXT-STAGE.md, docs/IMAGE-ATTRIBUTION.md and docs/TEST-RESULTS.json.
Status publik historis (bukan bukti fitur hosted terkini): vendor management, invitations, cloud collaboration, production auth dan subscriptions belum diverifikasi aktif. Keputusan pembayaran terbaru: DOKU langsung di website, belum terintegrasi; paket Rp250.000 / 1 tahun / satu workspace pasangan. Lynk.id hanya schema/rancangan legacy yang belum dimigrasikan. Deployment tetap memerlukan persetujuan terpisah dan hanya static export non-fixture.

## Historical baseline documentation (not proof of active cloud features)

# Wedding Planner & Collaborative Workspace PWA

> **Nikahnya Berdua. Planning-nya Juga.**

Aplikasi PWA perencanaan pernikahan kolaboratif untuk pasangan Indonesia. Dibangun dengan Next.js, Tailwind CSS, dan Supabase.

---

## Fitur Tahap 1 (MVP)
* 💍 **Shared Workspace:** Hubungkan akun calon mempelai pria & wanita dalam satu dashboard yang sinkron real-time.
* 💰 **Tabungan & Budgeting:** Pantau saldo rekening bersama dan plafon anggaran per kategori (Venue, Katering, MUA, dll).
* 📝 **Checklist & Timeline:** To-do list persiapan pernikahan berjangka waktu (H-6 bulan s/d Hari H) + Dokumen Nikah KUA.
* 👥 **Buku Tamu & RSVP WhatsApp:** Kelola daftar tamu, jumlah pax, dan generate link pesan konfirmasi WhatsApp instan tanpa biaya API.
* 📱 **PWA Ready:** Ringan, mobile-first, dan dapat dipasang langsung di layar utama smartphone (Android & iPhone).

---

## Dokumentasi Proyek
* **Product Requirements Document (PRD):** `C:/Users/PC/AI-Team/WeddingPlanner/PRD.md`
* **Arsitektur Teknis:** `C:/Users/PC/AI-Team/WeddingPlanner/ARCHITECTURE.md`
* **SOP AI Agent:** `AGENTS.md`
* **Knowledge Graph:** `graphify-out/GRAPH_REPORT.md`

---

## Menjalankan Secara Lokal
```bash
npm install
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser.
