export interface PlanTier {
  id: 'starter' | 'premium' | 'wedding_pro';
  name: string;
  priceLabel: string;
  accessDuration: string;
  description: string;
  features: string[];
  exclusiveFeatures: string[];
}

export const demoPlans: PlanTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceLabel: 'Rp 49.900',
    accessDuration: '6 Bulan Akses Penuh',
    description: 'Solusi esensial untuk pasangan yang ingin merapikan persiapan inti pernikahan.',
    features: [
      'Kolaborasi Pasangan Real-time',
      'Rundown Hari H & Timeline Acara',
      'Budget & Pelacakan Pengeluaran',
      'Wedding Checklist & Berkas KUA',
      'Undangan Digital (Web & WhatsApp)',
      'Akses Cloud selama 6 Bulan',
    ],
    exclusiveFeatures: [
      'Buku Tamu & Export CSV',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceLabel: 'Rp 79.900',
    accessDuration: '1 Tahun Akses Penuh',
    description: 'Solusi komprehensif dengan manajemen tabungan bersama dan moodboard visual dekorasi.',
    features: [
      'Semua Fitur Paket Starter',
      'Akses Cloud selama 1 Tahun (12 Bulan)',
      'Tabungan Bersama Pasangan',
      'Moodboard & Palet Warna Visual',
      'Preset Palet Warna & Inspirasi Dekor',
      'Prioritas Dukungan Teknis',
    ],
    exclusiveFeatures: [
      'Kalkulator Target Tabungan Tiap Pasangan',
      'Katalog Inspirasi Moodboard Lengkap',
    ],
  },
  {
    id: 'wedding_pro',
    name: 'Wedding Pro',
    priceLabel: 'Rp 99.900',
    accessDuration: 'Akses Penuh Tanpa Batas / VIP',
    description: 'Paket terlengkap dari A sampai Z, mencakup Honeymoon Planner dan Engagement / Lamaran Planner resmi.',
    features: [
      'Semua Fitur Paket Premium & Starter',
      'Engagement / Lamaran Planner Resmi',
      'Checklist Kotak Seserahan & Angsul-angsul',
      'Rundown Prosesi Pertunangan Keluarga',
      'Honeymoon Planner & Itinerary Harian',
      'Honeymoon Budgeting & Tracking Pos Liburan',
      'Template Standar Lengkap Sekali Klik',
    ],
    exclusiveFeatures: [
      'Modul Honeymoon & Lamaran Eksklusif',
      'VIP Priority Support & Unlimited Export',
    ],
  },
];
