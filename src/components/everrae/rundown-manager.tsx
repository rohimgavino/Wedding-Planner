"use client";

import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  Sparkles, 
  Phone, 
  MapPin, 
  FileText, 
  Check, 
  Calendar,
  X,
  AlertCircle,
  HelpCircle,
  Users
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { RundownEvent, RundownSession } from '@/types';
import { RundownTemplateType } from '@/lib/rundown-templates';
import { formatDateID } from '@/lib/utils';

const SESSION_META: Record<RundownSession, { label: string; bg: string; text: string; border: string }> = {
  persiapan: { label: 'Persiapan & Rias', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  akad: { label: 'Akad Nikah / Ijab', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  temu_manten: { label: 'Upacara Adat', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  resepsi: { label: 'Resepsi & Jamuan', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  after_party: { label: 'After Party', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  lainnya: { label: 'Lainnya', bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200' },
};

export function RundownManager() {
  const { workspace, rundowns, createRundownEvent, updateRundownEvent, deleteRundownEvent, applyRundownTemplate, busy } = useWorkspace();

  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RundownEvent | null>(null);

  // Form states
  const [session, setSession] = useState<RundownSession>('akad');
  const [timeStart, setTimeStart] = useState('08:00');
  const [timeEnd, setTimeEnd] = useState('09:00');
  const [activity, setActivity] = useState('');
  const [picName, setPicName] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingEvent(null);
    setSession('akad');
    setTimeStart('08:00');
    setTimeEnd('09:00');
    setActivity('');
    setPicName('');
    setPicPhone('');
    setLocation('');
    setNotes('');
    setFormError('');
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item: RundownEvent) => {
    setEditingEvent(item);
    setSession(item.session);
    setTimeStart(item.time_start);
    setTimeEnd(item.time_end || '');
    setActivity(item.activity);
    setPicName(item.pic_name || '');
    setPicPhone(item.pic_phone || '');
    setLocation(item.location || '');
    setNotes(item.notes || '');
    setFormError('');
    setShowModal(true);
  };

  // Handle Form Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!activity.trim()) {
      setFormError('Nama aktivitas wajib diisi.');
      return;
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeStart)) {
      setFormError('Format waktu mulai harus berupa JJ:MM (contoh: 08:00).');
      return;
    }
    if (timeEnd && !timeRegex.test(timeEnd)) {
      setFormError('Format waktu selesai harus berupa JJ:MM (contoh: 09:30).');
      return;
    }

    const payload: Partial<RundownEvent> = {
      session,
      time_start: timeStart,
      time_end: timeEnd || null,
      activity: activity.trim(),
      pic_name: picName.trim(),
      pic_phone: picPhone.trim(),
      location: location.trim(),
      notes: notes.trim(),
    };

    if (editingEvent) {
      const ok = await updateRundownEvent(editingEvent.id, payload);
      if (ok) setShowModal(false);
    } else {
      payload.sort_order = rundowns.length + 1;
      const ok = await createRundownEvent(payload);
      if (ok) setShowModal(false);
    }
  };

  // Handle apply template
  const handleApplyTemplate = async (templateType: RundownTemplateType) => {
    if (rundowns.length > 0) {
      const confirmAdd = window.confirm(
        'Workspace kamu sudah memiliki agenda rundown. Ingin menambahkan agenda dari template ini?'
      );
      if (!confirmAdd) return;
    }
    await applyRundownTemplate(templateType);
    setShowTemplateModal(false);
  };

  // Sort and filter events
  const filteredEvents = useMemo(() => {
    return rundowns
      .filter((ev) => sessionFilter === 'all' || ev.session === sessionFilter)
      .sort((a, b) => {
        if (a.time_start !== b.time_start) return a.time_start.localeCompare(b.time_start);
        return a.sort_order - b.sort_order;
      });
  }, [rundowns, sessionFilter]);

  // Aggregate stats
  const earliestTime = rundowns.length > 0 ? rundowns.slice().sort((a,b) => a.time_start.localeCompare(b.time_start))[0].time_start : '--:--';
  const latestTime = rundowns.length > 0 ? rundowns.slice().sort((a,b) => (b.time_end || b.time_start).localeCompare(a.time_end || a.time_start))[0].time_end || rundowns[0].time_start : '--:--';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-rose-100 shadow-sm print:hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-2">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span>Timeline Acara Hari H</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
            Rundown & Susunan Acara
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Panduan jadwal per menit, lokasi, dan penanggung jawab (PIC) untuk kelancaran hari pernikahan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition flex items-center gap-1.5 shadow-xs"
            title="Cetak atau simpan PDF rundown untuk panitia keluarga & WO"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak / PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            disabled={busy}
            className="px-3.5 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-xs hover:bg-rose-100 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>Pilih Template Adat</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md hover:bg-rose-600 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Agenda</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <div className="bg-white p-4 rounded-2xl border border-rose-100/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Agenda</span>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{rundowns.length} Kegiatan</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-100/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mulai Standby</span>
          <p className="text-lg font-bold text-rose-600 mt-0.5">{earliestTime} WIB</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-100/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimasi Selesai</span>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{latestTime} WIB</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-100/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal Acara</span>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1 truncate">
            {workspace ? formatDateID(workspace.wedding_date) : '-'}
          </p>
        </div>
      </div>

      {/* Session Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 text-xs font-semibold print:hidden">
        <button
          type="button"
          onClick={() => setSessionFilter('all')}
          className={`px-3 py-1.5 rounded-full transition whitespace-nowrap ${
            sessionFilter === 'all'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua Sesi ({rundowns.length})
        </button>
        {(['persiapan', 'akad', 'temu_manten', 'resepsi', 'after_party', 'lainnya'] as RundownSession[]).map((sessKey) => {
          const count = rundowns.filter((r) => r.session === sessKey).length;
          const meta = SESSION_META[sessKey];
          return (
            <button
              key={sessKey}
              type="button"
              onClick={() => setSessionFilter(sessKey)}
              className={`px-3 py-1.5 rounded-full transition whitespace-nowrap flex items-center gap-1.5 ${
                sessionFilter === sessKey
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{meta.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${sessionFilter === sessKey ? 'bg-rose-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold font-serif text-slate-900">
          RUNDOWN RESMI HARI H · {workspace?.title.toUpperCase()}
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Hari & Tanggal: {workspace ? formatDateID(workspace.wedding_date) : '-'} | Dokumen Panitia Keluarga & Wedding Organizer
        </p>
      </div>

      {/* RUNDOWN TIMELINE LIST */}
      <div className="space-y-3">
        {filteredEvents.map((item, index) => {
          const sess = SESSION_META[item.session] || SESSION_META.lainnya;
          return (
            <div
              key={item.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100/80 shadow-xs hover:border-rose-300 transition flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3 sm:gap-4 flex-1">
                {/* Time Badge */}
                <div className="flex flex-col items-center justify-center px-3 py-2 rounded-xl bg-slate-900 text-white shrink-0 min-w-[85px] sm:min-w-[95px] text-center shadow-xs">
                  <span className="text-xs sm:text-sm font-bold tracking-tight">
                    {item.time_start}
                  </span>
                  {item.time_end ? (
                    <span className="text-[10px] text-slate-300">
                      s/d {item.time_end}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Selesai</span>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sess.bg} ${sess.text} ${sess.border}`}>
                      {sess.label}
                    </span>
                    <span className="text-slate-300 text-xs hidden sm:inline">•</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Agenda #{index + 1}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {item.activity}
                  </h3>

                  {/* Metadata Chips: PIC, Location */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                    {item.pic_name && (
                      <div className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">PIC: {item.pic_name}</span>
                        {item.pic_phone && (
                          <a
                            href={`https://wa.me/${item.pic_phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-1 text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-0.5 text-[11px] print:hidden"
                            title="Hubungi PIC via WhatsApp"
                          >
                            <Phone className="w-3 h-3" />
                            <span>WA</span>
                          </a>
                        )}
                        {item.pic_phone && (
                          <span className="hidden print:inline text-[11px] text-slate-500">
                            ({item.pic_phone})
                          </span>
                        )}
                      </div>
                    )}

                    {item.location && (
                      <div className="inline-flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{item.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes / Perlengkapan */}
                  {item.notes && (
                    <div className="mt-2 text-xs bg-slate-50 text-slate-600 p-2.5 rounded-xl border border-slate-100 flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions (Hidden in Print) */}
              <div className="flex items-center gap-1.5 self-end md:self-start shrink-0 print:hidden pt-2 md:pt-0">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  disabled={busy}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 hover:text-rose-600 transition flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(`Hapus agenda "${item.activity}"?`)) {
                      await deleteRundownEvent(item.id);
                    }
                  }}
                  disabled={busy}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 transition"
                  title="Hapus agenda"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-dashed border-rose-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="font-serif font-bold text-slate-800 text-base sm:text-lg mb-1">
              {sessionFilter === 'all' ? 'Rundown Hari H Belum Dibuat' : 'Tidak Ada Agenda pada Sesi Ini'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              {sessionFilter === 'all'
                ? 'Rencanakan susunan acara hari bahagiamu agar tidak ada prosesi yang terlambat. Mulai dari nol atau gunakan template adat otomatis di bawah.'
                : 'Pilih filter sesi lain atau tambahkan kegiatan baru untuk sesi ini.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs hover:bg-rose-100 transition inline-flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Gunakan Template Adat (Otomatis)</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md hover:bg-rose-600 transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Agenda Manual</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT RUNDOWN EVENT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500" />
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  {editingEvent ? 'Edit Agenda Acara' : 'Tambah Agenda Hari H'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sesi Acara
                </label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value as RundownSession)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-rose-500"
                >
                  <option value="persiapan">Persiapan & Rias Pengantin</option>
                  <option value="akad">Akad Nikah / Ijab Kabul</option>
                  <option value="temu_manten">Upacara Adat (Temu Manten / Saweran / Adat Lainnya)</option>
                  <option value="resepsi">Resepsi & Jamuan Makan</option>
                  <option value="after_party">After Party</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waktu Mulai (JJ:MM) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="08:00"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waktu Selesai (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="09:00"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kegiatan / Acara *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ijab Kabul & Penandatanganan Buku Nikah"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIC / Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: MC Kang Dedi / WO"
                    value={picName}
                    onChange={(e) => setPicName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. WhatsApp PIC (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={picPhone}
                    onChange={(e) => setPicPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi Spesifik
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Meja Akad Nikah / Pelaminan Utama Lt. 2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Pengingat Perlengkapan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Siapkan mahar emas 10gr, berkas KUA N1-N4, dan sound mic cadangan."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md hover:bg-rose-600 transition"
                >
                  {busy ? 'Menyimpan...' : editingEvent ? 'Simpan Perubahan' : 'Tambah Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHOOSE ADAT TEMPLATE */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-500" />
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  Pilih Template Rundown Otomatis
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Pilih susunan acara yang paling sesuai dengan konsep pernikahanmu. Jadwal dapat diedit dan diatur ulang kapan saja.
            </p>

            <div className="space-y-3">
              {/* Option 1: Nasional */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/30 transition flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-slate-900">Akad & Resepsi Nasional / Modern</strong>
                    <span className="text-[10px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">10 Agenda</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Susunan acara standar: MUA, penyambutan rombongan, akad nikah, sungkeman, grand entrance resepsi, ramah tamah & lempar buket.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleApplyTemplate('nasional')}
                  className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-xs hover:bg-rose-600 transition"
                >
                  Terapkan Template Nasional
                </button>
              </div>

              {/* Option 2: Jawa */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/30 transition flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-slate-900">Tradisional Jawa (Temu Manten)</strong>
                    <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">11 Agenda</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Dilengkapi upacara adat: Balangan Gantal, Ngidak Endhog, Sinduran, Kacar Kucur, Dulangan, Cucuk Lampah, dan Sungkeman.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleApplyTemplate('jawa')}
                  className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-xs shadow-xs hover:bg-purple-700 transition"
                >
                  Terapkan Template Adat Jawa
                </button>
              </div>

              {/* Option 3: Sunda */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/30 transition flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-slate-900">Tradisional Sunda (Saweran)</strong>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">8 Agenda</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Dilengkapi penyambutan Ki Lengser, Mapag Panganten, Saweran, Huap Lingkung, dan Pabetot Bakakak Hayam.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleApplyTemplate('sunda')}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-xs hover:bg-emerald-700 transition"
                >
                  Terapkan Template Adat Sunda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
