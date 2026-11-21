import type { Metadata } from "next";
import { AuthGate } from "@/components/auth-gate";

export const metadata: Metadata = {
  title: "Dashboard Ruang Kerja — Pocket Planner",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
