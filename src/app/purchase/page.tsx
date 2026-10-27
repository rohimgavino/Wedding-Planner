'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGate } from '@/components/auth-gate';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Commerce, SiteSettings, PurchaseRequest, validLynkURL } from '@/lib/commerce';
import { createClient } from '@/lib/supabase/client';
import { formatRupiah } from '@/lib/utils';
function PurchasePanel(){
 const {workspace,isLoaded,reload}=useWorkspace();
 const workspaceId=workspace?.id;
 const [settings,setSettings]=useState<SiteSettings|null>(null),[purchases,setPurchases]=useState<PurchaseRequest[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;setSettings(null);setPurchases([]);setError('');if(!workspaceId)return;const c=new Commerce(createClient());void Promise.all([c.settings(),c.purchases(workspaceId)]).then(([s,p])=>{if(active){setSettings(s);setPurchases(p);}}).catch(()=>{if(active)setError('Pembelian belum dapat dimuat. Penjualan ditutup sampai konfigurasi/schema tersedia.');});return()=>{active=false;};},[workspaceId]);
 const request=async()=>{if(!workspace || busy)return;setBusy(true);setError('');try{const c=new Commerce(createClient());await c.request(workspace.id);setPurchases(await c.purchases(workspace.id));}catch(e){setError(e instanceof Error ? e.message : 'Permintaan gagal.');}finally{setBusy(false);}};
 const available=!!(settings?.sales_enabled && settings.price_idr && settings.duration_days && settings.lynk_url && validLynkURL(settings.lynk_url) && settings.support_email);
 return <div className="max-w-2xl w-full mx-auto p-4 sm:p-8 space-y-5 break-words"><Link className="underline text-rose-700 min-h-11 inline-block" href="/dashboard">← Workspace</Link><section className="bg-white rounded-3xl border border-rose-100 p-6"><p className="text-xs tracking-widest text-rose-700">Pocket Planner · PAKET PER WORKSPACE</p><h1 className="font-serif text-3xl mt-2">Aktivasi paket inti</h1><p className="mt-3">Budget, checklist, tamu dan tabungan bersama untuk pasangan. Lamaran/Honeymoon belum tersedia dan tidak dapat dibeli.</p>
 {!isLoaded && <p role="status">Memuat workspace…</p>}{isLoaded && !workspace && <p>Buat workspace dahulu melalui <Link href="/onboarding" className="underline">onboarding</Link>.</p>}
 {error && <p role="alert" className="text-rose-800 mt-4">{error}</p>}
 {workspace && <><p className="mt-4 text-sm">Workspace: {workspace.title} · {workspace.id}</p>{!available ? <p className="mt-4 text-amber-900">Penjualan belum dikonfigurasi. Tidak ada pembayaran yang perlu dilakukan saat ini.</p> : <><p className="font-semibold mt-4">{formatRupiah(settings!.price_idr!)} · {settings!.duration_days} hari sejak aktivasi, untuk berdua.</p><button disabled={busy || purchases.some(p=>p.status==='pending')} onClick={()=>void request()} className="min-h-11 bg-rose-700 text-white rounded-xl px-4 py-3 mt-4 disabled:opacity-50">Buat permintaan pembelian</button></>}
 <p className="text-sm mt-4">Buat permintaan sebelum membayar. Catat ID permintaan dan workspace pada transaksi/kontak dukungan. Admin harus mencocokkan transaksi asli di dashboard Lynk.id. Screenshot, redirect, atau login tidak mengaktifkan akses. Jangan kirim kartu, password, kode OTP atau kunci pembayaran.</p>
 {settings?.support_email && <a className="underline inline-block mt-3 min-h-11" href={`mailto:${settings.support_email}`}>Dukungan: {settings.support_email}</a>}
 <div className="space-y-3 mt-4">{purchases.map(p=><article key={p.id} className="border rounded-2xl p-4"><strong>{p.status}</strong><p className="text-sm">ID permintaan: {p.id}</p><p>{formatRupiah(p.price_idr)} · {p.duration_days} hari</p>{p.review_note && <p>{p.review_note}</p>}{p.status==='pending' && validLynkURL(p.lynk_url) && <a className="inline-block min-h-11 underline text-rose-700 mt-2" href={p.lynk_url} target="_blank" rel="noopener noreferrer">Bayar di Lynk.id</a>}</article>)}</div>
 <button className="underline min-h-11 mt-3" disabled={busy} onClick={async()=>{if(!workspace)return;setBusy(true);try{setPurchases(await new Commerce(createClient()).purchases(workspace.id));await reload();}catch{setError('Status gagal dimuat. Coba lagi.');}finally{setBusy(false);}}}>Periksa status aktivasi</button></>}
 </section></div>;
}
export default function PurchasePage(){return <AuthGate><PurchasePanel/></AuthGate>;}
