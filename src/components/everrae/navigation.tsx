"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  ["Beranda", "#home"],
  ["Fitur", "#features"],
  ["Paket", "#pricing"],
  ["Template", "#templates"],
  ["Panduan", "#resources"],
];

export function Brand() {
  return (
    <>
      <span className="pp-logo pp-logo-default">
        <Image
          src="/images/pocket-planner-logo.png?v=pp-alpha-1"
          alt="Pocket Planner"
          width={320}
          height={194}
          priority
        />
      </span>
      <span className="pp-logo pp-logo-light">
        <Image
          src="/images/pocket-planner-logo-light.png?v=pp-alpha-1"
          alt="Pocket Planner"
          width={320}
          height={194}
          priority
        />
      </span>
    </>
  );
}

export function Navigation() {
  const [open, setOpen] = useState(false);
  return (
    <header className="er-nav er-container">
      <Link href="/" aria-label="Beranda Pocket Planner">
        <Brand />
      </Link>
      <nav aria-label="Navigasi utama" className="er-desktop-nav">
        {links.map(([label, url]) => (
          <a key={label} href={url}>
            {label}
          </a>
        ))}
      </nav>
      <div className="er-nav-actions">
        <Link className="er-login" href="/login">
          Masuk
        </Link>
        <button
          className="er-menu-button"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="er-mobile-nav"
          aria-label="Navigasi mobile"
        >
          {links.map(([label, url]) => (
            <a key={label} href={url} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <Link href="/login">Masuk</Link>
        </nav>
      )}
    </header>
  );
}
