"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Heart, 
  MapPin, 
  Calendar, 
  Clock, 
  Wallet, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Crown, 
  ArrowRight, 
  Gift, 
  UserCheck, 
  Printer, 
  FileText,
  X,
  AlertCircle,
  Share2
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { 
  EngagementEvent, 
  EngagementGift, 
  EngagementRundown, 
  EngagementGiftCategory, 
  EngagementGiftDirection, 
  EngagementGiftStatus 
} from '@/types';
import { 
  ENGAGEMENT_DEFAULT_EVENT, 
  ENGAGEMENT_PRESET_GIFTS, 
  ENGAGEMENT_PRESET_RUNDOWNS 
} from '@/lib/engagement-presets';
import { formatRupiah, formatDateID } from '@/lib/utils';
import { entitlementActive } from '@/lib/savings';

const GIFT_CATEGORY_META: Record<EngagementGiftCategory, { label: string; icon: string }> = {
  cincin: { label: 'Cincin & Simbolis', icon: '💍' },
  ibadah: { label: 'Perlengkapan Ibadah', icon: '🕌' },
  perhiasan: { label: 'Perhiasan Emas/Berlian', icon: '💎' },
  busana: { label: 'Busana, Kebaya & Kain', icon: '👗' },
  makeup_skincare: { label: 'Makeup & Skincare', icon: '💄' },
  sepatu_tas: { label: 'Sepatu & Tas Pesta', icon: '👠' },
  makanan_buah: { label: 'Buah & Kue Tradisional', icon: '🍎' },
  lainnya: { label: 'Perlengkapan Lainnya', icon: '🎁' },
};

