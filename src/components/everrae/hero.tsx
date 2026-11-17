import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Navigation } from "./navigation";

/**
 * Konfigurasi Slot Foto Hero
 * Untuk mengganti foto ke tema pernikahan (pasangan, cincin, atau dekorasi):
 * 1. Simpan foto berlisensi resmi di folder public/images/ (misal: /images/wedding-hero.jpg)
 * 2. Ubah nilai `src` di bawah ini menjadi "/images/wedding-hero.jpg"
 */
export const HERO_PHOTO_CONFIG = {
  src: "/images/landscape-lake.jpg",
  alt: "Lanskap danau biru di antara pegunungan, menghadirkan ketenangan dalam merencanakan pernikahan",
};

export function Hero() {
  return (
    <section id="home" className="er-hero">
      <Image
        className="er-hero-photo"
        src={HERO_PHOTO_CONFIG.src}
        alt={HERO_PHOTO_CONFIG.alt}
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
      </div>
      <p className="er-hero-script">
        Bukan sekadar rencana,
        <br />
        ini perjalanan bahagiamu.
      </p>
    </section>
  );
}
