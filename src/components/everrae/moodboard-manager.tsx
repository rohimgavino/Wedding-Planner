"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Palette, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Sparkles, 
  Copy, 
  Check, 
  X, 
  AlertCircle, 
  Lock, 
  Crown,
  Eye,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { MoodboardItem, MoodboardCategory, ColorPalette } from '@/types';
import { PRESET_PALETTES, PresetPalette } from '@/lib/moodboard-presets';
import { entitlementActive } from '@/lib/savings';

const CATEGORY_META: Record<MoodboardCategory, { label: string; icon: string }> = {
  dekorasi: { label: 'Dekorasi & Pelaminan', icon: '🏛️' },
  busana_pengantin: { label: 'Busana Pengantin', icon: '👗' },
  rias_makeup: { label: 'Rias & Makeup', icon: '💄' },
  bunga_handbouquet: { label: 'Bunga & Buket', icon: '💐' },
  foto_video: { label: 'Foto & Video', icon: '📷' },
  undangan_souvenir: { label: 'Undangan & Souvenir', icon: '💌' },
  kue_catering: { label: 'Kue & Catering', icon: '🍰' },
  lainnya: { label: 'Lainnya', icon: '✨' },
};

export function MoodboardManager() {
  const { 
    palette, 
    moodboards, 
    savePalette, 
    createMoodboardItem, 
    updateMoodboardItem, 
    deleteMoodboardItem, 
    applyStarterMoodboard, 
    entitlements, 
    developerTestAccess, 
    busy 
  } = useWorkspace();

  // Entitlement Check: Premium or Wedding Pro or developer test
  const isEligible = 
    entitlementActive(entitlements, 'premium') || 
    entitlementActive(entitlements, 'wedding_pro') || 
    entitlementActive(entitlements, 'moodboard') || 
    developerTestAccess;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPaletteModal, setShowPaletteModal] = useState(false);
  const [showCustomPaletteModal, setShowCustomPaletteModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<MoodboardItem | null>(null);
  const [editingItem, setEditingItem] = useState<MoodboardItem | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Form states for Item
  const [itemCategory, setItemCategory] = useState<MoodboardCategory>('dekorasi');
  const [itemTitle, setItemTitle] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemColorHex, setItemColorHex] = useState('#C86D51');
  const [itemNotes, setItemNotes] = useState('');
  const [itemSourceLink, setItemSourceLink] = useState('');
  const [formError, setFormError] = useState('');

  // Form states for Custom Palette
  const currentPalette: ColorPalette = palette || {
    id: '',
    workspace_id: '',
    name: 'Palet Earthy Terracotta & Sage',
    primary_color: '#C86D51',
    secondary_color: '#7D8D78',
    accent_color: '#E6D5B8',
    neutral_color: '#FDFBF7',
    notes: 'Tema hangat rustic garden',
  };

  const [customPalName, setCustomPalName] = useState(currentPalette.name);
  const [customPrimary, setCustomPrimary] = useState(currentPalette.primary_color);
  const [customSecondary, setCustomSecondary] = useState(currentPalette.secondary_color);
  const [customAccent, setCustomAccent] = useState(currentPalette.accent_color);
  const [customNeutral, setCustomNeutral] = useState(currentPalette.neutral_color);
  const [customNotes, setCustomNotes] = useState(currentPalette.notes || '');

  // Copy Hex code helper
  const handleCopyHex = (hex: string) => {
    void navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Open Create Item
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setItemCategory('dekorasi');
    setItemTitle('');
    setItemImageUrl('');
    setItemColorHex('#C86D51');
    setItemNotes('');
    setItemSourceLink('');
    setFormError('');
    setShowItemModal(true);
  };

  // Open Edit Item
  const handleOpenEditItem = (item: MoodboardItem) => {
    setEditingItem(item);
    setItemCategory(item.category);
    setItemTitle(item.title);
    setItemImageUrl(item.image_url);
    setItemColorHex(item.color_hex || '#C86D51');
    setItemNotes(item.notes || '');
    setItemSourceLink(item.source_link || '');
    setFormError('');
    setShowItemModal(true);
  };

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!itemTitle.trim()) {
      setFormError('Judul inspirasi wajib diisi.');
      return;
    }

    if (!/^https?:\/\/.+/.test(itemImageUrl.trim())) {
      setFormError('URL gambar harus diawali dengan http:// atau https://');
      return;
    }

    const payload: Partial<MoodboardItem> = {
      category: itemCategory,
      title: itemTitle.trim(),
      image_url: itemImageUrl.trim(),
      color_hex: itemColorHex || null,
      notes: itemNotes.trim(),
      source_link: itemSourceLink.trim(),
    };

    if (editingItem) {
      const ok = await updateMoodboardItem(editingItem.id, payload);
      if (ok) setShowItemModal(false);
    } else {
      payload.sort_order = moodboards.length + 1;
      const ok = await createMoodboardItem(payload);
      if (ok) setShowItemModal(false);
    }
  };

  // Apply Preset Palette
  const handleApplyPresetPalette = async (preset: PresetPalette) => {
    await savePalette({
      name: preset.name,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent,
      neutral_color: preset.neutral,
      notes: preset.description,
    });
    setShowPaletteModal(false);
  };

  // Save Custom Palette
  const handleSaveCustomPalette = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePalette({
      name: customPalName.trim() || 'Palet Warna Kustom',
      primary_color: customPrimary,
      secondary_color: customSecondary,
      accent_color: customAccent,
      neutral_color: customNeutral,
      notes: customNotes.trim(),
    });
    setShowCustomPaletteModal(false);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return moodboards.filter((item) => selectedCategory === 'all' || item.category === selectedCategory);
  }, [moodboards, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Starter Tier Preview / Upgrade Banner */}
      {!isEligible && (
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold">
              <Crown className="w-3.5 h-3.5 text-amber-200" />
              <span>Fitur Eksklusif Paket Premium & Wedding Pro</span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold">
              Kustomisasi Moodboard & Palet Warna Penuh
            </h3>
            <p className="text-xs sm:text-sm text-rose-50 leading-relaxed">
              Anda sedang melihat pratinjau contoh Moodboard. Tingkatkan ke paket Premium untuk menambahkan foto inspirasi sepuasnya, mengunggah palet warna tema, dan membagikannya ke vendor dekorasi & MUA.
            </p>
          </div>
          <Link
            href="/purchase"
            className="px-5 py-3 rounded-2xl bg-white text-rose-600 font-bold text-xs shadow-md hover:bg-rose-50 transition flex items-center justify-center gap-2 shrink-0 self-start md:self-center"
          >
            <span>Upgrade ke Premium</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Main Header & Color Palette Strip */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-rose-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-2">
              <Palette className="w-3.5 h-3.5 text-rose-500" />
              <span>Inspirasi Visual & Gaya Acara</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
              Wedding Moodboard & Palet Warna
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Panduan harmoni visual dekorasi, busana, bunga, dan makeup agar tema pernikahan selaras sempurna.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPaletteModal(true)}
              disabled={!isEligible || busy}
              className={`px-3.5 py-2.5 rounded-xl border font-semibold text-xs transition flex items-center gap-1.5 ${
                isEligible
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              <Palette className="w-4 h-4 text-rose-600" />
              <span>Pilih Palet Tema</span>
            </button>

            {moodboards.length === 0 && (
              <button
                type="button"
                onClick={() => applyStarterMoodboard()}
                disabled={!isEligible || busy}
                className="px-3.5 py-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-xs hover:bg-amber-100 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Muat Inspirasi Contoh</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCreateItem}
              disabled={!isEligible || busy}
              className={`px-4 py-2.5 rounded-xl text-white font-semibold text-xs shadow-md transition flex items-center gap-1.5 ${
                isEligible
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Ide Visual</span>
            </button>
          </div>
        </div>

        {/* PALET WARNA INTERAKTIF */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{currentPalette.name}</span>
                {currentPalette.notes && (
                  <span className="text-slate-400 font-normal text-[11px]">· {currentPalette.notes}</span>
                )}
              </span>
              <p className="text-[11px] text-slate-400">Klik salah satu kotak warna untuk menyalin kode HEX.</p>
            </div>

            {isEligible && (
              <button
                type="button"
                onClick={() => {
                  setCustomPalName(currentPalette.name);
                  setCustomPrimary(currentPalette.primary_color);
                  setCustomSecondary(currentPalette.secondary_color);
                  setCustomAccent(currentPalette.accent_color);
                  setCustomNeutral(currentPalette.neutral_color);
                  setCustomNotes(currentPalette.notes || '');
                  setShowCustomPaletteModal(true);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 self-start sm:self-center"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Kustomisasi Hex Warna</span>
              </button>
            )}
          </div>

          {/* Color Swatches Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Warna Utama', hex: currentPalette.primary_color, desc: 'Backdrop & Busana Inti' },
              { label: 'Warna Pendukung', hex: currentPalette.secondary_color, desc: 'Bunga & Drapery Kain' },
              { label: 'Aksen Kilau', hex: currentPalette.accent_color, desc: 'Detail Emas / Mutiara' },
              { label: 'Warna Netral', hex: currentPalette.neutral_color, desc: 'Taplak Meja & Dinding' },
            ].map((col, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCopyHex(col.hex)}
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-rose-400 transition text-left flex items-center gap-3 bg-white shadow-xs group"
                title="Klik untuk salin kode HEX"
              >
                <div
                  className="w-10 h-10 rounded-xl shadow-inner border border-black/10 shrink-0 transition group-hover:scale-105"
                  style={{ backgroundColor: col.hex }}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                    {col.label}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-800">
                    <span>{col.hex.toUpperCase()}</span>
                    {copiedHex === col.hex ? (
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-300 group-hover:text-rose-500" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {col.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full transition whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua Ide ({moodboards.length})
        </button>
        {(['dekorasi', 'busana_pengantin', 'rias_makeup', 'bunga_handbouquet', 'foto_video', 'undangan_souvenir', 'kue_catering', 'lainnya'] as MoodboardCategory[]).map((catKey) => {
          const meta = CATEGORY_META[catKey];
          const count = moodboards.filter((m) => m.category === catKey).length;
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-full transition whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === catKey
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === catKey ? 'bg-rose-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* MOODBOARD MASONRY / RESPONSIVE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const meta = CATEGORY_META[item.category] || CATEGORY_META.lainnya;
          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-rose-100 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              {/* Image Container with Zoom effect */}
              <div 
                className="relative h-56 w-full bg-slate-100 overflow-hidden cursor-pointer"
                onClick={() => setPreviewItem(item)}
              >
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  unoptimized
                />
                
                {/* Category badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-700 shadow-xs flex items-center gap-1">
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </div>

                {/* Color Dot if set */}
                {item.color_hex && (
                  <div 
                    className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: item.color_hex }}
                    title={`Warna dominan: ${item.color_hex}`}
                  />
                )}

                {/* Preview Overlay Icon */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                  <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xs text-xs font-semibold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Detail</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {item.title}
                  </h3>
                  {item.notes && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Card Footer: Source link & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  {item.source_link ? (
                    <a
                      href={item.source_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 truncate max-w-[150px]"
                      title={item.source_link}
                    >
                      <span>Lihat Referensi</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Koleksi Pribadi</span>
                  )}

                  {isEligible && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditItem(item)}
                        disabled={busy}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Edit ide"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Hapus inspirasi "${item.title}"?`)) {
                            await deleteMoodboardItem(item.id);
                          }
                        }}
                        disabled={busy}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus ide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="col-span-full p-8 sm:p-12 text-center bg-white rounded-3xl border border-dashed border-rose-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="font-serif font-bold text-slate-800 text-base sm:text-lg mb-1">
              {selectedCategory === 'all' ? 'Moodboard Masih Kosong' : 'Belum Ada Ide pada Kategori Ini'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              {selectedCategory === 'all'
                ? 'Kumpulkan foto dekorasi pelaminan, model kebaya, hand bouquet, dan makeup impianmu agar visi pernikahanmu dan pasangan semakin jelas.'
                : 'Pilih kategori lain atau tambahkan inspirasi baru untuk kategori ini.'}
            </p>

            {isEligible ? (
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => applyStarterMoodboard()}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs hover:bg-amber-100 transition inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Muat Inspirasi Contoh (Otomatis)</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateItem}
                  className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md hover:bg-rose-600 transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Ide Visual Pertama</span>
                </button>
              </div>
            ) : (
              <Link
                href="/purchase"
                className="px-5 py-3 rounded-2xl bg-rose-500 text-white font-bold text-xs shadow-md hover:bg-rose-600 transition inline-flex items-center gap-2"
              >
                <span>Upgrade ke Paket Premium untuk Mengisi Moodboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT MOODBOARD ITEM */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  {editingItem ? 'Edit Ide Visual' : 'Tambah Inspirasi Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
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

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value as MoodboardCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-rose-500"
                >
                  <option value="dekorasi">🏛️ Dekorasi & Pelaminan</option>
                  <option value="busana_pengantin">👗 Busana Pengantin</option>
                  <option value="rias_makeup">💄 Rias & Makeup</option>
                  <option value="bunga_handbouquet">💐 Bunga & Hand Bouquet</option>
                  <option value="foto_video">📷 Foto & Dokumentasi</option>
                  <option value="undangan_souvenir">💌 Undangan & Souvenir</option>
                  <option value="kue_catering">🍰 Kue & Catering</option>
                  <option value="lainnya">✨ Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Inspirasi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Backdrop Pelaminan Kayu Jati Minimalis"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Gambar Online (Unsplash / Pinterest / Direct Link) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warna Dominan
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={itemColorHex}
                      onChange={(e) => setItemColorHex(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                    />
                    <input
                      type="text"
                      value={itemColorHex}
                      onChange={(e) => setItemColorHex(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tautan Vendor / Pin (Opsional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={itemSourceLink}
                    onChange={(e) => setItemSourceLink(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Detail & Permintaan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Minta vendor dekorasi gunakan bunga kering dan lampu fairy warm."
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md hover:bg-rose-600 transition"
                >
                  {busy ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Ide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHOOSE PRESET PALETTE */}
      {showPaletteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-rose-500" />
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  Pilih Palet Warna Tema Pernikahan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaletteModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Pilih perpaduan palet warna kurasi profesional. Palet ini akan menjadi acuan warna seragam keluarga, bridesmaid, dekorasi panggung, dan undangan.
            </p>

            <div className="space-y-3">
              {PRESET_PALETTES.map((preset) => (
                <div
                  key={preset.name}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/20 transition flex flex-col justify-between gap-3 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block">
                        {preset.name}
                      </strong>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {preset.description}
                      </p>
                    </div>

                    {/* Swatches preview */}
                    <div className="flex items-center gap-1.5 self-start sm:self-center">
                      {[preset.primary, preset.secondary, preset.accent, preset.neutral].map((c, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-lg border border-black/10 shadow-xs"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyPresetPalette(preset)}
                    disabled={busy}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-rose-600 transition"
                  >
                    Terapkan Palet {preset.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM PALETTE FORM */}
      {showCustomPaletteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-rose-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-rose-500" />
                <h3 className="font-serif font-bold text-slate-900 text-lg">
                  Kustomisasi Palet Warna
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomPaletteModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPalette} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Palet Tema
                </label>
                <input
                  type="text"
                  required
                  value={customPalName}
                  onChange={(e) => setCustomPalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warna Utama
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customPrimary}
                      onChange={(e) => setCustomPrimary(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                    />
                    <input
                      type="text"
                      value={customPrimary}
                      onChange={(e) => setCustomPrimary(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warna Pendukung
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customSecondary}
                      onChange={(e) => setCustomSecondary(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                    />
                    <input
                      type="text"
                      value={customSecondary}
                      onChange={(e) => setCustomSecondary(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aksen Kilau
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customAccent}
                      onChange={(e) => setCustomAccent(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                    />
                    <input
                      type="text"
                      value={customAccent}
                      onChange={(e) => setCustomAccent(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warna Netral
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customNeutral}
                      onChange={(e) => setCustomNeutral(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                    />
                    <input
                      type="text"
                      value={customNeutral}
                      onChange={(e) => setCustomNeutral(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Konsep Gaya
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Konsep garden party sore hari"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomPaletteModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md hover:bg-rose-600 transition"
                >
                  {busy ? 'Menyimpan...' : 'Simpan Palet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMAGE LIGHTBOX PREVIEW */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-rose-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-80 sm:h-96 w-full bg-slate-950">
              <Image
                src={previewItem.image_url}
                alt={previewItem.title}
                fill
                className="object-contain"
                unoptimized
              />
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                  {CATEGORY_META[previewItem.category]?.label || 'Inspirasi'}
                </span>
                {previewItem.color_hex && (
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700">
                    <span 
                      className="w-3.5 h-3.5 rounded-full inline-block border border-black/10"
                      style={{ backgroundColor: previewItem.color_hex }}
                    />
                    <span>{previewItem.color_hex.toUpperCase()}</span>
                  </div>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold font-serif text-slate-900">
                {previewItem.title}
              </h2>

              {previewItem.notes && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {previewItem.notes}
                </p>
              )}

              {previewItem.source_link && (
                <div className="pt-2">
                  <a
                    href={previewItem.source_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"
                  >
                    <span>Kunjungi Tautan Sumber / Vendor</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
