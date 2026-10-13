"use client";
import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { GUEST_CATEGORIES, GUEST_RSVP, GuestCSVRow, guestDuplicateError, parseGuestCSV } from "@/lib/guest-csv";

export function GuestCSVImport() {
  const { guests, addGuests, busy } = useWorkspace();
  const [preview, setPreview] = useState<GuestCSVRow[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reading, setReading] = useState(false);
  const duplicate = guestDuplicateError(preview, guests);
  const buttonClass = "px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition inline-flex items-center gap-1.5";
  return <section className="space-y-3" aria-label="Impor tamu CSV">
    <div className="flex flex-wrap gap-2">
      <label className={buttonClass}><Upload size={14}/>Unggah CSV<input aria-label="Unggah CSV" type="file" accept=".csv,text/csv" disabled={reading} className="max-w-[180px] text-xs" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = "";
        setPreview([]); setError(""); setNotice("");
        if (!file) return;
        setReading(true);
        try {
          if (file.size > 1024 * 1024) throw new Error("Ukuran CSV maksimal 1 MB.");
          if (!file.name.toLowerCase().endsWith(".csv")) throw new Error("Pilih file .csv.");
          const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
          const rows = parseGuestCSV(text);
          const conflict = guestDuplicateError(rows, guests);
          if (conflict) throw new Error(conflict);
          setPreview(rows);
        } catch (err) { setError(err instanceof Error ? err.message : "CSV tidak dapat dibaca sebagai UTF-8."); }
        finally { setReading(false); }
      }}/></label>
      <a href="/templates/template-tamu.csv" download="template-tamu.csv" className={buttonClass}><Download size={14}/>Unduh Template CSV</a>
    </div>
    <details className="text-xs text-slate-600 bg-white border border-slate-200 rounded-xl p-3">
      <summary className="cursor-pointer font-semibold">Petunjuk format CSV</summary>
      <div className="space-y-2 mt-2 break-words">
        <p>Template berisi baris CONTOH, bukan tamu asli. Ganti atau hapus semua baris contoh sebelum mengunggah. Data hanya ditambahkan setelah pratinjau disetujui; data lama tidak ditimpa.</p>
        <p>Header dan urutan: Nama Tamu, Kategori Circle, Jumlah Pax, Nomor WhatsApp, Status RSVP. Nama, kategori, pax, dan RSVP wajib; WhatsApp boleh kosong. Kolom catatan tidak didukung.</p>
        <p>Kategori: {GUEST_CATEGORIES.join(", ")}.</p>
        <p>RSVP: {GUEST_RSVP.join(", ")} (belum dikontak, terkirim, hadir, berhalangan).</p>
        <p>Pax: bilangan bulat 1–10. WhatsApp: teks dengan awalan 08, 628, atau +628 (pertahankan nol awal; atur kolom sebagai Teks saat mengedit spreadsheet).</p>
        <p>Simpan CSV UTF-8 (BOM boleh), pemisah koma. Apit nilai berkoma dengan tanda kutip ganda; gandakan kutip di dalam nilai. Maksimal 1 MB / 1.000 tamu. Nama atau nomor yang sama diblokir, termasuk duplikat di dalam file.</p>
      </div>
    </details>
    {reading && <p role="status" className="text-xs">Membaca CSV…</p>}
    {(error || duplicate) && <p role="alert" className="text-xs text-red-700 break-words">{error || duplicate}</p>}
    {notice && <p role="status" className="text-xs text-emerald-800">{notice}</p>}
    {preview.length > 0 && <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
      <h4 className="font-semibold text-sm">Pratinjau: {preview.length} tamu akan ditambahkan</h4>
      <div className="max-h-64 overflow-auto text-xs"><table className="w-full text-left"><thead><tr>{["Nama", "Kategori", "Pax", "WhatsApp", "RSVP"].map(h => <th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{preview.map((g,i) => <tr key={i}><td className="p-2">{g.name}</td><td className="p-2">{g.category}</td><td className="p-2">{g.pax}</td><td className="p-2">{g.phone || "—"}</td><td className="p-2">{g.rsvp_status}</td></tr>)}</tbody></table></div>
      <div className="flex flex-wrap gap-2"><button className={buttonClass} onClick={() => { setPreview([]); setError(""); }}>Batal Impor</button><button className={buttonClass} disabled={!!duplicate || reading || busy} onClick={async () => {
        const conflict = guestDuplicateError(preview, guests);
        if (conflict) { setError(conflict); return; }
        if (!await addGuests(preview)) {setError("Impor cloud gagal. Data pratinjau tetap tersedia untuk dicoba lagi.");return;}
        setNotice(`${preview.length} tamu ditambahkan. Data lama tetap tersimpan.`); setPreview([]);
      }}>Tambahkan {preview.length} Tamu</button></div>
    </div>}
  </section>;
}
