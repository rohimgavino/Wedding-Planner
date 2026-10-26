import type { GuestItem } from "@/types";

export type GuestCSVRow = Pick<GuestItem, "name" | "category" | "pax" | "phone" | "rsvp_status">;
export const GUEST_CSV_HEADERS = ["Nama Tamu", "Kategori Circle", "Jumlah Pax", "Nomor WhatsApp", "Status RSVP"];
export const GUEST_CATEGORIES = ["keluarga_pria", "keluarga_wanita", "teman_kantor", "sahabat", "vip", "lainnya"] as const satisfies readonly GuestItem["category"][];
export const GUEST_RSVP = ["uncontacted", "sent", "attending", "declined"] as const satisfies readonly GuestItem["rsvp_status"][];

// Strict comma-separated CSV, including escaped quotes and quoted newlines.
export function parseGuestCSV(text: string): GuestCSVRow[] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false, closed = false;
  text = text.replace(/^\uFEFF/, "");
  const pushField = () => { row.push(field); field = ""; closed = false; };
  const pushRow = () => { pushField(); if (row.some(v => v.trim())) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closed = true; }
      } else field += ch;
    } else if (ch === ',') pushField();
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; pushRow(); }
    else if (ch === '"' && !field && !closed) quoted = true;
    else { if (closed || ch === '"') throw new Error("Tanda kutip CSV tidak valid."); field += ch; }
  }
  if (quoted) throw new Error("Tanda kutip CSV belum ditutup.");
  if (field || row.length || closed) pushRow();
  if (!rows.length || rows[0].length !== 5 || rows[0].some((h, i) => h !== GUEST_CSV_HEADERS[i])) throw new Error(`Header harus persis: ${GUEST_CSV_HEADERS.join(",")}. Gunakan pemisah koma, bukan titik koma.`);
  if (rows.length < 2) throw new Error("CSV belum berisi tamu.");
  if (rows.length > 1001) throw new Error("Maksimal 1.000 tamu per impor.");
  return rows.slice(1).map((values, index) => {
    const fail = (message: string): never => { throw new Error(`Baris data ${index + 1}: ${message}`); };
    if (values.length !== 5) fail("harus berisi 5 kolom.");
    const [name, category, pax, rawPhone, rsvp_status] = values.map(v => v.trim());
    const phone = rawPhone === "-" ? "" : rawPhone;
    if (!name) fail("nama wajib diisi.");
    if (!GUEST_CATEGORIES.some(v => v === category)) fail("kategori tidak dikenal.");
    if (!/^(?:[1-9]|10)$/.test(pax)) fail("Jumlah Pax harus bilangan bulat 1–10.");
    if (phone && !/^(?:08|628|\+628)\d{6,12}$/.test(phone)) fail("WhatsApp harus berupa teks 08xxx, 628xxx, atau +628xxx; boleh kosong.");
    if (!GUEST_RSVP.some(v => v === rsvp_status)) fail("Status RSVP tidak dikenal.");
    return { name, category: category as GuestItem["category"], pax: Number(pax), phone, rsvp_status: rsvp_status as GuestItem["rsvp_status"] };
  });
}

export function guestDuplicateError(rows: GuestCSVRow[], existing: GuestCSVRow[]): string | null {
  const names = new Set(existing.map(g => g.name.trim().toLocaleLowerCase("id-ID")));
  const phones = new Set(existing.filter(g => g.phone).map(g => g.phone!.replace(/^\+/, "").replace(/^0/, "62")));
  for (const guest of rows) {
    const name = guest.name.trim().toLocaleLowerCase("id-ID");
    const phone = (guest.phone || "").replace(/^\+/, "").replace(/^0/, "62");
    if (names.has(name) || (phone && phones.has(phone))) return `Duplikat nama atau WhatsApp: ${guest.name}. Periksa CSV dan tamu tersimpan; tidak ada data yang ditambahkan.`;
    names.add(name); if (phone) phones.add(phone);
  }
  return null;
}

export function serializeGuestCSV(guests: GuestCSVRow[]): string {
  const quote = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return "\uFEFF" + [GUEST_CSV_HEADERS.join(","), ...guests.map(g => [g.name, g.category, g.pax, g.phone || "", g.rsvp_status].map(quote).join(","))].join("\r\n") + "\r\n";
}
