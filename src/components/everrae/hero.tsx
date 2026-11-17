import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Navigation } from "./navigation";

export function Hero() {
  return (
    <section id="home" className="er-hero">
      <Image
        className="er-hero-photo"
        src="/images/landscape-lake.jpg"
        alt="Danau biru di antara pegunungan, dibingkai pepohonan pinus"
        fill
        priority
        sizes="100vw"
      />
      <div className="er-hero-shade" />
      <Navigation />
      <div className="er-container er-hero-content">
        <p className="er-eyebrow">APLIKASI PERENCANA PERNIKAHAN MODERN</p>
        <h1>
          Wujudkan Pernikahan Impian,
          <br />
          <em>Tanpa Beban.</em>
        </h1>
        <p className="er-hero-description">
          Dari rencana pertama hingga hari paling istimewa. Pocket Planner
          membantu kamu menata setiap detail pernikahan dengan lebih tenang,
          terorganisasi, dan personal.
        </p>
        <div className="er-actions">
          <Link className="er-demo-link" href="/demo">
            <span>
              <Play size={14} />
            </span>
            Lihat Demo
          </Link>
          <a className="er-button er-hero-cta" href="#pricing">
            Lihat Paket
            <ArrowRight size={15} />
          </a>
        </div>
        <div className="er-hero-facts">
          <div>
            <strong>Rencana</strong>
            <span>Checklist & persiapan</span>
          </div>
          <div>
            <strong>Anggaran</strong>
            <span>Setiap detail tercatat</span>
          </div>
          <div>
            <strong>Tamu</strong>
            <span>Daftar & status RSVP</span>
          </div>
        </div>
        <p className="er-hero-note">
          Workspace cloud bersama pasangan · Pembayaran resmi via DOKU
        </p>
      </div>
      <p className="er-hero-script">
        Bukan sekadar rencana,
        <br />
        ini perjalanan bahagiamu.
      </p>
    </section>
  );
}
