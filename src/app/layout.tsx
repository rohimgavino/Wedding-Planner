import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./everrae.css";
import "./invitation-theme.css";
import { Providers } from "@/components/Providers";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL("https://pocketwedding.id"),
  title: "Pocket Planner — Wujudkan Pernikahan Impian Tanpa Beban",
  description:
    "Rencanakan pernikahan impianmu dengan lebih tenang. Checklist persiapan KUA, anggaran (budgeting), tabungan bersama, daftar tamu RSVP WhatsApp, dan undangan digital 3D Nusantara bersama Pocket Planner.",
  keywords: [
    "wedding planner indonesia",
    "aplikasi perencana pernikahan",
    "undangan digital 3d",
    "undangan digital pernikahan",
    "checklist pernikahan kua",
    "budget tracker pernikahan",
    "susunan acara hari h",
    "buku tamu pernikahan whatsapp",
    "tabungan nikah bersama",
    "pocket planner",
    "pocket wedding",
  ],
  authors: [{ name: "Ahmad Nur Rochim", url: "https://pocketwedding.id" }],
  creator: "Pocket Planner",
  publisher: "Pocket Planner",
  category: "Lifestyle & Wedding Planning",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json?v=pp-alpha-2",
  icons: {
    icon: "/favicon.ico?v=pp-alpha-2",
    apple: "/apple-touch-icon.png?v=pp-alpha-2",
  },
  openGraph: {
    title: "Pocket Planner — Wujudkan Pernikahan Impian Tanpa Beban",
    description:
      "Rencanakan pernikahan impianmu dengan lebih tenang. Checklist persiapan, anggaran, daftar tamu, dan undangan digital bersama Pocket Planner.",
    url: "https://pocketwedding.id",
    siteName: "Pocket Planner",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "https://pocketwedding.id/images/wedding-flowers.jpg",
        width: 1200,
        height: 630,
        alt: "Pocket Planner — Aplikasi Perencana Pernikahan Modern",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pocket Planner — Wujudkan Pernikahan Impian Tanpa Beban",
    description:
      "Rencanakan pernikahan impianmu dengan lebih tenang. Checklist persiapan, anggaran, daftar tamu, dan undangan digital bersama Pocket Planner.",
    images: ["https://pocketwedding.id/images/wedding-flowers.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#233D32",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <JsonLd />
      </head>
      <body className="font-sans antialiased bg-[#FAF7F5] text-slate-800 selection:bg-rose-100">
        <Providers>
          <main className="min-h-screen flex flex-col relative">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