const GIFT_STATUS_META: Record<EngagementGiftStatus, { label: string; bg: string; text: string; border: string }> = {
  planned: { label: 'Direncanakan', bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-200' },
  purchased: { label: 'Sudah Dibeli', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  decorating: { label: 'Sedang Dihias', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ready: { label: 'Siap Diserahkan', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export function EngagementManager() {
  const { 
    engagementEvent, 
    engagementGifts, 
    engagementRundowns, 
    saveEngagementEvent, 
    createEngagementGift, 
    updateEngagementGift, 
    deleteEngagementGift, 
    createEngagementRundown, 
    updateEngagementRundown, 
    deleteEngagementRundown, 
    applyEngagementPreset, 
    entitlements, 
    developerTestAccess, 
    busy 
  } = useWorkspace();

  // Entitlement: Wedding Pro or Lamaran add-on
  const isEligible = 
    entitlementActive(entitlements, 'wedding_pro') || 
    entitlementActive(entitlements, 'lamaran') || 
    developerTestAccess;

  const currentEvent: EngagementEvent = engagementEvent || {
    id: '',
    workspace_id: '',
    event_date: '2026-12-20',
    event_time: ENGAGEMENT_DEFAULT_EVENT.event_time,
    venue_name: ENGAGEMENT_DEFAULT_EVENT.venue_name,
    venue_address: 'Jl. Kaliurang KM 9, Sleman, Yogyakarta',
    spokesperson_groom: ENGAGEMENT_DEFAULT_EVENT.spokesperson_groom,
    spokesperson_bride: ENGAGEMENT_DEFAULT_EVENT.spokesperson_bride,
    target_budget: ENGAGEMENT_DEFAULT_EVENT.target_budget,
    guest_count: ENGAGEMENT_DEFAULT_EVENT.guest_count,
    notes: ENGAGEMENT_DEFAULT_EVENT.notes,
  };

  const [activeSubTab, setActiveSubTab] = useState<'gifts' | 'rundown'>('gifts');
  const [directionFilter, setDirectionFilter] = useState<'all' | EngagementGiftDirection>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showRundownModal, setShowRundownModal] = useState(false);

  const [editingGift, setEditingGift] = useState<EngagementGift | null>(null);
  const [editingRundown, setEditingRundown] = useState<EngagementRundown | null>(null);
  const [formError, setFormError] = useState('');

  // Event form states
  const [evDate, setEvDate] = useState(currentEvent.event_date || '');
  const [evTime, setEvTime] = useState(currentEvent.event_time || '');
  const [evVenue, setEvVenue] = useState(currentEvent.venue_name || '');
  const [evAddress, setEvAddress] = useState(currentEvent.venue_address || '');
  const [evSpokesGroom, setEvSpokesGroom] = useState(currentEvent.spokesperson_groom || '');
  const [evSpokesBride, setEvSpokesBride] = useState(currentEvent.spokesperson_bride || '');
  const [evBudget, setEvBudget] = useState(currentEvent.target_budget || 8000000);
  const [evGuests, setEvGuests] = useState(currentEvent.guest_count || 30);
  const [evNotes, setEvNotes] = useState(currentEvent.notes || '');

  // Gift form states
  const [giftDirection, setGiftDirection] = useState<EngagementGiftDirection>('groom_to_bride');
  const [giftBoxNumber, setGiftBoxNumber] = useState<number>(1);
  const [giftTitle, setGiftTitle] = useState('');
  const [giftCategory, setGiftCategory] = useState<EngagementGiftCategory>('cincin');
  const [giftStatus, setGiftStatus] = useState<EngagementGiftStatus>('planned');
  const [giftCost, setGiftCost] = useState<number>(0);
  const [giftNotes, setGiftNotes] = useState('');

  // Rundown form states
  const [rdStart, setRdStart] = useState('09:30');
  const [rdEnd, setRdEnd] = useState('10:00');
  const [rdActivity, setRdActivity] = useState('');
  const [rdPic, setRdPic] = useState('');
  const [rdNotes, setRdNotes] = useState('');
  const [rdOrder, setRdOrder] = useState<number>(1);

  // Filtered gifts
  const filteredGifts = useMemo(() => {
    let list = engagementGifts;
    if (directionFilter !== 'all') {
      list = list.filter(g => g.direction === directionFilter);
    }
    if (categoryFilter !== 'all') {
      list = list.filter(g => g.category === categoryFilter);
    }
    return list;
  }, [engagementGifts, directionFilter, categoryFilter]);

  // Statistics
  const groomGiftsCount = useMemo(() => engagementGifts.filter(g => g.direction === 'groom_to_bride').length, [engagementGifts]);
  const brideGiftsCount = useMemo(() => engagementGifts.filter(g => g.direction === 'bride_to_groom').length, [engagementGifts]);
  const readyGiftsCount = useMemo(() => engagementGifts.filter(g => g.status === 'ready').length, [engagementGifts]);
  const totalCost = useMemo(() => engagementGifts.reduce((acc, g) => acc + (Number(g.estimated_cost) || 0), 0), [engagementGifts]);

  const targetBudgetVal = currentEvent.target_budget || 8000000;
  const budgetProgress = Math.min(100, Math.round((totalCost / (targetBudgetVal || 1)) * 100));

  // Handlers for Event info
  const openEditEvent = () => {
    setEvDate(currentEvent.event_date || '');
    setEvTime(currentEvent.event_time || '');
    setEvVenue(currentEvent.venue_name || '');
    setEvAddress(currentEvent.venue_address || '');
    setEvSpokesGroom(currentEvent.spokesperson_groom || '');
    setEvSpokesBride(currentEvent.spokesperson_bride || '');
    setEvBudget(currentEvent.target_budget || 8000000);
    setEvGuests(currentEvent.guest_count || 30);
    setEvNotes(currentEvent.notes || '');
    setFormError('');
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evVenue.trim()) {
      setFormError('Nama lokasi/venue wajib diisi');
      return;
    }
    const ok = await saveEngagementEvent({
      event_date: evDate || null,
      event_time: evTime || null,
      venue_name: evVenue.trim(),
      venue_address: evAddress.trim() || null,
      spokesperson_groom: evSpokesGroom.trim() || null,
      spokesperson_bride: evSpokesBride.trim() || null,
      target_budget: Math.max(0, Number(evBudget) || 0),
      guest_count: Math.max(0, Number(evGuests) || 0),
      notes: evNotes.trim() || null,
    });
    if (ok) setShowEventModal(false);
  };

  // Handlers for Gifts
  const openAddGift = () => {
    setEditingGift(null);
    setGiftDirection('groom_to_bride');
    setGiftBoxNumber(engagementGifts.length + 1);
    setGiftTitle('');
    setGiftCategory('cincin');
    setGiftStatus('planned');
    setGiftCost(0);
    setGiftNotes('');
    setFormError('');
    setShowGiftModal(true);
  };

  const openEditGift = (gift: EngagementGift) => {
    setEditingGift(gift);
    setGiftDirection(gift.direction);
    setGiftBoxNumber(gift.box_number);
    setGiftTitle(gift.title);
    setGiftCategory(gift.category);
    setGiftStatus(gift.status);
    setGiftCost(gift.estimated_cost);
    setGiftNotes(gift.notes || '');
    setFormError('');
    setShowGiftModal(true);
  };

  const handleSaveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftTitle.trim()) {
      setFormError('Nama isi kotak seserahan wajib diisi');
      return;
    }
    if (giftCost < 0) {
      setFormError('Estimasi biaya tidak boleh negatif');
      return;
    }
    if (editingGift) {
      const ok = await updateEngagementGift(editingGift.id, {
        direction: giftDirection,
        box_number: Number(giftBoxNumber) || 1,
        title: giftTitle.trim(),
        category: giftCategory,
        status: giftStatus,
        estimated_cost: Number(giftCost) || 0,
        notes: giftNotes.trim() || null,
      });
      if (ok) setShowGiftModal(false);
    } else {
      const ok = await createEngagementGift({
        direction: giftDirection,
        box_number: Number(giftBoxNumber) || 1,
        title: giftTitle.trim(),
        category: giftCategory,
        status: giftStatus,
        estimated_cost: Number(giftCost) || 0,
        notes: giftNotes.trim() || null,
      });
      if (ok) setShowGiftModal(false);
    }
  };

  // Handlers for Rundown
  const openAddRundown = () => {
    setEditingRundown(null);
    setRdStart('10:00');
    setRdEnd('10:30');
    setRdActivity('');
    setRdPic('');
    setRdNotes('');
    setRdOrder(engagementRundowns.length + 1);
    setFormError('');
    setShowRundownModal(true);
  };

  const openEditRundown = (rd: EngagementRundown) => {
    setEditingRundown(rd);
    setRdStart(rd.time_start);
    setRdEnd(rd.time_end || '');
    setRdActivity(rd.activity);
    setRdPic(rd.pic_name || '');
    setRdNotes(rd.notes || '');
    setRdOrder(rd.sort_order);
    setFormError('');
    setShowRundownModal(true);
  };

  const handleSaveRundown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rdActivity.trim()) {
      setFormError('Nama kegiatan / prosesi wajib diisi');
      return;
    }
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(rdStart)) {
      setFormError('Format waktu mulai harus JJ:MM (misal: 09:30)');
      return;
    }
    if (rdEnd && !timeRegex.test(rdEnd)) {
      setFormError('Format waktu selesai harus JJ:MM (misal: 10:00)');
      return;
    }
    if (editingRundown) {
      const ok = await updateEngagementRundown(editingRundown.id, {
        time_start: rdStart,
        time_end: rdEnd || null,
        activity: rdActivity.trim(),
        pic_name: rdPic.trim() || null,
        notes: rdNotes.trim() || null,
        sort_order: Number(rdOrder) || 1,
      });
      if (ok) setShowRundownModal(false);
    } else {
      const ok = await createEngagementRundown({
        time_start: rdStart,
        time_end: rdEnd || null,
        activity: rdActivity.trim(),
        pic_name: rdPic.trim() || null,
        notes: rdNotes.trim() || null,
        sort_order: Number(rdOrder) || 1,
      });
      if (ok) setShowRundownModal(false);
    }
  };

  const handleApplyPreset = async () => {
    setShowPresetModal(false);
    await applyEngagementPreset();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner if not eligible */}
      {!isEligible && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-600 p-6 text-white shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold tracking-wide uppercase">
                <Crown className="w-3.5 h-3.5" />
                Fitur Eksklusif Wedding Pro
              </div>
              <h2 className="text-xl md:text-2xl font-serif font-bold">
                Engagement & Seserahan Planner
              </h2>
              <p className="text-white/90 text-sm max-w-xl">
                Rencanakan prosesi lamaran adat atau modern dengan daftar kotak seserahan & angsul-angsul, perhitungan budget, serta susunan acara keluarga yang terperinci.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-medium text-sm hover:bg-stone-50 transition shadow-md whitespace-nowrap"
            >
              Tingkatkan ke Wedding Pro
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Event Hero Card */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <Heart className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-2xl font-serif font-bold text-stone-900">
                  {currentEvent.venue_name || 'Acara Pertunangan & Lamaran'}
                </h1>
                <p className="text-xs text-stone-500">
                  Rencana prosesi khidmat mempertemukan kedua keluarga besar
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-stone-600 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-stone-400" />
                <span>{currentEvent.event_date ? formatDateID(currentEvent.event_date) : 'Tanggal belum ditentukan'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-stone-400" />
                <span>{currentEvent.event_time || '09:30 - 12:30 WIB'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-stone-400" />
                <span>{currentEvent.venue_address || 'Alamat lokasi belum diatur'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-stone-400" />
                <span>{currentEvent.guest_count || 30} Pax Keluarga</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {engagementGifts.length === 0 && (
              <button
                onClick={() => setShowPresetModal(true)}
                disabled={!isEligible || busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Gunakan Template Lengkap
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition text-xs font-medium"
              title="Cetak Jadwal & Checklist Lamaran"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak PDF
            </button>
            <button
              onClick={openEditEvent}
              disabled={!isEligible || busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition text-xs font-medium disabled:opacity-50"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Ubah Info Acara
            </button>
          </div>
        </div>

        {/* Spokespersons & Budget Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Juru Bicara Pria */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-800 text-xs font-bold">
              Pria
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                Juru Bicara Keluarga Pria
              </div>
              <div className="text-sm font-medium text-stone-800 mt-0.5">
                {currentEvent.spokesperson_groom || 'Belum ditunjuk'}
              </div>
            </div>
          </div>

          {/* Juru Bicara Wanita */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold">
              Wanita
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase">
                Juru Bicara Keluarga Wanita
              </div>
              <div className="text-sm font-medium text-stone-800 mt-0.5">
                {currentEvent.spokesperson_bride || 'Belum ditunjuk'}
              </div>
            </div>
          </div>

          {/* Budget Overview */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 flex items-center gap-1 font-medium">
                <Wallet className="w-3.5 h-3.5 text-stone-400" />
                Estimasi Seserahan
              </span>
              <span className="font-semibold text-stone-800">
                {formatRupiah(totalCost)} <span className="text-stone-400 font-normal">/ {formatRupiah(targetBudgetVal)}</span>
              </span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2 mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetProgress > 100 ? 'bg-rose-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, budgetProgress)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
              <span>{budgetProgress}% dari target</span>
              <span>{readyGiftsCount} kotak siap</span>
            </div>
          </div>
        </div>

        {currentEvent.notes && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2">
            <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span><strong>Catatan Khusus:</strong> {currentEvent.notes}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-3 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveSubTab('gifts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeSubTab === 'gifts'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Kotak Seserahan & Hantaran</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            activeSubTab === 'gifts' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
          }`}>
            {engagementGifts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('rundown')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            activeSubTab === 'rundown'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Susunan Acara Lamaran</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            activeSubTab === 'rundown' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
          }`}>
            {engagementRundowns.length}
          </span>
        </button>
      </div>

      {/* Sub-Tab 1: Seserahan Checklist */}
      {activeSubTab === 'gifts' && (
        <div className="space-y-4">
          {/* Direction & Category Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setDirectionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  directionFilter === 'all'
                    ? 'bg-stone-800 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                Semua Kotak ({engagementGifts.length})
              </button>
              <button
                onClick={() => setDirectionFilter('groom_to_bride')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  directionFilter === 'groom_to_bride'
                    ? 'bg-rose-700 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>Hantaran Pria ➔ Wanita</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                  {groomGiftsCount}
                </span>
              </button>
              <button
                onClick={() => setDirectionFilter('bride_to_groom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  directionFilter === 'bride_to_groom'
                    ? 'bg-sky-700 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>Angsul-angsul Wanita ➔ Pria</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800">
                  {brideGiftsCount}
                </span>
              </button>
            </div>

            <button
              onClick={openAddGift}
              disabled={!isEligible || busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition text-xs font-medium shadow-sm disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Kotak Baru
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition ${
                categoryFilter === 'all'
                  ? 'bg-stone-200 text-stone-900 font-semibold'
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              Semua Kategori
            </button>
            {Object.entries(GIFT_CATEGORY_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap transition ${
                  categoryFilter === key
                    ? 'bg-stone-200 text-stone-900 font-semibold'
                    : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            ))}
          </div>

          {/* Gifts Grid */}
          {filteredGifts.length === 0 ? (
            <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <Gift className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-stone-800">Belum ada kotak seserahan</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Catat kotak hantaran mulai dari cincin, busana, kosmetik, hingga angsul-angsul balasan untuk mempelai pria.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setShowPresetModal(true)}
                  disabled={!isEligible || busy}
                  className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition"
                >
                  Gunakan Template Standar
                </button>
                <button
                  onClick={openAddGift}
                  disabled={!isEligible || busy}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition"
                >
                  Buat Manual
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGifts.map((gift) => {
                const statusMeta = GIFT_STATUS_META[gift.status];
                const catMeta = GIFT_CATEGORY_META[gift.category] || { label: gift.category, icon: '🎁' };
                const isGroom = gift.direction === 'groom_to_bride';

                return (
                  <div
                    key={gift.id}
                    className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                            isGroom ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-sky-50 text-sky-700 border border-sky-100'
                          }`}>
                            Kotak #{gift.box_number}
                          </span>
                          <span className="text-xs text-stone-400">
                            {isGroom ? 'Pria ➔ Wanita' : 'Wanita ➔ Pria'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => openEditGift(gift)}
                            disabled={!isEligible || busy}
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition"
                            title="Edit kotak"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteEngagementGift(gift.id)}
                            disabled={!isEligible || busy}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition"
                            title="Hapus kotak"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-stone-500 flex items-center gap-1 mb-1">
                          <span>{catMeta.icon}</span>
                          <span>{catMeta.label}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-stone-900 group-hover:text-emerald-900 transition leading-snug">
                          {gift.title}
                        </h4>
                      </div>

                      {gift.notes && (
                        <p className="text-xs text-stone-500 line-clamp-2 bg-stone-50 p-2 rounded-xl">
                          {gift.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-stone-400 font-medium">ESTIMASI BIAYA</div>
                        <div className="text-xs font-semibold text-stone-800">
                          {formatRupiah(gift.estimated_cost)}
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Rundown Acara Lamaran */}
      {activeSubTab === 'rundown' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-stone-900">
                Susunan Acara Lamaran Keluarga
              </h3>
              <p className="text-xs text-stone-500">
                Urutan prosesi khidmat perkenalan keluarga, penyampaian maksud, dan penyematan cincin
              </p>
            </div>

            <button
              onClick={openAddRundown}
              disabled={!isEligible || busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition text-xs font-medium shadow-sm disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Sesi Acara
            </button>
          </div>

          {engagementRundowns.length === 0 ? (
            <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-stone-800">Belum ada susunan acara</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Susun rundown lamaran lengkap mulai dari penyambutan keluarga, sambutan lamaran, pemasangan cincin, hingga foto bersama.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setShowPresetModal(true)}
                  disabled={!isEligible || busy}
                  className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition"
                >
                  Gunakan Template Standar
                </button>
                <button
                  onClick={openAddRundown}
                  disabled={!isEligible || busy}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition"
                >
                  Buat Manual
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {engagementRundowns.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {item.sort_order || index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <Clock className="w-3 h-3" />
                          {item.time_start} {item.time_end ? `- ${item.time_end} WIB` : 'WIB'}
                        </span>
                        {item.pic_name && (
                          <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg">
                            PIC: {item.pic_name}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-stone-900">
                        {item.activity}
                      </h4>

                      {item.notes && (
                        <p className="text-xs text-stone-500">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-center opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => openEditRundown(item)}
                      disabled={!isEligible || busy}
                      className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition"
                      title="Edit sesi"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteEngagementRundown(item.id)}
                      disabled={!isEligible || busy}
                      className="p-2 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition"
                      title="Hapus sesi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Edit Event Info */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-semibold text-stone-900">
                Ubah Informasi Acara Lamaran
              </h3>
              <button onClick={() => setShowEventModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">Nama Tempat / Venue *</label>
                <input
                  type="text"
                  value={evVenue}
                  onChange={e => setEvVenue(e.target.value)}
                  placeholder="Kediaman Mempelai Wanita / Pendopo Resto"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Tanggal Acara</label>
                  <input
                    type="date"
                    value={evDate}
                    onChange={e => setEvDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Waktu Pelaksanaan</label>
                  <input
                    type="text"
                    value={evTime}
                    onChange={e => setEvTime(e.target.value)}
                    placeholder="09:30 - 12:30 WIB"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={evAddress}
                  onChange={e => setEvAddress(e.target.value)}
                  placeholder="Jl. Kaliurang KM 9..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Juru Bicara Pria</label>
                  <input
                    type="text"
                    value={evSpokesGroom}
                    onChange={e => setEvSpokesGroom(e.target.value)}
                    placeholder="Bpk. H. Bambang (Paman)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Juru Bicara Wanita</label>
                  <input
                    type="text"
                    value={evSpokesBride}
                    onChange={e => setEvSpokesBride(e.target.value)}
                    placeholder="Bpk. Drs. H. Subagyo (Ayah)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Target Anggaran (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={evBudget}
                    onChange={e => setEvBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Estimasi Jumlah Tamu (Pax)</label>
                  <input
                    type="number"
                    min="0"
                    value={evGuests}
                    onChange={e => setEvGuests(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Catatan / Konsep Acara</label>
                <textarea
                  rows={2}
                  value={evNotes}
                  onChange={e => setEvNotes(e.target.value)}
                  placeholder="Dresscode, nuansa bunga dekorasi, atau petunjuk parkir..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 font-medium disabled:opacity-50"
                >
                  Simpan Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add / Edit Gift Box */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-semibold text-stone-900">
                {editingGift ? 'Edit Kotak Seserahan' : 'Tambah Kotak Seserahan Baru'}
              </h3>
              <button onClick={() => setShowGiftModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGift} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Arah Hantaran</label>
                  <select
                    value={giftDirection}
                    onChange={e => setGiftDirection(e.target.value as EngagementGiftDirection)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  >
                    <option value="groom_to_bride">Pria ➔ Wanita (Seserahan)</option>
                    <option value="bride_to_groom">Wanita ➔ Pria (Angsul-angsul)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Nomor Kotak</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={giftBoxNumber}
                    onChange={e => setGiftBoxNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Nama Barang / Isi Kotak *</label>
                <input
                  type="text"
                  value={giftTitle}
                  onChange={e => setGiftTitle(e.target.value)}
                  placeholder="Set Cincin Solitaire / Perlengkapan Ibadah..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Kategori Barang</label>
                  <select
                    value={giftCategory}
                    onChange={e => setGiftCategory(e.target.value as EngagementGiftCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  >
                    {Object.entries(GIFT_CATEGORY_META).map(([k, meta]) => (
                      <option key={k} value={k}>{meta.icon} {meta.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Status Kesiapan</label>
                  <select
                    value={giftStatus}
                    onChange={e => setGiftStatus(e.target.value as EngagementGiftStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  >
                    {Object.entries(GIFT_STATUS_META).map(([k, meta]) => (
                      <option key={k} value={k}>{meta.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Estimasi Biaya (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={giftCost}
                  onChange={e => setGiftCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Catatan Tambahan / Desain Kotak</label>
                <textarea
                  rows={2}
                  value={giftNotes}
                  onChange={e => setGiftNotes(e.target.value)}
                  placeholder="Kotak akrilik bunga kering, ukuran sepatu 40, shade makeup..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowGiftModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 font-medium disabled:opacity-50"
                >
                  {editingGift ? 'Perbarui Kotak' : 'Tambah Kotak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add / Edit Rundown Event */}
      {showRundownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-semibold text-stone-900">
                {editingRundown ? 'Edit Sesi Rundown Lamaran' : 'Tambah Sesi Rundown Lamaran'}
              </h3>
              <button onClick={() => setShowRundownModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRundown} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Jam Mulai *</label>
                  <input
                    type="text"
                    value={rdStart}
                    onChange={e => setRdStart(e.target.value)}
                    placeholder="09:30"
                    pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Jam Selesai</label>
                  <input
                    type="text"
                    value={rdEnd}
                    onChange={e => setRdEnd(e.target.value)}
                    placeholder="10:00"
                    pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Urutan</label>
                  <input
                    type="number"
                    min="1"
                    value={rdOrder}
                    onChange={e => setRdOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Nama Kegiatan / Prosesi *</label>
                <input
                  type="text"
                  value={rdActivity}
                  onChange={e => setRdActivity(e.target.value)}
                  placeholder="Pemasangan Cincin Pertunangan..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Penanggung Jawab (PIC)</label>
                <input
                  type="text"
                  value={rdPic}
                  onChange={e => setRdPic(e.target.value)}
                  placeholder="MC & Ibu Calon Mempelai Pria"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Catatan Panduan Prosesi</label>
                <textarea
                  rows={2}
                  value={rdNotes}
                  onChange={e => setRdNotes(e.target.value)}
                  placeholder="Instruksi khusus posisi berdiri, serah terima mic, atau persiapan kotak..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowRundownModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 font-medium disabled:opacity-50"
                >
                  {editingRundown ? 'Perbarui Sesi' : 'Tambah Sesi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Template Confirmation */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
                <Sparkles className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  Gunakan Template Lamaran Lengkap?
                </h3>
                <p className="text-xs text-stone-500">
                  Sistem akan otomatis mengisi checklist 12 kotak seserahan & angsul-angsul serta 8 tahap rundown acara resmi.
                </p>
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1.5">
              <div className="font-semibold text-stone-800">Paket Template Mencakup:</div>
              <ul className="list-disc list-inside space-y-0.5 text-stone-500">
                <li>8 Kotak Hantaran Pria (Cincin, Ibadah, Perhiasan, Kebaya, dll)</li>
                <li>4 Kotak Angsul-angsul Wanita (Batik Pria, Sepatu, Koko, Kue)</li>
                <li>8 Agenda Acara Mulai Sambutan s/d Makan Bersama</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyPreset}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 font-medium text-xs disabled:opacity-50"
              >
                Pasang Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
