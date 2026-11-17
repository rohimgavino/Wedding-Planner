import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Wallet, Users, Flower2, Mail, HeartHandshake, ArrowRight } from "lucide-react";
import { PlannerPreview } from "./planner-preview";

const features = [
  {
    icon: CalendarDays,
    title: "Perencanaan Terstruktur",
    body: "Checklist persiapan dan berkas KUA tersinkron cloud.",
    status: "Tersedia",
  },
  {
    icon: Wallet,
    title: "Budget Tracker",
    body: "Alokasi pagu, pengeluaran riil, dan status pelunasan.",
    status: "Tersedia",
  },
  {
    icon: Users,
    title: "Guest List & RSVP",
    body: "Buku tamu, tautan WhatsApp, ekspor CSV, dan RSVP manual.",
    status: "Tersedia",
  },
  {
    icon: Mail,
    title: "Undangan Digital",
    body: "Template personal dengan tautan publik dan buku ucapan.",
    status: "Tersedia",
  },
  {
    icon: HeartHandshake,
    title: "Kolaborasi Pasangan",
    body: "Satu ruang kerja terpadu untuk kamu dan pasangan berdua.",
    status: "Tersedia",
  },
  {
    icon: Flower2,
    title: "Manajemen Vendor",
    body: "Direktori vendor dan alur pemesanan terintegrasi.",
    status: "Segera hadir",
  },
];

export function Features() {
  return (
    <section id="features" className="er-section er-features">
      <div className="er-container">
        <div className="er-feature-intro">
          <div>
            <p className="er-eyebrow">DIRANCANG KHUSUS UNTUK HARI ISTIMEWAMU</p>
            <h2>
              Semua yang Kamu Butuhkan
              <br />
              Dalam Satu Platform
            </h2>
            <p className="er-body-copy">
              Lebih sedikit tab yang terbuka. Lebih banyak ruang untuk menikmati
              perjalanan kalian. Rencana, anggaran, dan tamu tertata dalam satu tempat.
            </p>
          </div>
          <div
            className="er-stationery"
            aria-label="Konsep desain undangan digital siap pakai"
          >
            <Image
              className="er-stationery-photo"
              src="/images/wedding-flowers.jpg"
              alt="Rangkaian mawar ivory, sukulen, dan bunga biru di atas kain"
              width={500}
              height={400}
            />
            <div className="er-invitation">
              <Flower2 size={38} strokeWidth={0.7} />
              <small>PERNIKAHAN DARI</small>
              <span>
                Alya
                <br />
                <i>&</i> Reza
              </span>
              <p>12 · 12 · 2027</p>
            </div>
            <div className="er-stationery-caption">
              Sentuhan personal.
              <br />
              <em>Momen tak terlupakan.</em>
            </div>
          </div>
        </div>
        <div className="er-feature-list">
          {features.map((f) => (
            <article key={f.title}>
              <f.icon size={22} strokeWidth={1.25} />
              <h3>{f.title}</h3>
              <p>{f.body}</p>
              <small>{f.status}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Showcase() {
  return (
    <section className="er-showcase">
      <div className="er-container er-showcase-grid">
        <div>
          <p className="er-eyebrow">FITUR UNGGULAN</p>
          <h2>
            Lebih dari
            <br />
            Sekadar Checklist
          </h2>
          <p>
            Setiap rencana punya ceritanya sendiri. Lihat bagaimana detail kecil
            menjadi perjalanan yang utuh—dari anggaran pertama sampai persiapan
            terakhir.
          </p>
          <Link className="er-button" href="/demo">
            Jelajahi Demo <ArrowRight size={16} />
          </Link>
          <small className="er-showcase-note">
            Pratinjau interaktif dengan data simulasi.
            <br />
            Tidak mengubah workspace kamu.
          </small>
        </div>
        <PlannerPreview />
      </div>
    </section>
  );
}
