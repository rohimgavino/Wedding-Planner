import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meet to Marry — Wedding Planner Kolaboratif",
  description: "Nikahnya Berdua. Planning-nya Juga. Wedding planner terintegrasi untuk pasangan Indonesia.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#D97762",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased bg-wedding-50 text-gray-900 selection:bg-wedding-200">
        <main className="min-h-screen max-w-md mx-auto bg-white shadow-xl flex flex-col relative">
          {children}
        </main>
      </body>
    </html>
  );
}
