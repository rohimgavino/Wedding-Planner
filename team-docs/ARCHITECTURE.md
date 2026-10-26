# Arsitektur & Spesifikasi Teknis — Wedding Planner PWA
## Tahap 1 (MVP)

Dokumen ini mendefinisikan standar teknologi, arsitektur data, flow pairing, dan aturan pemeliharaan sistem.

---

## 1. Stack Teknologi

| Layer | Teknologi | Alasan Pemilihan |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14+ (App Router)** | Rendering cepat, SEO landing page optimal, TypeScript-first, didukung penuh Vercel & Cloudflare. |
| **Styling & UI Kit** | **Tailwind CSS + Lucide Icons + Radix UI / Shadcn** | Mobile-first utility styling, konsistensi token visual, komponen aksesibel dan ringan. |
| **PWA Engine** | `@serwist/next` atau `next-pwa` | Web App Manifest, Service Worker caching, prompt instalasi layar utama (*Add to Home Screen*). |
| **Backend & Database** | **Supabase (Managed PostgreSQL)** | Autentikasi lengkap, Row Level Security (RLS) bawaan, PostgreSQL relational schema, dan Realtime Webhook/Subscription. |
| **State & Data Fetching** | TanStack Query (React Query) + Supabase JS Client | Optimistic update untuk offline-resilience dan sinkronisasi real-time instan. |
| **Hosting & Deployment** | **Cloudflare Pages / Vercel** | Gratis (zero egress fee), CDN global dengan latensi rendah di Indonesia. |
| **Tooling & Knowledge Graph** | **Graphify (`graphify-out/`)** | Pemetaan graf dependensi file & arsitektur proyek untuk efisiensi token AI agent. |

---

## 2. Struktur Folder Standar (Next.js App Router)

```text
wedding-planner/
├── public/
│   ├── icons/                  # Ikon PWA (192x192, 512x512, apple-touch-icon)
│   ├── manifest.json           # PWA Web Manifest
│   └── favicon.ico
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Route grup auth (login, register, callback)
│   │   ├── (dashboard)/        # Halaman utama aplikasi (protected route)
│   │   │   ├── layout.tsx      # Bottom nav bar mobile & header workspace
│   │   │   ├── page.tsx        # Dashboard ringkasan (countdown & progress)
│   │   │   ├── budget/         # Modul tabungan & anggaran
│   │   │   ├── tasks/          # Modul checklist & timeline berkas KUA
│   │   │   ├── guests/         # Modul tamu undangan & WhatsApp generator
│   │   │   └── settings/       # Pengaturan pasangan & invite partner
│   │   ├── invite/[token]/     # Halaman landing saat pasangan membuka tautan undangan
│   │   ├── layout.tsx
│   │   └── page.tsx            # Landing page publik pengenalan aplikasi
│   ├── components/             # Komponen UI modular
│   │   ├── ui/                 # Button, Input, Modal, Badge, Card, Progress
│   │   ├── dashboard/          # Widget countdown, budget summary card
│   │   ├── budget/             # Form input pengeluaran, progress bar kategori
│   │   ├── tasks/              # To-do item, filter PIC (Pria/Wanita)
│   │   └── guests/             # Tabel tamu, modal kirim WhatsApp, export CSV
│   ├── lib/
│   │   ├── supabase/           # Client, Server & Middleware Supabase helper
│   │   ├── whatsapp.ts         # Helper generator URL Click-to-Chat WhatsApp
│   │   └── utils.ts            # Formatter mata uang (Rupiah), tanggal (ID)
│   └── types/                  # TypeScript interface (Workspace, Member, Budget, Task, Guest)
├── graphify-out/               # Knowledge graph dependensi proyek
│   ├── graph.json
│   ├── graph.html
│   └── GRAPH_REPORT.md
├── AGENTS.md                   # SOP AI Agent & pedoman Graphify
├── README.md                   # Dokumentasi instalasi lokal
└── package.json
```

---

## 3. Desain Keamanan & Row Level Security (RLS)

Setiap data (budget, tasks, guests) **wajib** memiliki kolom `workspace_id`. Pengguna hanya boleh melihat dan memodifikasi data jika akun mereka terdaftar dalam tabel `workspace_members` untuk `workspace_id` yang bersangkutan.

### Kebijakan RLS (PostgreSQL):
```sql
-- Helper function untuk memeriksa keanggotaan workspace
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mengaktifkan RLS pada tabel
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Contoh Policy pada tabel budgets
CREATE POLICY "Anggota workspace dapat membaca anggaran"
ON budgets FOR SELECT
USING (is_workspace_member(workspace_id));

CREATE POLICY "Anggota workspace dapat mengubah anggaran"
ON budgets FOR ALL
USING (is_workspace_member(workspace_id));
```

---

## 4. Alur Kerja Pairing Pasangan (Shared Workspace Flow)

```
[Mempelai 1 (Owner)]
    │
    ├─> Login & Buat Workspace ("Pernikahan Rian & Dina")
    │
    └─> Klik "Undang Pasangan"
            │
            ├─> Sistem membuat token di tabel `invitations`
            └─> Mengirim link: `https://app.com/invite/[TOKEN]` via WhatsApp/Email
                    │
                    ▼
[Mempelai 2 (Partner)]
    │
    ├─> Membuka tautan undangan
    ├─> Melakukan Login Google/Email
    └─> Sistem memverifikasi token:
            ├─> Jika valid: Insert record ke `workspace_members` role: 'partner'
            ├─> Ubah status invitation jadi 'accepted'
            └─> Redirect otomatis ke Dasbor Bersama
```

---

## 5. Integrasi WhatsApp Click-to-Chat (Zero Cost)

Aplikasi tidak menggunakan gateway API WhatsApp berbayar (seperti Twilio / Official Cloud API) untuk tahap 1. Sebagai gantinya, tombol WhatsApp menggunakan skema *Click-to-Chat*:

```typescript
export function generateWhatsAppLink(params: {
  phone: string;
  guestName: string;
  coupleName: string;
  weddingDate: string;
}): string {
  // Standarisasi nomor HP Indonesia ke format internasional (62xxx)
  let cleanPhone = params.phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  const message = `Halo ${params.guestName}! Kami mengundang Anda untuk hadir di momen bahagia ${params.coupleName} pada ${params.weddingDate}. Mohon konfirmasi kehadiran Anda melalui pesan ini ya. Terima kasih! 🙏`;

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}
```

---

## 6. Standar Integrasi Graphify

Setiap project dalam tim diwajibkan mengintegrasikan Graphify untuk efisiensi token AI:
1. File graph disimpan di folder `graphify-out/` pada root repositori.
2. Setiap kali ada perubahan fitur / perubahan file substansial, jalankan:
   ```bash
   graphify update .
   ```
3. Sebelum AI Agent mulai menganalisis kode atau mengerjakan tugas baru, agent **wajib membaca `graphify-out/GRAPH_REPORT.md`** terlebih dahulu untuk memahami peta dependensi tanpa menghabiskan kuota membaca seluruh isi direktori.
