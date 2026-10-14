"use client";
import {useState} from 'react';
import {PlannerDialog} from './planner-dialog';
import {buildInvitationMessage,invitationLink,safeMapsUrl,InvitationStyle} from '@/lib/whatsapp';
export function WhatsAppInvitation({phone,guestName,coupleName,weddingDate}:{phone:string;guestName:string;coupleName:string;weddingDate:string}) {
 const [open,setOpen]=useState(false),[style,setStyle]=useState<InvitationStyle>('formal');
 const [time,setTime]=useState(''),[zone,setZone]=useState('WIB'),[venue,setVenue]=useState(''),[address,setAddress]=useState(''),[maps,setMaps]=useState(''),[edited,setEdited]=useState<string|null>(null);
 const recommended=buildInvitationMessage({guestName,coupleName,weddingDate,style,time,timezone:zone,venue,address,mapsUrl:maps});
 const message=edited ?? recommended;
 let href='';try {href=invitationLink(phone,message);}catch{}
 const change=(action:()=>void)=>{if(edited!==null && !window.confirm('Ganti rekomendasi? Perubahan teks manual akan diganti.'))return;action();setEdited(null);};
 return <><button type="button" aria-label={`Susun undangan WhatsApp ${guestName}`} title="Susun undangan WhatsApp" onClick={()=>setOpen(true)} className="min-h-11 min-w-11 rounded-xl bg-emerald-700 p-2 text-white">WA</button>
 {open && <PlannerDialog title={`Undangan WhatsApp ${guestName}`} onClose={()=>setOpen(false)}><div className="p-5 space-y-4 text-sm">
 <h2 className="text-xl font-semibold">Rekomendasi undangan WhatsApp</h2><p>Pilih gaya, lalu ikuti teks rekomendasi atau edit sesuai kebutuhan. Tidak mengirim otomatis dan tidak mengubah RSVP.</p>
 <label className="block">Gaya undangan<select aria-label="Gaya undangan" className="block w-full border rounded-xl p-3" value={style} onChange={e=>change(()=>setStyle(e.target.value as InvitationStyle))}><option value="formal">Formal</option><option value="islami">Islami</option><option value="santai">Santai</option></select></label>
 <p>Detail di bawah hanya untuk draft ini, belum disimpan ke cloud. Isi kembali saat membuka tamu lain atau memuat ulang halaman.</p>
 <label className="block">Waktu acara<input className="block w-full border rounded-xl p-3" value={time} placeholder="Misal: Akad 09.00; resepsi 11.00–14.00" onChange={e=>change(()=>setTime(e.target.value))}/></label>
 <label className="block">Zona waktu<select aria-label="Zona waktu" className="block w-full border rounded-xl p-3" value={zone} onChange={e=>change(()=>setZone(e.target.value))}>{['WIB','WITA','WIT'].map(z=><option key={z}>{z}</option>)}</select></label>
 <label className="block">Nama tempat<input className="block w-full border rounded-xl p-3" value={venue} onChange={e=>change(()=>setVenue(e.target.value))}/></label>
 <label className="block">Alamat lengkap<input className="block w-full border rounded-xl p-3" value={address} onChange={e=>change(()=>setAddress(e.target.value))}/></label>
 <label className="block">Tautan Google Maps<input type="url" className="block w-full border rounded-xl p-3" value={maps} onChange={e=>change(()=>setMaps(e.target.value))}/></label>
 {maps && !safeMapsUrl(maps) && <p role="alert">Gunakan tautan HTTPS Google Maps yang valid. Tautan ini tidak dimasukkan ke pesan.</p>}
 {(!time.trim() || !venue.trim() || !address.trim()) && <p role="status">Lengkapi waktu dan lokasi acara sebelum membuka WhatsApp. Informasi kosong tidak dikarang.</p>}
 <label className="block">Pratinjau teks undangan<textarea className="block w-full border rounded-xl p-3" rows={12} value={message} onChange={e=>setEdited(e.target.value)}/></label>
 <button className="min-h-11 border rounded-xl p-3" onClick={()=>change(()=>{})}>Gunakan teks rekomendasi</button>
 <div className="flex flex-wrap gap-3"><button className="min-h-11 border rounded-xl p-3" onClick={()=>setOpen(false)}>Batal</button>{href && time.trim() && venue.trim() && address.trim() && (!maps || safeMapsUrl(maps)) ? <a className="min-h-11 rounded-xl bg-emerald-700 p-3 text-white" href={href} target="_blank" rel="noopener noreferrer">Buka WhatsApp</a> : <button className="min-h-11 border rounded-xl p-3" disabled>Buka WhatsApp</button>}</div>
 <p>Pesan baru terkirim setelah Anda menekan Kirim di WhatsApp. Lokasi dibagikan sebagai tautan, bukan pin native.</p>
 </div></PlannerDialog>}</>;
}
