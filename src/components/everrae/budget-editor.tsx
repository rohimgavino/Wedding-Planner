"use client";
import { useState } from 'react';
import type { BudgetItem } from '@/types';
import { useWorkspace } from '@/context/WorkspaceContext';
import { validateBudget } from '@/lib/budget-validation';
import { PlannerDialog } from './planner-dialog';

export function BudgetEditor({ item, onClose }: { item: BudgetItem; onClose: () => void }) {
  const { updateBudget, busy, workspace } = useWorkspace();
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category);
  const [allocated, setAllocated] = useState(String(item.allocated_amount));
  const [spent, setSpent] = useState(String(item.spent_amount));
  const [status, setStatus] = useState(item.payment_status);
  const [notes, setNotes] = useState(item.notes ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const close = () => { if (!saving) onClose(); };
  const inputClass = 'block w-full min-h-11 rounded-xl border border-slate-300 p-3 mt-1';
  return <PlannerDialog title="Edit Pos Anggaran" onClose={close}>
    <form className="p-5 space-y-4 text-sm" noValidate onSubmit={async event => {
      event.preventDefault();
      if (saving || busy) return;
      setError('');
      const updates = { title, category, allocated_amount: Number(allocated), spent_amount: Number(spent), payment_status: status, notes };
      try {
        if (!allocated.trim() || !spent.trim()) throw new Error('Isi kedua nominal Rupiah.');
        validateBudget(updates);
        if (workspace?.id !== item.workspace_id) throw new Error('Workspace berubah. Tutup dan muat ulang data.');
        setSaving(true);
        if (await updateBudget(item.id, updates)) onClose();
        else setError('Perubahan belum berhasil dikonfirmasi. Isian tetap tersimpan di editor; periksa koneksi dan muat ulang sebelum mencoba lagi.');
      } catch (err) { setError(err instanceof Error ? err.message : 'Perubahan gagal disimpan.'); }
      finally { setSaving(false); }
    }}>
      <h2 className="font-bold text-lg">Edit Pos Anggaran</h2>
      <p className="text-slate-600">Plafon adalah estimasi, bukan tagihan. Status dipilih manual, bukan dihitung dari plafon. Belum DP: riil Rp0. Sudah DP / Lunas: riil lebih dari Rp0. Lunas boleh di bawah plafon. Tidak menyinkronkan pembayaran vendor.</p>
      <fieldset disabled={saving} className="space-y-3 min-w-0">
        <label className="block">Nama / Keterangan Pos<input className={inputClass} maxLength={150} value={title} onChange={e=>setTitle(e.target.value)}/></label>
        <label className="block">Kategori Pos<input className={inputClass} maxLength={50} value={category} onChange={e=>setCategory(e.target.value)}/></label>
        <label className="block">Plafon Alokasi (Rp)<input className={inputClass} type="number" min="0" step="1" value={allocated} onChange={e=>setAllocated(e.target.value)}/></label>
        <label className="block">Pengeluaran Riil (Rp)<input className={inputClass} type="number" min="0" step="1" value={spent} onChange={e=>setSpent(e.target.value)}/></label>
        <label className="block">Status Pembayaran<select aria-label="Status Pembayaran" className={inputClass} value={status} onChange={e=>setStatus(e.target.value as BudgetItem['payment_status'])}><option value="unpaid">Belum DP</option><option value="dp">Sudah DP</option><option value="paid">Lunas</option></select></label>
        <label className="block">Catatan<textarea aria-label="Catatan" className={inputClass} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
      </fieldset>
      {error && <p role="alert" className="text-rose-800">{error}</p>}
      <div className="flex gap-2"><button type="button" disabled={saving} className="min-h-11 flex-1 rounded-xl border p-3" onClick={close}>Batal</button><button type="submit" disabled={saving || busy} className="min-h-11 flex-1 rounded-xl bg-rose-600 text-white p-3">{saving ? 'Menyimpan…' : 'Simpan Perubahan'}</button></div>
    </form>
  </PlannerDialog>;
}
