"use client";

import Image from 'next/image';
import Link from 'next/link';
import { FillingExample } from './filling-example';
import { PlanningReset } from './planning-reset';
import './workspace-activation.css';

/** Presentation only: entitlement and partner access remain owned by DashboardPage. */
export function WorkspaceActivation({ onSettings }: { onSettings: () => void }) {
 return <main className="activation-gate">
  <div className="activation-wrap">
   <Link href="/" className="activation-brand" aria-label="Pocket Planner — Beranda"><Image src="/images/pocket-planner-logo.png" alt="Pocket Planner" width={132} height={78} unoptimized /></Link>
   <section className="activation-panel" aria-labelledby="activation-title">
    <header className="activation-heading">
     <span className="activation-status"><span aria-hidden="true" />Belum aktif</span>
     <p className="activation-eyebrow">RENCANA BERSAMA KALIAN</p>
     <h1 id="activation-title">Workspace menunggu aktivasi</h1>
     <p className="activation-intro">Satu paket inti untuk berdua: budget, checklist, tamu, dan tabungan bersama.</p>
    </header>
    <div className="activation-actions">
     <Link href="/purchase" className="activation-primary">Lihat paket &amp; aktivasi <span aria-hidden="true">→</span></Link>
     <button type="button" className="activation-secondary" onClick={onSettings}>Pengaturan &amp; pasangan</button>
    </div>
    <section className="activation-guide" aria-labelledby="activation-guide-title">
     <h2 id="activation-guide-title">Cara mengaktifkan</h2>
     <ol>
      <li><span aria-hidden="true">1</span><div><strong>Lihat paket</strong><p>Cek informasi dan ketersediaan di halaman aktivasi.</p></div></li>
      <li><span aria-hidden="true">2</span><div><strong>Ikuti petunjuk pembayaran</strong><p>Gunakan Lynk.id sesuai arahan resmi.</p></div></li>
      <li><span aria-hidden="true">3</span><div><strong>Verifikasi oleh admin</strong><p>Akses berdua aktif setelah pembayaran diverifikasi manual.</p></div></li>
     </ol>
    </section>
    <details className="activation-payment">
     <summary>Pembayaran &amp; keamanan</summary>
     <p>Tidak ada aktivasi otomatis dari redirect pembayaran. Hubungi kanal dukungan resmi untuk verifikasi; jangan kirim data kartu atau password.</p>
    </details>
   </section>
   <div className="activation-extras">
    <FillingExample />
    <details className="activation-maintenance">
     <summary>Ingin mulai dari nol?</summary>
     <PlanningReset />
    </details>
   </div>
   <Link href="/" className="activation-home">← Kembali ke beranda</Link>
  </div>
 </main>;
}
