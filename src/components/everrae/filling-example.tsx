"use client";
import { formatRupiah } from '@/lib/utils';

/** Read-only guidance: no form defaults, database writes or sample seeding. */
export function FillingExample() {
 return <details className="my-4 rounded-2xl border border-rose-200 bg-white p-4 text-sm text-slate-700">
  <summary className="cursor-pointer min-h-11 font-semibold text-rose-800">Contoh pengisian</summary>
  <p className="mt-3">Semua nama, tanggal, dan nominal berikut fiktif, bukan harga paket atau rekomendasi biaya. Contoh hanya untuk dibaca; tidak mengisi formulir atau menyimpan data ke workspace.</p>
  <ol className="list-decimal pl-5 mt-3 space-y-3">
   <li><strong>Raka &amp; Nisa (fiktif)</strong>: isi nama kedua mempelai di langkah Mempelai.</li>
   <li>Tanggal contoh: <strong>20 Juni 2027</strong> (2027-06-20). Pilih tanggal acara kalian di langkah Tanggal.</li>
   <li>Target anggaran contoh <strong>{formatRupiah(80000000)}</strong>; target tabungan <strong>{formatRupiah(60000000)}</strong>. Target adalah rencana, bukan saldo atau kontribusi yang sudah masuk.</li>
   <li>Budget → Tambah: kategori Katering, judul “Katering contoh”, alokasi {formatRupiah(20000000)}, terpakai {formatRupiah(5000000)}, status DP. Terpakai mencatat pengeluaran nyata, bukan target.</li>
   <li>Timeline → Tambah: “Survei tempat contoh”, fase H-6 Bulan, PIC berdua. Tandai selesai hanya setelah benar-benar dikerjakan.</li>
   <li>Tamu → Tambah: “Tamu Contoh” (fiktif), kategori Sahabat, 2 pax, belum dihubungi. Tidak perlu memasukkan nomor telepon untuk belajar.</li>
   <li>Tabungan → Catat kontribusi: pilih anggota workspace yang menyetor, nominal contoh {formatRupiah(1000000)}, tanggal contoh 14 Oktober 2026. Ini hanya catatan kontribusi, bukan transfer atau saldo bank.</li>
  </ol>
  <p className="mt-3">Mulai dengan data kalian sendiri. Tidak ada contoh yang ditambahkan otomatis saat login. Data planner yang kalian simpan akan terlihat oleh pasangan; akses paket inti mengikuti aktivasi workspace.</p>
 </details>;
}
