"use client";
import {useState} from 'react';
import {useWorkspace} from '@/context/WorkspaceContext';
import {indonesiaDate,installmentPaid,installmentRemaining,vendorTotals,weeklyPriorities} from '@/lib/vendor-planning';
import {formatRupiah} from '@/lib/utils';
import {PlannerDialog} from './planner-dialog';
type Table='vendors'|'vendor_installments'|'vendor_payments';
type Editor={table:Table;id?:string;parent?:string;values:Record<string,string|number>};
export function WeeklyPriorities({navigate}:{navigate:(tab:'tasks'|'vendors')=>void}) {
 const {tasks,installments,payments}=useWorkspace();const items=weeklyPriorities(tasks,installments,payments);
 return <section className="my-4 rounded-2xl border bg-white p-4" aria-label="Prioritas minggu ini"><h2 className="font-semibold">Prioritas minggu ini</h2><p className="text-sm">Terlambat dahulu, lalu hingga 7 hari ke depan (WIB / Asia/Jakarta). Hanya tanggal yang Anda catat.</p>
 {items.length?<ul>{items.map(p=><li key={p.source+p.id} className="my-2 border-b py-2"><strong>{p.title}</strong><p className="text-sm">{p.source} · {p.date} · {p.overdue?'Terlambat':'Mendatang'}</p><button className="min-h-11 underline" onClick={()=>navigate(p.action)}>Buka {p.source}</button></li>)}</ul>:<p className="mt-3">Tidak ada tenggat tercatat yang terlambat atau dalam 7 hari. Tambahkan tanggal tugas atau termin bila sudah disepakati.</p>}</section>;
}
export function VendorPlanning() {
 const {vendors,installments,payments,busy,saveVendorRecord,deleteVendorRecord}=useWorkspace();
 const [editor,setEditor]=useState<Editor|null>(null),[invalid,setInvalid]=useState('');
 const open=(value:Editor)=>{setInvalid('');setEditor(value);};
 const fields=editor?.table==='vendors'?[['name','Nama vendor','text',200],['contact_name','Kontak vendor','text',200],['contact_phone','Nomor kontak','text',100],['contract_total','Total kontrak (Rp)','number',0],['contract_notes','Catatan kontrak','text',4000]]:editor?.table==='vendor_installments'?[['title','Judul termin','text',200],['amount','Jumlah (Rp)','number',0],['due_date','Jatuh tempo','date',0]]:[['amount','Jumlah (Rp)','number',0],['paid_on','Tanggal pembayaran','date',0],['notes','Catatan pembayaran','text',4000]];
 const submit=async(e:React.FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(!editor||busy)return;
  const data=Object.fromEntries(new FormData(e.currentTarget).entries());const amount=Number(data[editor.table==='vendors'?'contract_total':'amount']);
  if(!Number.isSafeInteger(amount)||amount<(editor.table==='vendors'?0:1)){setInvalid('Gunakan Rupiah bulat yang aman dan valid.');return;}
  const item:Record<string,unknown>={...data,[editor.table==='vendors'?'contract_total':'amount']:amount};
  if(editor.table==='vendor_installments')item.vendor_id=editor.parent;
  if(editor.table==='vendor_payments')item.installment_id=editor.parent;
  if(await saveVendorRecord(editor.table,item,editor.id))setEditor(null);
 };
 const remove=(table:Table,id:string)=>{if(window.confirm('Hapus catatan ini? Vendor/termin juga menghapus catatan turunannya. Tidak memindahkan uang.'))void deleteVendorRecord(table,id);};
 return <section className="space-y-4" aria-label="Vendor & Pembayaran"><h1 className="text-2xl font-semibold">Vendor & Pembayaran</h1><p>Pembukuan manual, bukan bukti bank, transfer atau pemrosesan uang. Total kontrak, jadwal termin dan pembayaran tercatat terpisah. Tidak otomatis menambah pengeluaran anggaran.</p><p>Tanggal tanpa jam menggunakan WIB. Nilai sisa negatif berarti pembayaran tercatat melebihi kontrak; periksa catatan Anda.</p>
 <button disabled={busy} className="min-h-11 border rounded-xl p-3 bg-white" onClick={()=>open({table:'vendors',values:{}})}>Tambah vendor</button>
 {!vendors.length&&<p>Belum ada vendor. Catat kesepakatan nyata Anda; tidak ada pembayaran contoh.</p>}
 {vendors.map(v=>{const total=vendorTotals(v,installments,payments);return <article key={v.id} className="rounded-2xl border bg-white p-4 space-y-3 break-words"><h2 className="font-semibold">{v.name}</h2><p>{v.contact_name} {v.contact_phone}</p><p className="whitespace-pre-wrap">{v.contract_notes}</p><dl className="grid grid-cols-2 gap-3">{Object.entries({Kontrak:total.contract,Terjadwal:total.scheduled,'Dibayar tercatat':total.paid,'Sisa kontrak':total.remaining}).map(([k,n])=><div key={k}><dt>{k}</dt><dd>{formatRupiah(n)}</dd></div>)}</dl>
 <div className="flex flex-wrap gap-2"><button disabled={busy} className="min-h-11 border p-2 rounded-lg" onClick={()=>open({table:'vendors',id:v.id,values:{...v}})}>Edit vendor</button><button disabled={busy} className="min-h-11 border p-2 rounded-lg" onClick={()=>remove('vendors',v.id)}>Hapus vendor</button><button disabled={busy} className="min-h-11 border p-2 rounded-lg" onClick={()=>open({table:'vendor_installments',parent:v.id,values:{}})}>Tambah termin</button></div>
 {installments.filter(i=>i.vendor_id===v.id).map(i=>{const paid=installmentPaid(i.id,payments),remaining=installmentRemaining(i.amount,paid);return <section key={i.id} className="border rounded-xl p-3 space-y-2"><h3 className="font-semibold">{i.title}</h3><p>Jatuh tempo: {i.due_date} · {remaining===0?'Lunas tercatat':i.due_date<indonesiaDate()?'Terlambat':'Belum lunas'}</p><p>Termin: {formatRupiah(i.amount)} · Dibayar: {formatRupiah(paid)}</p><p>Sisa termin: {formatRupiah(remaining)}</p><div className="flex flex-wrap gap-2"><button disabled={busy} className="min-h-11 border p-2" onClick={()=>open({table:'vendor_installments',id:i.id,parent:v.id,values:{...i}})}>Edit termin</button><button disabled={busy} className="min-h-11 border p-2" onClick={()=>remove('vendor_installments',i.id)}>Hapus termin</button><button disabled={busy} className="min-h-11 border p-2" onClick={()=>open({table:'vendor_payments',parent:i.id,values:{}})}>Catat pembayaran</button></div>
 {payments.filter(p=>p.installment_id===i.id).map(p=><div key={p.id} className="border-t pt-2"><p>{p.paid_on} · {formatRupiah(p.amount)} · {p.notes}</p><button disabled={busy} className="min-h-11 underline mr-3" onClick={()=>open({table:'vendor_payments',id:p.id,parent:i.id,values:{...p}})}>Edit pembayaran</button><button disabled={busy} className="min-h-11 underline" onClick={()=>remove('vendor_payments',p.id)}>Hapus pembayaran</button></div>)}</section>;})}</article>;})}
 {editor&&<PlannerDialog title="Catatan vendor" onClose={()=>{if(!busy)setEditor(null);}}><form onSubmit={submit} className="w-full max-w-lg max-h-[85vh] overflow-auto rounded-2xl border bg-white p-6 space-y-3"><h2 className="font-semibold">Catatan vendor</h2><p>Pencatatan manual saja. Tidak mengirim uang.</p>{fields.map(([key,label,type,max])=><label className="block" key={key}>{label}<input className="block w-full border rounded-xl p-3" name={String(key)} defaultValue={editor.values[String(key)]??''} type={String(type)} maxLength={Number(max)||undefined} min={type==='number'?(editor.table==='vendors'?0:1):type==='date'?'1900-01-01':undefined} max={type==='number'?Number.MAX_SAFE_INTEGER:type==='date'?'9999-12-31':undefined} step={type==='number'?1:undefined} required={['name','contract_total','title','amount','due_date','paid_on'].includes(String(key))}/></label>)}{invalid&&<p role="alert">{invalid}</p>}<div className="flex gap-3"><button type="button" disabled={busy} className="min-h-11 border p-3" onClick={()=>setEditor(null)}>Batal</button><button disabled={busy} className="min-h-11 border p-3">Simpan catatan</button></div></form></PlannerDialog>}
 </section>;
}
