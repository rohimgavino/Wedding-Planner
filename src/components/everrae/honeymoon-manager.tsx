"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Wallet, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Sparkles, 
  Crown, 
  ArrowRight, 
  Hotel, 
  Plane, 
  Utensils, 
  Camera, 
  ShoppingBag, 
  FileText,
  Clock,
  X,
  AlertCircle
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { HoneymoonTrip, HoneymoonExpense, HoneymoonItinerary, HoneymoonExpenseCategory } from '@/types';
import { HONEYMOON_PRESETS } from '@/lib/honeymoon-presets';
import { formatRupiah, formatDateID } from '@/lib/utils';
import { entitlementActive } from '@/lib/savings';

const EXPENSE_CATEGORY_META: Record<HoneymoonExpenseCategory, { label: string; icon: string }> = {
  transportasi: { label: 'Tiket & Transport', icon: '✈️' },
  hotel_resort: { label: 'Hotel & Resort', icon: '🏨' },
  kuliner: { label: 'Kuliner & Romantic Dinner', icon: '🍷' },
  wisata: { label: 'Wisata, Spa & Atraksi', icon: '🏖️' },
  belanja_souvenir: { label: 'Belanja & Oleh-oleh', icon: '🛍️' },
  lainnya: { label: 'Lainnya & Tak Terduga', icon: '✨' },
};

