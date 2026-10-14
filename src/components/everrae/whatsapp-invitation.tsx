"use client";
import {useState,useEffect,createContext,useContext} from 'react';
import {useWorkspace} from '@/context/WorkspaceContext';
import {useAuth} from '@/context/auth-context';
import {PlannerDialog} from './planner-dialog';
import {buildInvitationMessage,invitationLink,safeMapsUrl,InvitationStyle,renderInvitationTemplate} from '@/lib/whatsapp';
type Defaults={style:InvitationStyle;time:string;zone:string;venue:string;address:string;maps:string;edited:string|null};
const TemplateContext=createContext<{value:Defaults|null;save:(v:Defaults)=>boolean}>({value:null,save:()=>false});
export function WhatsAppTemplateProvider({children}:{children:React.ReactNode}) {
 const {workspace}=useWorkspace();const {user}=useAuth();const key='everrae:wa-template:'+user?.id+':'+workspace?.id;
 const [saved,setSaved]=useState<{key:string;value:Defaults}|null>(null);
 useEffect(()=>{try{const raw=localStorage.getItem(key);if(raw){const v=JSON.parse(raw);if(['formal','islami','santai'].includes(v.style)&&['time','zone','venue','address','maps'].every(k=>typeof v[k]==='string')&&(v.edited===null||typeof v.edited==='string'))setSaved({key,value:v});}}catch{}},[key]);
 const save=(v:Defaults)=>{try{localStorage.setItem(key,JSON.stringify(v));setSaved({key,value:v});return true;}catch{return false;}};
 return <TemplateContext.Provider value={{value:saved?.key===key?saved.value:null,save}}>{children}</TemplateContext.Provider>;
}
export function WhatsAppInvitation({phone,guestName,coupleName,weddingDate,main=false}:{phone:string;guestName:string;coupleName:string;weddingDate:string;main?:boolean}) {
 const shared=useContext(TemplateContext);const [notice,setNotice]=useState('');
 const [open,setOpen]=useState(false),[style,setStyle]=useState<InvitationStyle>('formal');
 const [time,setTime]=useState(''),[zone,setZone]=useState('WIB'),[venue,setVenue]=useState(''),[address,setAddress]=useState(''),[maps,setMaps]=useState(''),[edited,setEdited]=useState<string|null>(null);
 const recommended=buildInvitationMessage({guestName,coupleName,weddingDate,style,time,timezone:zone,venue,address,mapsUrl:maps});
 const raw=edited ?? recommended;
 const message=main ? raw : renderInvitationTemplate(raw,{guestName,coupleName,weddingDate});
 const launch=()=>{const v=shared.value;if(v){setStyle(v.style);setTime(v.time);setZone(v.zone);setVenue(v.venue);setAddress(v.address);setMaps(v.maps);setEdited(v.edited);}setNotice('');setOpen(true);};
 let href='';try {href=invitationLink(phone,message);}catch{}
 const change=(action:()=>void)=>{if(edited!==null && !window.confirm('Ganti rekomendasi? Perubahan teks manual akan diganti.'))return;action();setEdited(null);};
 return <><button type="button" aria-label={main ? "Atur template WA utama" : `Susun undangan WhatsApp ${guestName}`} title="Susun undangan WhatsApp" onClick={launch} className="min-h-11 min-w-11 rounded-xl bg-emerald-700 p-2 text-white">{main ? "Atur template WA utama" : "WA"}</button>
 {open && <PlannerDialog title={`Undangan WhatsApp ${guestName}`} onClose={()=>setOpen(false)}><div className="p-5 space-y-4 text-sm">
 <h2 className="text-xl font-semibold">Rekomendasi undangan WhatsApp</h2><p>Pilih gaya, lalu ikuti teks rekomendasi atau edit sesuai kebutuhan. Tidak mengirim otomatis dan tidak mengubah RSVP.</p>
 <label className="block">Gaya undangan<select aria-label="Gaya undangan" className="block w-full border rounded-xl p-3" value={style} onChange={e=>change(()=>setStyle(e.target.value as InvitationStyle))}><option value="formal">Formal</option><option value="islami">Islami</option><option value="santai">Santai</option></select></label>
 <p>{main ? "Atur sekali untuk semua tamu. Tersimpan hanya di browser/perangkat ini untuk akun dan workspace ini, belum sinkron ke pasangan/perangkat lain. Gunakan {nama_tamu}, {pasangan}, {tanggal} pada teks agar otomatis menyesuaikan." : "Berawal dari template utama. Penyesuaian di sini hanya untuk tamu ini selama dialog dibuka dan tidak mengubah template utama."}</p>
 <label className="block">Waktu acara<input className="block w-full border rounded-xl p-3" value={time} placeholder="Misal: Akad 09.00; resepsi 11.00–14.00" onChange={e=>change(()=>setTime(e.target.value))}/></label>
 <label className="block">Zona waktu<select aria-label="Zona waktu" className="block w-full border rounded-xl p-3" value={zone} onChange={e=>change(()=>setZone(e.target.value))}>{['WIB','WITA','WIT'].map(z=><option key={z}>{z}</option>)}</select></label>
 <label className="block">Nama tempat<input className="block w-full border rounded-xl p-3" value={venue} onChange={e=>change(()=>setVenue(e.target.value))}/></label>
 <label className="block">Alamat lengkap<input className="block w-full border rounded-xl p-3" value={address} onChange={e=>change(()=>setAddress(e.target.value))}/></label>
 <label className="block">Tautan Google Maps<input type="url" className="block w-full border rounded-xl p-3" value={maps} onChange={e=>change(()=>setMaps(e.target.value))}/></label>
 {maps && !safeMapsUrl(maps) && <p role="alert">Gunakan tautan HTTPS Google Maps yang valid. Tautan ini tidak dimasukkan ke pesan.</p>}
 {(!time.trim() || !venue.trim() || !address.trim()) && <p role="status">Lengkapi waktu dan lokasi acara sebelum membuka WhatsApp. Informasi kosong tidak dikarang.</p>}
 <label className="block">Pratinjau teks undangan<textarea className="block w-full border rounded-xl p-3" rows={12} value={message} onChange={e=>setEdited(e.target.value)}/></label>
 <button className="min-h-11 border rounded-xl p-3" onClick={()=>change(()=>{})}>Gunakan teks rekomendasi</button>
 {notice && <p role="status">{notice}</p>}
 <div className="flex flex-wrap gap-3">{main && <button className="min-h-11 border rounded-xl p-3" onClick={()=>{const ok=shared.save({style,time,zone,venue,address,maps,edited});setNotice(ok ? "Template utama tersimpan di browser ini." : "Gagal menyimpan template. Penyimpanan browser tidak tersedia.");}}>Simpan template utama</button>}<button className="min-h-11 border rounded-xl p-3" onClick={()=>setOpen(false)}>Batal</button>{!main && href && time.trim() && venue.trim() && address.trim() && (!maps || safeMapsUrl(maps)) ? <a className="min-h-11 rounded-xl bg-emerald-700 p-3 text-white" href={href} target="_blank" rel="noopener noreferrer">Buka WhatsApp</a> : <button className="min-h-11 border rounded-xl p-3" disabled>Buka WhatsApp</button>}</div>
 <p>Pesan baru terkirim setelah Anda menekan Kirim di WhatsApp. Lokasi dibagikan sebagai tautan, bukan pin native.</p>
 </div></PlannerDialog>}</>;
}
