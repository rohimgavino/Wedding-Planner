"use client";
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useWorkspace } from '@/context/WorkspaceContext';
import { PlannerDialog } from './planner-dialog';

export function EditableStarter() {
 const {user}=useAuth();
 const {workspace,members,busy,applyEditableStarter}=useWorkspace();
 const [open,setOpen]=useState(false),[confirmed,setConfirmed]=useState(false),[pending,setPending]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const lock=useRef(false);
 const identity=`${user?.id}:${workspace?.id}`;
 const current=useRef(identity);current.current=identity;
 const [captured,setCaptured]=useState('');
 useEffect(()=>{setOpen(false);setConfirmed(false);setMessage('');setError('');},[identity]);
 const isOwner=members.some(m=>m.workspace_id===workspace?.id && m.user_id===user?.id && m.role==='owner');
 const close=()=>{if(!lock.current){setOpen(false);setConfirmed(false);}};
 const submit=async()=>{
  if(lock.current || busy || !isOwner || !confirmed || captured!==identity)return;
  lock.current=true;setPending(true);setError('');setMessage('');
  try {
   const submitted=captured;
   const ok=await applyEditableStarter(workspace!.id,user!.id);
   if(current.current!==submitted)return;
   if(ok){setOpen(false);setConfirmed(false);setMessage('Template sudah diproses. Buka Timeline dan Budget untuk menyesuaikan rencana setelah akses core aktif. Pengulangan tidak menambahkan salinan.');}
   else setError('Template atau penyegaran belum dapat dipastikan. Data yang ada tidak dihapus. Muat ulang; pengulangan aman dari salinan ganda. Jika layanan belum tersedia, hubungi pengelola.');
  } catch {setError('Template belum dapat dipastikan. Muat ulang dan coba lagi; data yang ada tidak dihapus.');}
  finally {lock.current=false;setPending(false);}
 };
 return <section aria-label="Template awal" className="my-4 rounded-2xl border border-rose-200 bg-white p-4 text-sm">
  <h2 className="font-semibold">Template awal</h2>
  <p className="mt-2">Tambahkan sekali checklist persiapan dan kategori anggaran siap disesuaikan. Tidak mengganti atau menghapus data yang sudah ada. Tidak otomatis ditambahkan saat login atau reset.</p>
  <p className="mt-2">Penyediaan template gratis; membaca dan mengubah isi planner tetap memerlukan akses core aktif.</p>
  {isOwner ? <button type="button" disabled={busy || pending} className="mt-3 min-h-11 rounded-xl border border-rose-700 p-3 text-rose-800 disabled:opacity-50" onClick={()=>{setCaptured(identity);setError('');setMessage('');setConfirmed(false);setOpen(true);}}>Pratinjau template</button> : <p className="mt-3">Hanya owner workspace yang dapat menambahkan template.</p>}
  {message && <p role="status" className="mt-3">{message}</p>}
  {open && captured===identity && <PlannerDialog title="Template awal" onClose={close} resetSurface>
   <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 space-y-4 text-sm">
    <h2 className="text-xl font-semibold">Template awal</h2>
    <p>Ditambahkan ke rencana bersama untuk owner dan pasangan, satu kali per workspace. Setelah dihapus atau direset, template ini tidak dibuat ulang.</p>
    <h3 className="font-semibold">8 kategori anggaran · semua Rp0</h3>
    <p>Katering, Venue, Dekorasi, MUA &amp; Busana, Dokumentasi, Undangan &amp; Souvenir, Mahar &amp; Seserahan, Dana Darurat. Alokasi dan pengeluaran Rp0, belum dibayar. Bukan rekomendasi harga.</p>
    <h3 className="font-semibold">8 tugas persiapan · belum selesai</h3>
    <ul className="list-disc pl-5"><li>Sepakati prioritas dan batas anggaran</li><li>Susun kebutuhan dan kapasitas acara</li><li>Periksa persyaratan pencatatan pada instansi resmi</li><li>Bandingkan penawaran dan kontrak vendor</li><li>Susun daftar tamu nyata bersama keluarga</li><li>Siapkan undangan dan kebutuhan acara</li><li>Susun rundown dan pembagian PIC</li><li>Konfirmasi kesiapan keluarga dan vendor</li></ul>
    <p>Tahap relatif H-6 Bulan sampai H-1 Minggu dan Dokumen KUA hanya pengelompokan, tanpa tanggal jatuh tempo. Sesuaikan kebutuhan dan persyaratan resmi setempat. Tidak menambah tamu, vendor, pembayaran, atau kontribusi tabungan. Target dan akses paket tidak berubah.</p>
    <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} disabled={pending} onChange={e=>setConfirmed(e.target.checked)}/>Saya setuju menambahkan template tanpa mengubah data yang ada</label>
    {error && <p role="alert">{error}</p>}
    {pending && <p role="status">Menambahkan template dan memuat ulang…</p>}
    <div className="flex flex-wrap gap-3"><button type="button" className="min-h-11 border rounded-xl p-3" disabled={pending} onClick={close}>Batal</button><button type="button" className="min-h-11 rounded-xl p-3 bg-rose-700 text-white disabled:opacity-50" disabled={pending || busy || !confirmed || !isOwner} onClick={()=>void submit()}>Tambahkan template</button></div>
   </div>
  </PlannerDialog>}
 </section>;
}
