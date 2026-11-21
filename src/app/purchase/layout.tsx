import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pilihan Paket & Aktivasi Workspace — Pocket Planner",
  description:
    "Pilihan paket terencana pernikahan Pocket Planner: Starter (Rp 49.900), Premium (Rp 79.900), dan Wedding Pro (Rp 99.900). Satu akun berdua bersama pasangan dengan aktivasi otomatis via QRIS, Virtual Account, & e-Wallet.",
  alternates: {
    canonical: "/purchase",
  },
  openGraph: {
    title: "Pilihan Paket & Aktivasi Workspace — Pocket Planner",
    description:
      "Aktivasi ruang kerja perencanaan pernikahan kolaboratif untuk kamu dan pasangan. Pembayaran resmi dan terpercaya.",
    url: "https://pocketwedding.id/purchase",
    siteName: "Pocket Planner",
    type: "website",
    images: [
      {
        url: "https://pocketwedding.id/images/wedding-flowers.jpg",
        width: 1200,
        height: 630,
        alt: "Paket & Aktivasi Pocket Planner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pilihan Paket & Aktivasi Workspace — Pocket Planner",
    description:
      "Aktivasi ruang kerja perencanaan pernikahan kolaboratif untuk kamu dan pasangan.",
    images: ["https://pocketwedding.id/images/wedding-flowers.jpg"],
  },
};

export default function PurchaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
