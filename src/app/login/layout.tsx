import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk — Pocket Planner",
  description: "Masuk ke ruang kerja kolaborasi persiapan pernikahan Pocket Planner.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
