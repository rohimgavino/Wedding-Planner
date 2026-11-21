import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/everrae/navigation";
import { PlannerPreview } from "@/components/everrae/planner-preview";

export const metadata: Metadata = {
  title: "Demo Interaktif Wedding Planner — Pocket Planner",
  description:
    "Coba langsung demo interaktif Pocket Planner. Uji coba modul Timeline & Checklist persiapan, Master Budget, dan Guest List tanpa registrasi.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "Demo Interaktif Wedding Planner — Pocket Planner",
    description:
      "Coba langsung demo interaktif Pocket Planner untuk menata pernikahan impianmu.",
    url: "https://pocketwedding.id/demo",
    siteName: "Pocket Planner",
    type: "website",
  },
};

export default function Demo() {
  return (
    <div className="everrae er-demo-page">
      <div className="er-container">
        <header className="er-demo-heading">
          <Link href="/">
            <Brand />
          </Link>
        </header>
        <div className="er-demo-notice">
          <p className="er-eyebrow">DEMO INTERAKTIF · SEMUA DATA FIKTIF</p>
          <h1 className="text-4xl font-serif my-4">
            Semakin dekat menuju hari bahagiamu.
          </h1>
          <p>
            Coba tab Timeline, Budget, dan Guest List, lalu tandai checklist.
            Perubahan demo hanya di memori halaman ini, tidak disimpan dan tidak
            mengisi workspace pribadi kamu.
          </p>
        </div>
        <PlannerPreview interactive />
        <Link className="er-text-link" href="/">
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
