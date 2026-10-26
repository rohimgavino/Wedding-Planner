"use client";
import { useState } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { savingsSummary } from '@/lib/savings';
import { formatRupiah } from '@/lib/utils';
export function SharedSavings() {
 const {workspace,savings,members,addSaving,updateSaving,deleteSaving,busy}=useWorkspace();
 const [editing,setEditing]=useState(''),[contributor,setContributor]=useState(''),[amount,setAmount]=useState(''),[date,setDate]=useState(''),[notes,setNotes]=useState('');
 if(!workspace)return null;
 const summary=savingsSummary(savings,Number(workspace.target_savings));
 const label=(id:string)=>members.find(m=>m.user_id===id)?.display_name || (members.find(m=>m.user_id===id)?.role==='owner'?'Pemilik workspace':'Pasangan');
 const reset=()=>{setEditing('');setContributor('');setAmount('');setDate('');setNotes('');};
 return <section className="bg-white rounded-3xl p-5 border border-rose-100 space-y-4" aria-label="Tabungan bersama">
  <h2 className="font-serif text-xl font-bold">Tabungan Bersama</h2>
  <p className="text-sm text-slate-600">Catatan kontribusi berdua, bukan rekening atau penitipan dana. Pocket Planner tidak menerima, menyimpan, atau memindahkan uang tabungan.</p>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
   <p>Total tercatat <strong className="block">{formatRupiah(summary.total)}</strong></p>
   <p>Target <strong className="block">{formatRupiah(Number(workspace.target_savings))}</strong></p>
   <p>Sisa target <strong className="block">{formatRupiah(summary.remaining)}</strong></p>
  </div>
  <progress aria-label="Progres tabungan" value={summary.progress} max={100} className="w-full" />
  <p className="text-sm">{summary.progress}% dari target {Number(workspace.target_savings)===0 && '(target belum ditentukan)'}</p>
  <ul className="text-sm space-y-2">{members.map(m=><li key={m.id}>{label(m.user_id)}: {formatRupiah(summary.byPartner[m.user_id]||0)}</li>)}</ul>
  <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={async e=>{
   e.preventDefault();const value=Number(amount);if(!Number.isSafeInteger(value)||value<=0)return;
   const item={contributor_id:contributor,amount:value,contributed_on:date,notes:notes.trim()};
   if(await (editing?updateSaving(editing,item):addSaving(item)))reset();
  }}>
   <label className="text-sm">Kontributor<select aria-label="Kontributor" required value={contributor} onChange={e=>setContributor(e.target.value)} className="block w-full border rounded-xl p-3"><option value="">Pilih pasangan</option>{members.map(m=><option key={m.id} value={m.user_id}>{label(m.user_id)}</option>)}</select></label>
   <label className="text-sm">Nominal (Rp)<input required type="number" min="1" max="9007199254740991" step="1" value={amount} onChange={e=>setAmount(e.target.value)} className="block w-full border rounded-xl p-3" /></label>
   <label className="text-sm">Tanggal kontribusi<input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="block w-full border rounded-xl p-3" /></label>
   <label className="text-sm">Catatan<input maxLength={500} value={notes} onChange={e=>setNotes(e.target.value)} className="block w-full border rounded-xl p-3" /></label>
   <button disabled={busy} className="min-h-11 rounded-xl bg-rose-500 text-white px-4">{editing?'Simpan perubahan':'Catat kontribusi'}</button>
   {editing && <button type="button" onClick={reset} className="min-h-11 border rounded-xl">Batal edit</button>}
  </form>
  {!savings.length && <p className="text-sm text-slate-500">Belum ada kontribusi. Mulai dengan catatan pertama.</p>}
  <ul className="space-y-3">{savings.map(row=><li key={row.id} className="border rounded-xl p-3 text-sm break-words">
   <strong>{formatRupiah(Number(row.amount))}</strong> · {label(row.contributor_id)} · {row.contributed_on}<p>{row.notes}</p>
   <div className="flex gap-3 mt-2"><button disabled={busy} className="min-h-11 px-3 border rounded-xl" onClick={()=>{setEditing(row.id);setContributor(row.contributor_id);setAmount(String(row.amount));setDate(row.contributed_on);setNotes(row.notes);}}>Edit kontribusi</button>
   <button disabled={busy} className="min-h-11 px-3 border rounded-xl text-rose-700" onClick={async()=>{if(window.confirm('Hapus catatan kontribusi ini?') && await deleteSaving(row.id) && editing===row.id)reset();}}>Hapus kontribusi</button></div>
  </li>)}</ul>
 </section>;
}