export function HoneymoonManager() {
  const { 
    honeymoonTrip, 
    honeymoonExpenses, 
    honeymoonItineraries, 
    saveHoneymoonTrip, 
    createHoneymoonExpense, 
    updateHoneymoonExpense, 
    deleteHoneymoonExpense, 
    createHoneymoonItinerary, 
    updateHoneymoonItinerary, 
    deleteHoneymoonItinerary, 
    applyHoneymoonPreset, 
    entitlements, 
    developerTestAccess, 
    busy 
  } = useWorkspace();

  // Entitlement: Wedding Pro only
  const isEligible = 
    entitlementActive(entitlements, 'wedding_pro') || 
    entitlementActive(entitlements, 'honeymoon') || 
    developerTestAccess;

  const currentTrip: HoneymoonTrip = honeymoonTrip || {
    id: '',
    workspace_id: '',
    destination: 'Ubud & Seminyak, Bali',
    start_date: '2027-02-05',
    end_date: '2027-02-10',
    target_budget: 18000000,
    hotel_name: 'The Kayon Jungle Resort & W Bali',
    booking_code: 'HNMN-BALI-2027',
    notes: 'Kombinasi villa lembah private pool di Ubud dan suasana sunset Seminyak.',
  };

  const [activeSubTab, setActiveSubTab] = useState<'budget' | 'itinerary'>('budget');
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // Modals state
  const [showTripModal, setShowTripModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showItinModal, setShowItinModal] = useState(false);

  const [editingExpense, setEditingExpense] = useState<HoneymoonExpense | null>(null);
  const [editingItin, setEditingItin] = useState<HoneymoonItinerary | null>(null);
  const [formError, setFormError] = useState('');

  // Trip form states
  const [destName, setDestName] = useState(currentTrip.destination);
  const [tripStart, setTripStart] = useState(currentTrip.start_date || '');
  const [tripEnd, setTripEnd] = useState(currentTrip.end_date || '');
  const [targetBudget, setTargetBudget] = useState(currentTrip.target_budget || 15000000);
  const [hotelName, setHotelName] = useState(currentTrip.hotel_name || '');
  const [bookingCode, setBookingCode] = useState(currentTrip.booking_code || '');
  const [tripNotes, setTripNotes] = useState(currentTrip.notes || '');

  // Expense form states
  const [expCategory, setExpCategory] = useState<HoneymoonExpenseCategory>('hotel_resort');
  const [expTitle, setExpTitle] = useState('');
  const [expAllocated, setExpAllocated] = useState(3000000);
  const [expSpent, setExpSpent] = useState(0);
  const [expStatus, setExpStatus] = useState<'unpaid' | 'dp' | 'paid'>('unpaid');
  const [expRef, setExpRef] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // Itinerary form states
  const [itinDay, setItinDay] = useState(1);
  const [itinTime, setItinTime] = useState('10:00');
  const [itinActivity, setItinActivity] = useState('');
  const [itinLocation, setItinLocation] = useState('');
  const [itinNotes, setItinNotes] = useState('');

  // Aggregate Metrics
  const totalAllocated = honeymoonExpenses.reduce((acc, e) => acc + (e.allocated_amount || 0), 0);
  const totalSpent = honeymoonExpenses.reduce((acc, e) => acc + (e.spent_amount || 0), 0);
  const effectiveTarget = currentTrip.target_budget > 0 ? currentTrip.target_budget : totalAllocated;
  const remainingBudget = Math.max(0, effectiveTarget - totalSpent);
  const budgetProgress = effectiveTarget > 0 ? Math.min(100, Math.round((totalSpent / effectiveTarget) * 100)) : 0;

  // Itinerary Days List
  const maxDay = useMemo(() => {
    if (honeymoonItineraries.length === 0) return 5;
    return Math.max(5, ...honeymoonItineraries.map((i) => i.day_number));
  }, [honeymoonItineraries]);

  const currentDayItineraries = useMemo(() => {
    return honeymoonItineraries
      .filter((i) => i.day_number === selectedDay)
      .sort((a, b) => {
        if (a.time_start && b.time_start) return a.time_start.localeCompare(b.time_start);
        return a.sort_order - b.sort_order;
      });
  }, [honeymoonItineraries, selectedDay]);

  // Handle Save Trip Info
  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destName.trim()) {
      setFormError('Nama destinasi wajib diisi.');
      return;
    }
    await saveHoneymoonTrip({
      destination: destName.trim(),
      start_date: tripStart || null,
      end_date: tripEnd || null,
      target_budget: Number(targetBudget) || 0,
      hotel_name: hotelName.trim(),
      booking_code: bookingCode.trim(),
      notes: tripNotes.trim(),
    });
    setShowTripModal(false);
  };

  // Handle Save Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim()) {
      setFormError('Nama pos pengeluaran wajib diisi.');
      return;
    }

    const payload: Partial<HoneymoonExpense> = {
      category: expCategory,
      title: expTitle.trim(),
      allocated_amount: Number(expAllocated) || 0,
      spent_amount: Number(expSpent) || 0,
      payment_status: expStatus,
      booking_reference: expRef.trim(),
      notes: expNotes.trim(),
    };

    if (editingExpense) {
      const ok = await updateHoneymoonExpense(editingExpense.id, payload);
      if (ok) setShowExpenseModal(false);
    } else {
      const ok = await createHoneymoonExpense(payload);
      if (ok) setShowExpenseModal(false);
    }
  };

  // Handle Save Itinerary
  const handleSaveItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itinActivity.trim()) {
      setFormError('Nama aktivitas wajib diisi.');
      return;
    }

    const payload: Partial<HoneymoonItinerary> = {
      day_number: itinDay,
      time_start: itinTime || null,
      activity: itinActivity.trim(),
      location: itinLocation.trim(),
      notes: itinNotes.trim(),
      sort_order: honeymoonItineraries.filter((i) => i.day_number === itinDay).length + 1,
    };

    if (editingItin) {
      const ok = await updateHoneymoonItinerary(editingItin.id, payload);
      if (ok) setShowItinModal(false);
    } else {
      const ok = await createHoneymoonItinerary(payload);
      if (ok) setShowItinModal(false);
    }
  };

  // Apply Preset
  const handleApplyPreset = async (presetKey: string) => {
    if (honeymoonExpenses.length > 0 || honeymoonItineraries.length > 0) {
      const confirmAdd = window.confirm(
        'Workspace kamu sudah memiliki rencana honeymoon. Ingin menambahkan jadwal dan pos anggaran dari preset ini?'
      );
      if (!confirmAdd) return;
    }
    await applyHoneymoonPreset(presetKey);
    setShowPresetModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Wedding Pro Upgrade Banner for Starter/Premium */}
      {!isEligible && (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-rose-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>Fitur Eksklusif Paket Wedding Pro</span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold">
              Rencanakan Liburan Romantis Pertamamu Berdua
            </h3>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              Anda sedang melihat mode pratinjau Honeymoon Planner. Tingkatkan ke paket Wedding Pro untuk mengaktifkan budgeting bulan madu, day-by-day itinerary, dan panduan destinasi romantis tanpa batas.
            </p>
          </div>
          <Link
            href="/purchase"
            className="px-5 py-3 rounded-2xl bg-white text-indigo-900 font-bold text-xs shadow-md hover:bg-indigo-50 transition flex items-center justify-center gap-2 shrink-0 self-start md:self-center"
          >
            <span>Upgrade ke Wedding Pro</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Main Trip Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-rose-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>Rencana Liburan Bulan Madu</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <span>{currentTrip.destination}</span>
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {currentTrip.start_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  <span>
                    {formatDateID(currentTrip.start_date)}
                    {currentTrip.end_date && ` - ${formatDateID(currentTrip.end_date)}`}
                  </span>
                </div>
              )}
              {currentTrip.hotel_name && (
                <div className="flex items-center gap-1">
                  <Hotel className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{currentTrip.hotel_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPresetModal(true)}
              disabled={!isEligible || busy}
              className={`px-3.5 py-2.5 rounded-xl border font-semibold text-xs transition flex items-center gap-1.5 ${
                isEligible
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-rose-600" />
              <span>Pilih Paket Destinasi</span>
            </button>

            {isEligible && (
              <button
                type="button"
                onClick={() => {
                  setDestName(currentTrip.destination);
                  setTripStart(currentTrip.start_date || '');
                  setTripEnd(currentTrip.end_date || '');
                  setTargetBudget(currentTrip.target_budget || 15000000);
                  setHotelName(currentTrip.hotel_name || '');
                  setBookingCode(currentTrip.booking_code || '');
                  setTripNotes(currentTrip.notes || '');
                  setFormError('');
                  setShowTripModal(true);
                }}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>Ubah Info Trip</span>
              </button>
            )}
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                Realisasi: {formatRupiah(totalSpent)}
              </span>
              <span className="text-slate-400">/ Target: {formatRupiah(effectiveTarget)}</span>
            </div>
            <span className="font-semibold text-emerald-600">
              Sisa Anggaran: {formatRupiah(remainingBudget)} ({budgetProgress}%)
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                totalSpent > effectiveTarget ? 'bg-rose-600' : 'bg-gradient-to-r from-indigo-500 to-rose-500'
              }`}
              style={{ width: `${Math.min(100, budgetProgress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* SUB-TABS: BUDGETING VS ITINERARY */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab('budget')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'budget'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Pos Anggaran & Biaya ({honeymoonExpenses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('itinerary')}
          className={`pb-3 px-1 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'itinerary'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Day-by-Day Itinerary ({honeymoonItineraries.length})</span>
        </button>
      </div>

      {/* SECTION 1: BUDGETING */}
      {activeSubTab === 'budget' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Rincian Biaya & Pelunasan Honeymoon
              </h3>
              <p className="text-xs text-slate-500">
                Catat tiket transportasi, reservasi hotel resort, romantic dinner, dan belanja oleh-oleh.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setExpCategory('hotel_resort');
                setExpTitle('');
                setExpAllocated(3000000);
                setExpSpent(0);
                setExpStatus('unpaid');
                setExpRef('');
                setExpNotes('');
                setFormError('');
                setShowExpenseModal(true);
              }}
              disabled={!isEligible || busy}
              className={`px-4 py-2.5 rounded-xl text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5 self-start ${
                isEligible
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Pos Biaya</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {honeymoonExpenses.map((item) => {
              const meta = EXPENSE_CATEGORY_META[item.category] || EXPENSE_CATEGORY_META.lainnya;
              return (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {meta.icon} {meta.label}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{item.title}</h4>
                      {item.booking_reference && (
                        <p className="text-[11px] text-indigo-600 font-mono">
                          Ref: {item.booking_reference}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        item.payment_status === 'dp' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.payment_status === 'paid' ? 'Lunas' : item.payment_status === 'dp' ? 'Sudah DP' : 'Belum Bayar'}
                      </span>

                      {isEligible && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpense(item);
                              setExpCategory(item.category);
                              setExpTitle(item.title);
                              setExpAllocated(item.allocated_amount);
                              setExpSpent(item.spent_amount);
                              setExpStatus(item.payment_status);
                              setExpRef(item.booking_reference || '');
                              setExpNotes(item.notes || '');
                              setFormError('');
                              setShowExpenseModal(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600"
                            title="Edit pos"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Hapus pos "${item.title}"?`)) {
                                await deleteHoneymoonExpense(item.id);
                              }
                            }}
                            className="p-1 rounded text-slate-300 hover:text-rose-600"
                            title="Hapus pos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                      {item.notes}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                    <span className="text-slate-400">Plafon: {formatRupiah(item.allocated_amount)}</span>
                    <span className="font-bold text-slate-800">Biaya Riil: {formatRupiah(item.spent_amount)}</span>
                  </div>
                </div>
              );
            })}

            {honeymoonExpenses.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-dashed border-rose-200">
                <Wallet className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm mb-1">Pos Anggaran Honeymoon Kosong</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                  Belum ada biaya liburan yang dicatat. Gunakan tombol di atas untuk menambah pengeluaran tiket, hotel, atau makan malam.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: DAY-BY-DAY ITINERARY */}
      {activeSubTab === 'itinerary' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Jadwal Aktivitas Harian (Day by Day)
              </h3>
              <p className="text-xs text-slate-500">
                Rangkaian kegiatan santai, tempat wisata, spa, dan kuliner per hari perjalanan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingItin(null);
                setItinDay(selectedDay);
                setItinTime('10:00');
                setItinActivity('');
                setItinLocation('');
                setItinNotes('');
                setFormError('');
                setShowItinModal(true);
              }}
              disabled={!isEligible || busy}
              className={`px-4 py-2.5 rounded-xl text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5 self-start ${
                isEligible
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Jadwal Hari {selectedDay}</span>
            </button>
          </div>

          {/* Day Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 text-xs font-semibold">
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((day) => {
              const count = honeymoonItineraries.filter((it) => it.day_number === day).length;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-full transition whitespace-nowrap flex items-center gap-1.5 ${
                    selectedDay === day
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>Hari ke-{day}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedDay === day ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Day Schedule Cards */}
          <div className="space-y-3">
            {currentDayItineraries.map((itin, idx) => (
              <div
                key={itin.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                  {/* Time Badge */}
                  <div className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold font-mono shrink-0">
                    {itin.time_start || 'Fleksibel'}
                  </div>

                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Aktivitas #{idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {itin.activity}
                    </h4>

                    {itin.location && (
                      <div className="inline-flex items-center gap-1 text-xs text-slate-600 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{itin.location}</span>
                      </div>
                    )}

                    {itin.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 leading-relaxed">
                        {itin.notes}
                      </p>
                    )}
                  </div>
                </div>

                {isEligible && (
                  <div className="flex items-center gap-1 self-end sm:self-start shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItin(itin);
                        setItinDay(itin.day_number);
                        setItinTime(itin.time_start || '10:00');
                        setItinActivity(itin.activity);
                        setItinLocation(itin.location || '');
                        setItinNotes(itin.notes || '');
                        setFormError('');
                        setShowItinModal(true);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600"
                      title="Edit jadwal"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(`Hapus jadwal "${itin.activity}"?`)) {
                          await deleteHoneymoonItinerary(itin.id);
                        }
                      }}
                      className="p-1 rounded text-slate-300 hover:text-rose-600"
                      title="Hapus jadwal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {currentDayItineraries.length === 0 && (
              <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-rose-200">
                <Clock className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  Belum Ada Jadwal untuk Hari ke-{selectedDay}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                  Klik tombol di atas untuk menambahkan aktivitas santai, destinasi wisata, atau makan malam.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: TRIP INFO EDIT */}
      {showTripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-500" />
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  Ubah Destinasi Honeymoon
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTripModal(false)}
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

            <form onSubmit={handleSaveTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destinasi Utama *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ubud & Seminyak, Bali"
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Berangkat
                  </label>
                  <input
                    type="date"
                    value={tripStart}
                    onChange={(e) => setTripStart(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pulang
                  </label>
                  <input
                    type="date"
                    value={tripEnd}
                    onChange={(e) => setTripEnd(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Plafon Anggaran (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={500000}
                  value={targetBudget}
                  onChange={(e) => setTargetBudget(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Hotel / Resort
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: The Kayon Resort"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Booking / PNR
                  </label>
                  <input
                    type="text"
                    placeholder="BOOK-12345"
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan penerbangan, koper, atau tempat impian..."
                  value={tripNotes}
                  onChange={(e) => setTripNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTripModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md hover:bg-rose-600 transition"
                >
                  {busy ? 'Menyimpan...' : 'Simpan Info Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-rose-500" />
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  {editingExpense ? 'Edit Pos Biaya' : 'Tambah Pos Biaya Honeymoon'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
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

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Pengeluaran
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as HoneymoonExpenseCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-rose-500"
                >
                  <option value="transportasi">✈️ Tiket & Transportasi</option>
                  <option value="hotel_resort">🏨 Hotel & Resort</option>
                  <option value="kuliner">🍷 Kuliner & Romantic Dinner</option>
                  <option value="wisata">🏖️ Wisata, Spa & Atraksi</option>
                  <option value="belanja_souvenir">🛍️ Belanja & Oleh-oleh</option>
                  <option value="lainnya">✨ Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pos / Aktivitas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tiket Pesawat Garuda PP"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimasi Plafon (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    value={expAllocated}
                    onChange={(e) => setExpAllocated(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Biaya Riil Terbayar (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    value={expSpent}
                    onChange={(e) => setExpSpent(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Pelunasan
                  </label>
                  <select
                    value={expStatus}
                    onChange={(e) => setExpStatus(e.target.value as 'unpaid' | 'dp' | 'paid')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-rose-500"
                  >
                    <option value="unpaid">Belum Bayar</option>
                    <option value="dp">Sudah DP</option>
                    <option value="paid">Lunas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Referensi / Booking
                  </label>
                  <input
                    type="text"
                    placeholder="INV-12345"
                    value={expRef}
                    onChange={(e) => setExpRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail fasilitas atau kontak vendor..."
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md hover:bg-rose-600 transition"
                >
                  {busy ? 'Menyimpan...' : editingExpense ? 'Simpan Perubahan' : 'Tambah Biaya'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ITINERARY */}
      {showItinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  {editingItin ? 'Edit Jadwal Aktivitas' : `Tambah Jadwal Hari ke-${itinDay}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowItinModal(false)}
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

            <form onSubmit={handleSaveItinerary} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hari ke-
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={itinDay}
                    onChange={(e) => setItinDay(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waktu (JJ:MM)
                  </label>
                  <input
                    type="text"
                    placeholder="10:00"
                    value={itinTime}
                    onChange={(e) => setItinTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Aktivitas / Tempat Wisata *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sunset Couple Spa & Candlelight Dinner"
                  value={itinActivity}
                  onChange={(e) => setItinActivity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi Spesifik
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pantai Jimbaran / Tebing Uluwatu"
                  value={itinLocation}
                  onChange={(e) => setItinLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Tips Pakaian
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pakai baju putih, bawa kacamata hitam dan kamera."
                  value={itinNotes}
                  onChange={(e) => setItinNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowItinModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md hover:bg-rose-600 transition"
                >
                  {busy ? 'Menyimpan...' : editingItin ? 'Simpan Perubahan' : 'Tambah Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHOOSE HONEYMOON PRESET */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-500" />
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  Pilih Paket Destinasi Honeymoon
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Pilih rute liburan romantis siap pakai. Termasuk rancangan pos anggaran dan jadwal kegiatan harian yang dapat kamu ubah sesuka hati.
            </p>

            <div className="space-y-3">
              {Object.entries(HONEYMOON_PRESETS).map(([key, preset]) => (
                <div
                  key={key}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/20 transition flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm font-bold text-slate-900">
                        {preset.destination}
                      </strong>
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                        Plafon {formatRupiah(preset.target_budget)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {preset.notes}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span>🏨 {preset.hotel_name}</span>
                      <span>•</span>
                      <span>{preset.itineraries.length} Agenda Wisata</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(key)}
                    disabled={busy}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-rose-600 transition"
                  >
                    Terapkan Paket {key === 'bali' ? 'Bali' : 'Labuan Bajo'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
