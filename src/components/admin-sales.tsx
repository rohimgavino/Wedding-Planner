'use client';
import {useEffect,useRef,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import {readSales,formatSalesRupiah,SalesReport} from '@/lib/admin-sales';
export function AdminSales(){
 const [from,setFrom]=useState(''),[to,setTo]=useState(''),[search,setSearch]=useState('');
 const [report,setReport]=useState<SalesReport|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const serial=useRef(0);
 const load=async()=>{
  const id=++serial.current;setLoading(true);setError('');setReport(null);
  try{const r=await readSales(createClient(),{from,to,search});if(id===serial.current)setReport(r);}
  catch(e){if(id===serial.current)setError((e instanceof Error?e.message:'Laporan gagal.')+' Data lama tidak ditampilkan; coba muat ulang.');}
  finally{if(id===serial.current)setLoading(false);}
 };
 useEffect(()=>{void load();return()=>{serial.current++;};},[]); // eslint-disable-line react-hooks/exhaustive-deps
 return <section className="admin-sales">
 <div className="admin-sales-notice"><span className="admin-status">Manual / historis · bukan DOKU</span><p>Gross tercatat, bukan bukti dana bank. Biaya, payout, refund, laba & neto belum tersedia — bukan Rp0.</p></div>
 {report && <div className="admin-kpis admin-sales-kpis"><article className="border rounded-xl p-4"><h3>Gross penjualan tercatat</h3><strong data-testid="gross-sales">{formatSalesRupiah(report.gross_idr)}</strong></article><article className="border rounded-xl p-4"><h3>Transaksi tercatat</h3><strong>{report.sale_count}</strong></article></div>}
 <form onSubmit={e=>{e.preventDefault();void load();}} className="admin-filterbar">
 <label>Dari tanggal verifikasi (WIB)<input type="date" className="w-full min-w-0 min-h-11 border rounded-xl p-3" value={from} onChange={e=>setFrom(e.target.value)}/></label>
 <label>Sampai tanggal verifikasi (WIB)<input type="date" className="w-full min-w-0 min-h-11 border rounded-xl p-3" value={to} onChange={e=>setTo(e.target.value)}/></label>
 <label>Cari ID / referensi<input maxLength={100} className="w-full min-h-11 border rounded-xl p-3" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 <button disabled={loading} className="min-h-11 rounded-xl px-4 py-3 bg-rose-700 text-white disabled:opacity-50">Terapkan filter</button>
 </form>
 {loading && <p role="status">Memuat laporan penjualan…</p>}
 {error && <p role="alert" className="bg-rose-50 p-3 rounded-xl">{error}</p>}
 {report && <>
 <p>Agregat seluruh hasil filter di server, bukan hanya halaman. Diperbarui: {report.generated_at}. Snapshot dapat menjadi usang.</p>
 <p>{report.excluded_verified} record berstatus verified tidak memenuhi bukti minimum dan dikecualikan (sesuai filter).</p>
 {!report.sale_count && <p>Belum ada penjualan tercatat untuk filter ini.</p>}
 <section className="admin-panel admin-sales-records"><div className="admin-section-title"><h2>Hasil penjualan historis</h2><span className="admin-status">Read-only</span></div><p>Rincian terbaru — maksimal 50 dari {report.sale_count}</p><div className="admin-table-wrap"><table><thead><tr><th>Permintaan / workspace</th><th>Referensi transaksi</th><th>Verifikasi</th><th>Nominal tercatat</th></tr></thead><tbody>{report.rows.map(r=><tr key={r.id}><td data-label="Permintaan / workspace"><strong>{r.id}</strong><small>{r.workspace_id}</small></td><td data-label="Referensi">{r.transaction_reference}</td><td data-label="Verifikasi">{r.verified_at}</td><td data-label="Nominal">{formatSalesRupiah(r.price_idr)}</td></tr>)}</tbody></table></div></section>
 </>}
 <details className="admin-disclosure"><summary>Definisi penjualan & ketentuan filter</summary><p>Catatan manual/historis (schema Lynk), bukan DOKU. Hanya permintaan verified dengan petugas, tanggal verifikasi dan referensi registry transaksi yang cocok dihitung. Pending, penolakan, entitlement kedaluwarsa dan grant uji bukan penjualan.</p><p>DOKU belum terintegrasi. Gross adalah nominal snapshot permintaan tercatat, bukan bukti dana diterima bank. Biaya, payout, refund, laba dan pendapatan neto: belum tersedia, bukan Rp0.</p><p>Tanggal inklusif Asia/Jakarta, berdasarkan verifikasi, bukan tanggal request. Tanpa tanggal: seluruh catatan yang memenuhi syarat. Filter berlaku setelah diterapkan; muat ulang berkala, bukan realtime.</p></details></section>;
}
