"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Crown, ArrowRight, Lock, PiggyBank } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { savingsSummary, entitlementActive } from '@/lib/savings';
import { formatRupiah } from '@/lib/utils';

export function SharedSavings() {
  const {
    workspace,
    savings,
    members,
    addSaving,
    updateSaving,
    deleteSaving,
    busy,
    entitlements,
    developerTestAccess
  } = useWorkspace();

  const [editing, setEditing] = useState('');
  const [contributor, setContributor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  // Entitlement Check: Premium or Wedding Pro or developer test
  const isEligible = 
    entitlementActive(entitlements, 'premium') || 
    entitlementActive(entitlements, 'wedding_pro') || 
    entitlementActive(entitlements, 'shared_savings') || 
    developerTestAccess;

  if (!workspace) return null;

  const summary = savingsSummary(savings, Number(workspace.target_savings));
  const label = (id: string) => members.find(m => m.user_id === id)?.display_name || (members.find(m => m.user_id === id)?.role === 'owner' ? 'Pemilik workspace' : 'Pasangan');
  const reset = () => {
    setEditing('');
    setContributor('');
    setAmount('');
    setDate('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Starter Tier Preview / Upgrade Banner */}
      {!isEligible && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>Fitur Eksklusif Paket Premium &amp; Wedding Pro</span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold">
              Tabungan Bersama &amp; Target Finansial Berdua
            </h3>
            <p className="text-xs sm:text-sm text-rose-100 leading-relaxed">
              Anda sedang melihat mode pratinjau Tabungan Bersama. Tingkatkan ke paket Premium atau Wedding Pro untuk mengaktifkan pencatatan kontribusi tabungan kedua pasangan, visualisasi progres target, dan transparansi dana hari bahagia.
            </p>
          </div>
          <Link
            href="/purchase"
            className="px-5 py-3 rounded-2xl bg-white text-rose-900 font-bold text-xs shadow-md hover:bg-rose-50 transition flex items-center justify-center gap-2 shrink-0 self-start md:self-center"
          >
            <span>Upgrade ke Premium</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <section className="bg-white rounded-3xl p-5 border border-rose-100 space-y-4" aria-label="Tabungan bersama">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold flex items-center gap-2">
              <PiggyBank className="text-rose-500 w-6 h-6" />
              <span>Tabungan Bersama</span>
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Catatan kontribusi berdua, bukan rekening atau penitipan dana. Pocket Planner tidak menerima, menyimpan, atau memindahkan uang tabungan.
            </p>
          </div>
          {!isEligible && (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1 shrink-0">
              <Lock size={12} /> Mode Pratinjau
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500">Total tercatat</span>
            <strong className="block text-base text-slate-800">{formatRupiah(summary.total)}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500">Target tabungan</span>
            <strong className="block text-base text-slate-800">{formatRupiah(Number(workspace.target_savings))}</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500">Sisa target</span>
            <strong className="block text-base text-rose-600">{formatRupiah(summary.remaining)}</strong>
          </div>
        </div>

        <progress aria-label="Progres tabungan" value={summary.progress} max={100} className="w-full h-3 rounded-full overflow-hidden" />
        <p className="text-xs text-slate-500">{summary.progress}% dari target {Number(workspace.target_savings) === 0 && '(target belum ditentukan di profil)'}</p>

        <ul className="text-xs space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <span className="font-semibold text-slate-700 block mb-1">Rincian Kontribusi Pasangan:</span>
          {members.map(m => (
            <li key={m.id} className="text-slate-600 flex justify-between">
              <span>{label(m.user_id)}</span>
              <strong>{formatRupiah(summary.byPartner[m.user_id] || 0)}</strong>
            </li>
          ))}
        </ul>

        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100"
          onSubmit={async e => {
            e.preventDefault();
            if (!isEligible) return;
            const value = Number(amount);
            if (!Number.isSafeInteger(value) || value <= 0) return;
            const item = { contributor_id: contributor, amount: value, contributed_on: date, notes: notes.trim() };
            if (await (editing ? updateSaving(editing, item) : addSaving(item))) reset();
          }}
        >
          <label className="text-xs font-medium text-slate-700">
            Kontributor
            <select
              aria-label="Kontributor"
              required
              disabled={!isEligible || busy}
              value={contributor}
              onChange={e => setContributor(e.target.value)}
              className="block w-full border border-slate-300 bg-white rounded-xl p-2.5 text-sm mt-1 outline-none focus:border-rose-500 disabled:opacity-60 disabled:bg-slate-100"
            >
              <option value="">Pilih pasangan</option>
              {members.map(m => <option key={m.id} value={m.user_id}>{label(m.user_id)}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-700">
            Nominal (Rp)
            <input
              required
              type="number"
              min="1"
              max="9007199254740991"
              step="1"
              disabled={!isEligible || busy}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Contoh: 1500000"
              className="block w-full border border-slate-300 bg-white rounded-xl p-2.5 text-sm mt-1 outline-none focus:border-rose-500 disabled:opacity-60 disabled:bg-slate-100"
            />
          </label>
          <label className="text-xs font-medium text-slate-700">
            Tanggal kontribusi
            <input
              required
              type="date"
              disabled={!isEligible || busy}
              value={date}
              onChange={e => setDate(e.target.value)}
              className="block w-full border border-slate-300 bg-white rounded-xl p-2.5 text-sm mt-1 outline-none focus:border-rose-500 disabled:opacity-60 disabled:bg-slate-100"
            />
          </label>
          <label className="text-xs font-medium text-slate-700">
            Catatan (Opsional)
            <input
              maxLength={500}
              disabled={!isEligible || busy}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Gaji bulan ini / bonus / THR"
              className="block w-full border border-slate-300 bg-white rounded-xl p-2.5 text-sm mt-1 outline-none focus:border-rose-500 disabled:opacity-60 disabled:bg-slate-100"
            />
          </label>
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              disabled={!isEligible || busy}
              className={`min-h-11 rounded-xl px-5 text-sm font-semibold transition ${
                isEligible
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {editing ? 'Simpan perubahan' : 'Catat kontribusi'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={reset}
                className="min-h-11 border border-slate-300 hover:bg-slate-100 rounded-xl px-4 text-sm text-slate-700"
              >
                Batal edit
              </button>
            )}
            {!isEligible && (
              <span className="text-xs text-amber-700 font-medium ml-2">
                🔒 Memerlukan paket Premium atau Wedding Pro untuk mencatat.
              </span>
            )}
          </div>
        </form>

        {!savings.length && (
          <p className="text-sm text-slate-500 py-3 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Belum ada catatan kontribusi tabungan. Mulai dengan catatan pertama.
          </p>
        )}

        <ul className="space-y-3">
          {savings.map(row => (
            <li key={row.id} className="border border-slate-200 rounded-2xl p-4 text-sm bg-white shadow-2xs">
              <div className="flex justify-between items-start">
                <div>
                  <strong className="text-base text-slate-900">{formatRupiah(Number(row.amount))}</strong>
                  <p className="text-xs text-slate-500 mt-0.5">{label(row.contributor_id)} · {row.contributed_on}</p>
                </div>
              </div>
              {row.notes && <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-xl">{row.notes}</p>}
              {isEligible && (
                <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100">
                  <button
                    disabled={busy}
                    className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-medium text-slate-700"
                    onClick={() => {
                      setEditing(row.id);
                      setContributor(row.contributor_id);
                      setAmount(String(row.amount));
                      setDate(row.contributed_on);
                      setNotes(row.notes);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    disabled={busy}
                    className="py-1.5 px-3 border border-rose-200 hover:bg-rose-50 rounded-xl text-xs font-medium text-rose-700"
                    onClick={async () => {
                      if (window.confirm('Hapus catatan kontribusi ini?') && await deleteSaving(row.id) && editing === row.id) {
                        reset();
                      }
                    }}
                  >
                    Hapus
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
