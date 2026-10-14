"use client";
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useWorkspace } from '@/context/WorkspaceContext';
import { PlannerDialog } from './planner-dialog';

export function PlanningReset() {
 const {user}=useAuth();
 const {workspace,members,busy,resetPlanningContent,error}=useWorkspace();
 const [open,setOpen]=useState(false),[confirmation,setConfirmation]=useState(''),[pending,setPending]=useState(false),[message,setMessage]=useState('');
 const isOwner=members.some(m=>m.workspace_id===workspace?.id && m.user_id===user?.id && m.role==='owner');
 const close=()=>{if(!pending){setOpen(false);setConfirmation('');}};
 const submit=async()=>{
  if(pending || busy || !isOwner || confirmation!=='RESET RENCANA')return;
  setPending(true);setMessage('');
  const ok=await resetPlanningContent(confirmation);
  setPending(false);
  if(ok){setOpen(false);setConfirmation('');setMessage('Rencana berhasil dikosongkan. Identitas pernikahan dan workspace tetap tersimpan.');}
  else setMessage('Reset atau penyegaran belum dapat dipastikan. Muat ulang sebelum mencoba lagi; jangan anggap kegagalan jaringan berarti data belum dihapus.');
 };
 return <section className="my-4 rounded-2xl border border-rose-200 bg-white p-4 text-sm" aria-label="Mulai rencana dari nol">
  <h2 className="font-semibold">Mulai rencana dari nol</h2>
  <p className="mt-2">Reset isi rencana bersama, bukan membuat akun atau workspace baru. Cadangkan data penting terlebih dahulu; tidak ada tombol urungkan.</p>
  {isOwner ? <button type="button" disabled={busy || pending} className="mt-3 min-h-11 rounded-xl border border-rose-700 p-3 text-rose-800 disabled:opacity-50" onClick={()=>{setMessage('');setConfirmation('');setOpen(true);}}>Reset rencana dari nol</button> : <p className="mt-3">Hanya owner workspace yang dapat mereset rencana.</p>}
  {message && <p role="status" className="mt-3">{message}</p>}
  {open && <PlannerDialog title="Reset rencana dari nol" onClose={close}>
   <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-4 text-sm bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200">
    <h2 className="text-xl font-semibold text-rose-950">Reset rencana dari nol</h2>
    <p><strong>Owner dan pasangan sama-sama terdampak.</strong> Data berikut di workspace ini akan dihapus permanen sekaligus:</p>
    <ul className="list-disc pl-5"><li>Semua pos anggaran dan pengeluaran (budgets).</li><li>Semua tugas/checklist dan timeline (tasks).</li><li>Semua tamu, RSVP dan nomor kontak (guests).</li><li>Semua catatan kontribusi tabungan (savings_contributions).</li></ul>
    <p>Tetap disimpan: akun login, workspace, keanggotaan/pasangan, undangan, nama mempelai, tanggal pernikahan, target anggaran dan tabungan, rekening tabungan lama (savings_accounts), akses paket/entitlement, permintaan pembelian, referensi transaksi dan audit. Reset tidak membatalkan pembayaran atau memindahkan uang.</p>
    <p>Sepakati dahulu dengan pasangan dan cadangkan data penting. Tidak ada contoh yang ditambahkan setelah reset. Bila pasangan masih menyimpan data baru setelah reset, data tersebut dapat muncul kembali.</p>
    <label className="block">Ketik RESET RENCANA untuk melanjutkan<input className="block w-full mt-2 rounded-xl border p-3" value={confirmation} disabled={pending} autoComplete="off" onChange={e=>setConfirmation(e.target.value)} /></label>
    {error && <p role="alert">{error}</p>}
    {pending && <p role="status">Mereset rencana dan memuat ulang… Jangan tutup halaman.</p>}
    <div className="flex flex-wrap gap-3"><button type="button" className="min-h-11 border rounded-xl p-3" disabled={pending} onClick={close}>Batal</button><button type="button" className="min-h-11 rounded-xl p-3 bg-rose-700 text-white disabled:opacity-50" disabled={pending || busy || !isOwner || confirmation!=='RESET RENCANA'} onClick={()=>void submit()}>Hapus isi rencana</button></div>
   </div>
  </PlannerDialog>}
 </section>;
}
