import React from "react";

export function JsonLd() {
  const schemaGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://pocketwedding.id/#website",
        url: "https://pocketwedding.id",
        name: "Pocket Planner",
        alternateName: ["Pocket Wedding", "Pocket Wedding Indonesia"],
        description:
          "Aplikasi Web & PWA Perencana Pernikahan Kolaboratif untuk Pasangan Calon Pengantin di Indonesia.",
        inLanguage: "id-ID",
      },
      {
        "@type": "Organization",
        "@id": "https://pocketwedding.id/#organization",
        name: "Pocket Planner",
        url: "https://pocketwedding.id",
        logo: "https://pocketwedding.id/images/pocket-planner-logo.png",
        email: "ahmadnurrochim11@gmail.com",
        founder: {
          "@type": "Person",
          name: "Ahmad Nur Rochim",
        },
        sameAs: ["https://pocketwedding.id"],
      },
      {
        "@type": "WebApplication",
        "@id": "https://pocketwedding.id/#app",
        name: "Pocket Planner",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "All (Web, Android, iOS)",
        browserRequirements: "Requires JavaScript. Requires HTML5.",
        url: "https://pocketwedding.id",
        description:
          "Platform kolaboratif persiapan pernikahan untuk calon pengantin: checklist berkas KUA, pelacak anggaran (budgeting), tabungan bersama, buku tamu & RSVP WhatsApp, serta undangan digital 3D Nusantara.",
        offers: [
          {
            "@type": "Offer",
            name: "Paket Starter",
            price: "49900",
            priceCurrency: "IDR",
            availability: "https://schema.org/InStock",
            url: "https://pocketwedding.id/purchase",
            description:
              "6 bulan akses penuh kolaborasi cloud, checklist KUA, anggaran, rundown, dan undangan digital.",
          },
          {
            "@type": "Offer",
            name: "Paket Premium",
            price: "79900",
            priceCurrency: "IDR",
            availability: "https://schema.org/InStock",
            url: "https://pocketwedding.id/purchase",
            description:
              "1 tahun akses penuh mencakup semua fitur Starter, manajemen tabungan bersama, dan visual moodboard.",
          },
          {
            "@type": "Offer",
            name: "Paket Wedding Pro",
            price: "99900",
            priceCurrency: "IDR",
            availability: "https://schema.org/InStock",
            url: "https://pocketwedding.id/purchase",
            description:
              "Akses tanpa batas VIP mencakup semua fitur, Engagement / Lamaran Planner, dan Honeymoon Planner lengkap.",
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://pocketwedding.id/#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "Apakah Pocket Planner sudah bisa digunakan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ya. Kamu dapat masuk dengan akun Google, membuat workspace pernikahan bersama pasangan, dan mengaktifkan paket untuk menyinkronkan checklist, anggaran, tabungan, serta daftar tamu di cloud.",
            },
          },
          {
            "@type": "Question",
            name: "Apakah akun tersinkron antar perangkat?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ya, workspace tersinkron melalui akun Google dan database cloud sehingga kamu dan pasangan dapat mengakses rencana yang sama secara aman di smartphone Android, iPhone, maupun laptop.",
            },
          },
          {
            "@type": "Question",
            name: "Bagaimana cara membeli paket?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Masuk ke akunmu, buat atau pilih workspace, lalu buka halaman aktivasi paket untuk membayar secara resmi (mendukung QRIS, Virtual Account, dan e-Wallet).",
            },
          },
          {
            "@type": "Question",
            name: "Apakah akses langsung aktif setelah bayar?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ya. Setelah pembayaran lunas terverifikasi secara otomatis oleh sistem, akses workspace langsung aktif seketika untuk kamu dan pasangan.",
            },
          },
          {
            "@type": "Question",
            name: "Bagaimana keamanan dan penyimpanan data?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Data workspace tersimpan aman di database cloud Supabase dengan proteksi Row Level Security, sedangkan transaksi diproses secara terenkripsi melalui gateway pembayaran resmi tanpa menyimpan data perbankanmu di aplikasi.",
            },
          },
          {
            "@type": "Question",
            name: "Apa keunggulan Pocket Planner dibanding spreadsheet atau catatan biasa?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Pocket Planner dirancang khusus untuk alur pernikahan Indonesia: menghitung pagu anggaran per kategori otomatis, checklist berkas KUA H-12 bulan, template pesan RSVP WhatsApp tanpa biaya API, dan 12 tema undangan digital 3D Nusantara yang terhubung langsung ke kalender tamu.",
            },
          },
          {
            "@type": "Question",
            name: "Apakah satu paket bisa digunakan berdua bersama pasangan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ya. Cukup satu paket pembelian per workspace, kamu dan pasangan dapat saling terhubung melalui tautan pasangan resmi sehingga seluruh rencana tersinkronisasi real-time.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
    />
  );
}
