import { BudgetItem, TaskItem, GuestItem } from "@/types";

export const DEFAULT_BUDGET_CATEGORIES: Array<{ category: string; title: string; allocated: number }> = [
  { category: "Venue & Gedung", title: "Sewa Gedung Resepsi", allocated: 25000000 },
  { category: "Katering", title: "Paket Katering 500 Pax", allocated: 35000000 },
  { category: "Rias & Busana", title: "MUA Akad & Resepsi + Sewa Gaun/Jas", allocated: 10000000 },
  { category: "Dekorasi", title: "Dekorasi Pelaminan & Lorong Masuk", allocated: 12000000 },
  { category: "Dokumentasi", title: "Foto & Video Cinematic Hari H", allocated: 7500000 },
  { category: "Undangan & Souvenir", title: "Cetak Undangan Fisik & 300 Souvenir", allocated: 3500000 },
  { category: "Mahar & Seserahan", title: "Perlengkapan Mahar & Kotak Seserahan", allocated: 5000000 },
  { category: "Dana Darurat", title: "Cadangan Biaya Tak Terduga", allocated: 4000000 },
];

export const INITIAL_KUA_AND_TIMELINE_TASKS: Array<{
  title: string;
  phase: TaskItem["phase"];
  pic: TaskItem["pic"];
  notes?: string;
}> = [
  // Berkas KUA
  {
    title: "Minta Surat Pengantar RT/RW untuk Nikah",
    phase: "Dokumen KUA",
    pic: "both",
    notes: "Bawa KTP dan KK asli serta fotokopi.",
  },
  {
    title: "Urus Surat Model N1, N2, dan N4 di Kelurahan",
    phase: "Dokumen KUA",
    pic: "both",
    notes: "Surat pengantar kelurahan menuju KUA setempat.",
  },
  {
    title: "Cek Kesehatan & Imunisasi TT di Puskesmas",
    phase: "Dokumen KUA",
    pic: "bride",
    notes: "Sertifikat layak kawin (Elsimil / Puskesmas).",
  },
  {
    title: "Foto Berdampingan Latar Biru (2x3 & 4x6)",
    phase: "Dokumen KUA",
    pic: "both",
    notes: "Pakaian rapi berkerah, latar belakang warna biru resmi.",
  },
  {
    title: "Surat Rekomendasi Nikah (Jika Akad di Luar Domisili)",
    phase: "Dokumen KUA",
    pic: "groom",
    notes: "Diurus di KUA asal calon pengantin pria.",
  },
  {
    title: "Pendaftaran Berkas ke KUA & Bayar Biaya Nikah",
    phase: "Dokumen KUA",
    pic: "both",
    notes: "Gratis jika di KUA pada jam kerja; Rp 600.000 jika di luar kantor KUA (via Bank persepsi).",
  },
  {
    title: "Mengikuti Bimbingan Perkawinan (Bimwin) KUA",
    phase: "Dokumen KUA",
    pic: "both",
    notes: "Wajib diikuti calon mempelai sebelum akad.",
  },

  // H-6 Bulan
  {
    title: "Pertemuan Keluarga & Kesepakatan Tanggal Akad",
    phase: "H-6 Bulan",
    pic: "both",
  },
  {
    title: "Menentukan Plafon Anggaran & Pos Tabungan",
    phase: "H-6 Bulan",
    pic: "both",
  },
  {
    title: "Survey & Booking Gedung / Lokasi Acara",
    phase: "H-6 Bulan",
    pic: "both",
  },
  {
    title: "Test Food & Booking Katering",
    phase: "H-6 Bulan",
    pic: "both",
  },

  // H-3 Bulan
  {
    title: "Booking MUA & Pilihan Desain Busana Pengantin",
    phase: "H-3 Bulan",
    pic: "bride",
  },
  {
    title: "Booking Fotografer & Tim Cinematic Video",
    phase: "H-3 Bulan",
    pic: "groom",
  },
  {
    title: "Penyusunan Draf Daftar Tamu Kedua Keluarga",
    phase: "H-3 Bulan",
    pic: "both",
  },
  {
    title: "Pesan Souvenir & Cetak Undangan Fisik",
    phase: "H-3 Bulan",
    pic: "both",
  },

  // H-1 Bulan
  {
    title: "Fitting Terakhir Busana Akad & Resepsi",
    phase: "H-1 Bulan",
    pic: "both",
  },
  {
    title: "Beli Perlengkapan Seserahan & Hias Mahar",
    phase: "H-1 Bulan",
    pic: "both",
  },
  {
    title: "Kirim Undangan & Mulai Konfirmasi Tamu via WhatsApp",
    phase: "H-1 Bulan",
    pic: "both",
  },
  {
    title: "Rapat Koordinasi (Technical Meeting) Panitia Keluarga",
    phase: "H-1 Bulan",
    pic: "both",
  },

  // H-1 Minggu
  {
    title: "Konfirmasi Final Jumlah Porsi Katering & Rundown Vendor",
    phase: "H-1 Minggu",
    pic: "both",
  },
  {
    title: "Pengambilan Busana Pengantin & Keluarga",
    phase: "H-1 Minggu",
    pic: "both",
  },
  {
    title: "Pelunasan Seluruh Tagihan Vendor Utama",
    phase: "H-1 Minggu",
    pic: "both",
  },

  // Hari H
  {
    title: "Akad Nikah & Penyerahan Mahar Resmi",
    phase: "Hari H",
    pic: "both",
  },
  {
    title: "Resepsi Pernikahan & Sambutan Para Tamu",
    phase: "Hari H",
    pic: "both",
  },
];
