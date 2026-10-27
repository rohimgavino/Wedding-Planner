'use client';
import {useEffect,useState} from 'react';
import {AuthGate} from '@/components/auth-gate';
import {AdminShell} from '@/components/admin-shell';
import {useAuth} from '@/context/auth-context';
import {createClient} from '@/lib/supabase/client';
import {readAdminRole} from '@/lib/admin-readonly';
import '../app/admin/admin.css';
function Panel(){
 const {user}=useAuth();const [menu,setMenu]=useState('Ringkasan');
 const [role,setRole]=useState<'operator'|'developer'|null>(null),[state,setState]=useState('loading');
 const [reload,setReload]=useState(0);
 useEffect(()=>{let active=true;setState('loading');setRole(null);
 void(async()=>{try{const r=await readAdminRole(createClient());if(active){setRole(r);setState(r?'allowed':'denied');}}catch{if(active)setState('denied');}})();return()=>{active=false;};},[user?.id,reload]);
 if(state==='loading')return <p role="status">Memvalidasi hak admin…</p>;
 if(state!=='allowed')return <section className="p-6"><h1>Akses admin ditolak.</h1><p role="alert">Identitas atau schema admin tidak dapat divalidasi. Login Google tidak memberi hak admin.</p></section>;
 const unavailable:Record<string,string>={'Penjualan':'Agregat penjualan belum tersedia dalam kandidat ini. Tidak ada total pendapatan ditampilkan.','Paket & Harga':'Pengelolaan harga ditahan. Persetujuan harga dan durasi tidak mengaktifkan checkout atau hak paket. Tahun kalender tidak dikonversi otomatis menjadi 365 hari.','Workspace & Masa Akses':'RPC metadata operasional belum tersedia dalam kandidat ini. Tidak ada isi planner tenant lain atau perkiraan masa akses.','Akses Admin':'Pengelolaan role dan grant ditahan. Otorisasi backend tidak diubah.'};
 return <AdminShell menu={menu} onMenu={setMenu} role={role}>
 <p className="admin-fineprint">Tahap UI baca-saja. Pembayaran, penjualan baru, perubahan harga, role dan aktivasi akses tidak tersedia di rilis ini. DOKU belum terintegrasi.</p>
 <button className="min-h-11 rounded-xl border px-4 py-3" onClick={()=>setReload(v=>v+1)}>Muat ulang hak admin</button>
 {menu==='Ringkasan'&&<section className="admin-panel"><h2>Operasional baca-saja</h2><p>Hak admin tervalidasi. Metrik belum tersedia; tidak ada angka nol atau tren buatan. Data planner pasangan tetap privat.</p><p>Gross historis bukan net, settlement atau bukti dana bank.</p></section>}
 {unavailable[menu]&&<section className="admin-panel"><h2>{menu} — belum tersedia</h2><p>{unavailable[menu]}</p></section>}
 {menu==='Audit'&&<section className="admin-panel"><h2>Audit — belum tersedia</h2><p>Pembacaan audit historis ditahan sampai kontrak dan otorisasi hosted diverifikasi.</p></section>}
 </AdminShell>;
}
export default function AdminReleasePage(){return <AuthGate><Panel/></AuthGate>;}
