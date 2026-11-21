import type { Metadata } from "next";
import { AuthGate } from "@/components/auth-gate";

export const metadata: Metadata = {
  title: "Onboarding Persiapan Pernikahan — Pocket Planner",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
