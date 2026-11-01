'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Commerce, PurchaseRequest } from '@/lib/commerce';
import { createClient } from '@/lib/supabase/client';
import { formatRupiah } from '@/lib/utils';

export default function PurchasePage() {
 const { user } = useAuth();
 const { workspace } = useWorkspace();
 const workspaceId = workspace?.id;
 const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);
 const [error, setError] = useState('');
 useEffect(() => {
  let active = true;
  setPurchases([]); setError('');
  if (!user || !workspaceId) return;
  void new Commerce(createClient()).purchases(workspaceId).then(rows => {
   if (active) setPurchases(rows);
  }).catch(() => { if (active) setError('Riwayat belum dapat dimuat. Status pembayaran baru tetap belum tersedia.'); });
  return () => { active = false; };
 }, [user, workspaceId]);
 return <main className="max-w-2xl w-full mx-auto p-4 sm:p-8 space-y-5 break-words">
  <Link href="/" className="inline-flex min-h-11 items-center" aria-label="Pocket Planner — Beranda"><Image src="/images/pocket-planner-logo.png" alt="Pocket Planner" width={132} height={78} unoptimized /></Link>
  <section className="bg-white rounded-3xl border border-rose-100 p-6" aria-labelledby="purchase-title">
   <p className="text-xs tracking-widest text-rose-700">POCKET PLANNER · AKTIVASI</p>
   <h1 id="purchase-title" className="font-serif text-3xl mt-2">Pembayaran belum tersedia</h1>
   <p className="mt-3">Pembayaran baru hanya akan tersedia melalui DOKU. Checkout belum dibuka karena konfigurasi dan verifikasi backend pembayaran belum selesai.</p>
   <p className="mt-3">Tidak ada pembayaran yang perlu dilakukan saat ini. Kami tidak menerima pembelian baru melalui tautan pembayaran lain, transfer manual, atau permintaan verifikasi admin.</p>
   <p className="mt-3">Login, screenshot, dan redirect pembayaran tidak mengaktifkan akses. Akses yang sudah sah tetap mengikuti masa berlaku yang tercatat; riwayat lama tidak dihapus atau diubah menjadi transaksi DOKU.</p>
   <p className="mt-3 text-sm">Jangan kirim data kartu, password, kode OTP, atau kunci pembayaran.</p>
   <div className="mt-5 flex flex-wrap gap-3">
    <Link href={user ? '/dashboard' : '/login?next=%2Fdashboard'} className="min-h-11 inline-flex items-center rounded-xl bg-rose-700 px-4 py-3 text-white">{user ? 'Kembali ke workspace' : 'Masuk ke workspace'}</Link>
    <Link href="/" className="min-h-11 inline-flex items-center underline px-2">Kembali ke beranda</Link>
   </div>
  </section>
  {user && workspaceId && <section className="bg-white rounded-3xl border border-rose-100 p-6" aria-labelledby="history-title">
   <h2 id="history-title" className="font-serif text-2xl">Riwayat pembelian lama</h2>
   <p className="mt-2 text-sm">Baca-saja. Permintaan tertunda bukan bukti pembayaran atau aktivasi dan tidak dapat dilanjutkan melalui kanal lama.</p>
   {error && <p role="alert" className="mt-3">{error}</p>}
   <div className="space-y-3 mt-4">{purchases.map(p => <article key={p.id} className="border rounded-2xl p-4">
    <strong>{p.status}</strong><p className="text-sm">ID permintaan: {p.id}</p>
    <p>{formatRupiah(p.price_idr)} · {p.duration_days} hari (ketentuan historis)</p>
    {p.review_note && <p>{p.review_note}</p>}
   </article>)}</div>
  </section>}
 </main>;
}
