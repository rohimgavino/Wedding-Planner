import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./everrae.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Pocket Planner — Plan Your Dream Wedding, Effortlessly",
  description: "Rencanakan pernikahan dengan lebih tenang. Checklist, anggaran, dan daftar tamu bersama Pocket Planner.",
  manifest: "/manifest.json?v=pp-alpha-1",
  icons: {
    icon: "/favicon.ico?v=pp-alpha-1",
    apple: "/apple-touch-icon.png?v=pp-alpha-1",
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
