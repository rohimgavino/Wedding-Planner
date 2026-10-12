import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./everrae.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "EverRae — Plan Your Dream Wedding, Effortlessly",
  description: "Rencanakan pernikahan dengan lebih tenang. Checklist, anggaran, dan daftar tamu dalam prototype wedding planner EverRae.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
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
