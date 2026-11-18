"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Heart, 
  Calendar, 
  MapPin, 
  Gift, 
  Send, 
  Trash2, 
  Eye, 
  MessageSquareHeart, 
  Share2, 
  Palette,
  AlertCircle
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { WeddingInvitation, InvitationTheme } from '@/types';

export type ThemeCategory = 'all' | 'nusantara' | 'modern' | 'luxury';

export interface ThemeOption {
  id: InvitationTheme;
  name: string;
  category: 'nusantara' | 'modern' | 'luxury';
  badge: string;
  desc: string;
  previewColor: string;
  culturalNote?: string;
}

const THEMES: ThemeOption[] = [
  // 1. Adat Nusantara (6 Pilihan)
  {
    id: 'jawa-keraton',
    name: 'Royal Keraton Jawa',
    category: 'nusantara',
    badge: 'Gebyok & Wayang',
    desc: 'Nuansa Keraton megah, ukiran daun gebyok jati, Gunungan wayang kulit, dan ronce melati.',
    previewColor: 'bg-amber-800 border-amber-600',
    culturalNote: 'Pawiwahan & Panggih Penganten'
  },
  {
    id: 'bugis-pinisi',
    name: 'Bugis Makassar Pinisi',
    category: 'nusantara',
    badge: 'Pinisi & Saqbe',
    desc: 'Keagungan maritim perahu Pinisi 3D, kisi bambu Walasoji, dan ornamen geometris Saqbe.',
    previewColor: 'bg-emerald-900 border-emerald-500',
    culturalNote: 'Mappettuada & Sompa'
  },
  {
    id: 'minang-songket',
    name: 'Minang Kemilau Songket',
    category: 'nusantara',
    badge: 'Gonjong & Songket',
    desc: 'Atap Gonjong Rumah Gadang, ukiran bertingkat Pucuk Rebung, dan kilau emas tenun songket.',
    previewColor: 'bg-rose-900 border-amber-500',
    culturalNote: 'Baralek Gadang'
  },
  {
    id: 'bali-dewata',
    name: 'Dewata Sanctuary Bali',
    category: 'nusantara',
    badge: 'Candi Bentar & Kamboja',
    desc: 'Kemegahan gerbang batu Candi Bentar, prada keemasan, dan keharuman kelopak bunga Kamboja.',
    previewColor: 'bg-stone-800 border-yellow-500',
    culturalNote: 'Pawiwahan Suci Semara Ratih'
  },
  {
    id: 'sunda-siger',
    name: 'Sunda Parahyangan',
    category: 'nusantara',
    badge: 'Siger Pasundan',
    desc: 'Keanggunan mahkota Siger Pasundan, ronce kembang melati segar, dan nuansa sejuk Priangan.',
    previewColor: 'bg-teal-900 border-teal-400',
    culturalNote: 'Walimatul Nikah & Sawer'
  },
  {
    id: 'batak-gorga',
    name: 'Batak Royal Ulos',
    category: 'nusantara',
    badge: 'Gorga & Ragi Hotang',
    desc: 'Pahatan ukiran sakral Gorga Batak merah-hitam-putih Rumah Bolon, tenun Ulos bertuah.',
    previewColor: 'bg-neutral-900 border-red-600',
    culturalNote: 'Pamasu-masuon & Ulaon Unjuk'
  },

  // 2. Modern & Floral (3 Pilihan)
  {
    id: 'classic-ivory',
    name: 'Classic Ivory & Gold',
    category: 'modern',
    badge: 'Wax Seal & Damask',
    desc: 'Broken white hangat dengan stempel lilin monogram emas, French rococo scroll, dan mewah abadi.',
    previewColor: 'bg-amber-100 border-amber-300',
    culturalNote: 'Holy Matrimony & Reception'
  },
  {
    id: 'sage-garden',
    name: 'Sage Garden Botanical',
    category: 'modern',
    badge: 'Eucalyptus & Mist',
    desc: 'Nuansa hijau sage sejuk, dedaunan eucalyptus watercolor, dan kehangatan pesta kebun taman.',
    previewColor: 'bg-emerald-100 border-emerald-300',
    culturalNote: 'Intimate Garden Celebration'
  },
  {
    id: 'romantic-rose',
    name: 'Romantic Rose Peony',
    category: 'modern',
    badge: 'Rose Peony & Blush',
    desc: 'Sentuhan kelopak dusty rose romantis, lengkungan renda katedral, dan buket peony manis.',
    previewColor: 'bg-rose-100 border-rose-300',
    culturalNote: 'Sweet Romantic Evening'
  },

  // 3. Luxury & Eksklusif (3 Pilihan)
  {
    id: 'midnight-gold',
    name: 'Midnight Celestial Gold',
    category: 'luxury',
    badge: 'Starlight & Navy',
    desc: 'Latar obsidian sapphire gelap mewah bertabur rasi bintang dan kaligrafi emas berkilau.',
    previewColor: 'bg-slate-900 border-amber-400',
    culturalNote: 'Midnight Starlight Gala'
  },
  {
    id: 'islamic-arabesque',
    name: 'Madinah Arabesque Gold',
    category: 'luxury',
    badge: 'Kubah & Geometri Islami',
    desc: 'Kubah Masjid Nabawi agung, bintang geometris 8-sudut Andalusia (Girih), dan emas zamrud.',
    previewColor: 'bg-emerald-950 border-amber-400',
    culturalNote: 'Walimatul \'Ursy Penuh Berkah'
  },
  {
    id: 'monochrome-editorial',
    name: 'Modern Minimalist Editorial',
    category: 'luxury',
    badge: 'Vogue & High-Fashion',
    desc: 'Tipografi majalah editorial high-fashion berkelas, garis arsitektur bersih, dan estetika kontemporer.',
    previewColor: 'bg-stone-900 border-stone-300',
    culturalNote: 'Contemporary Celebration'
  },
];

export function DigitalInvitationManager() {
  const { workspace, invitation, wishes, guests, saveInvitation, deleteWish, busy } = useWorkspace();

  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [themeFilter, setThemeFilter] = useState<ThemeCategory>('all');

  // Default initial values from workspace or existing invitation
  const initialGroom = invitation?.groom_full_name || workspace?.title.split('&')[0]?.replace(/^Pernikahan\s+/i, '').trim() || '';
  const initialBride = invitation?.bride_full_name || workspace?.title.split('&')[1]?.trim() || '';
  const defaultSlug = (workspace?.title.replace(/^Pernikahan\s+/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) || 'undangan-kami';

  const [slug, setSlug] = useState(invitation?.slug || defaultSlug);
  const [isPublished, setIsPublished] = useState(invitation?.is_published ?? false);
  const [theme, setTheme] = useState<InvitationTheme>(invitation?.theme || 'classic-ivory');
  
  const [quoteTitle, setQuoteTitle] = useState(invitation?.quote_title || 'Surat Ar-Rum : 21');
  const [quoteBody, setQuoteBody] = useState(invitation?.quote_body || 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.');

  const [groomFullName, setGroomFullName] = useState(invitation?.groom_full_name || initialGroom);
  const [groomNickname, setGroomNickname] = useState(invitation?.groom_nickname || initialGroom.split(' ')[0] || '');
  const [groomParents, setGroomParents] = useState(invitation?.groom_parents || '');

  const [brideFullName, setBrideFullName] = useState(invitation?.bride_full_name || initialBride);
  const [brideNickname, setBrideNickname] = useState(invitation?.bride_nickname || initialBride.split(' ')[0] || '');
  const [brideParents, setBrideParents] = useState(invitation?.bride_parents || '');

  const [akadDate, setAkadDate] = useState(invitation?.akad_date || workspace?.wedding_date || '');
  const [akadTime, setAkadTime] = useState(invitation?.akad_time || '08:00 - 10:00 WIB');
  const [akadVenue, setAkadVenue] = useState(invitation?.akad_venue || 'Masjid Jami\' / Kediaman Mempelai');
  const [akadAddress, setAkadAddress] = useState(invitation?.akad_address || '');
  const [akadMapsUrl, setAkadMapsUrl] = useState(invitation?.akad_maps_url || '');

  const [resepsiDate, setResepsiDate] = useState(invitation?.resepsi_date || workspace?.wedding_date || '');
  const [resepsiTime, setResepsiTime] = useState(invitation?.resepsi_time || '11:00 - 14:00 WIB');
  const [resepsiVenue, setResepsiVenue] = useState(invitation?.resepsi_venue || 'Gedung Pertemuan / Ballroom');
  const [resepsiAddress, setResepsiAddress] = useState(invitation?.resepsi_address || '');
  const [resepsiMapsUrl, setResepsiMapsUrl] = useState(invitation?.resepsi_maps_url || '');

  const [giftBankName, setGiftBankName] = useState(invitation?.gift_bank_name || 'BCA');
  const [giftAccountNumber, setGiftAccountNumber] = useState(invitation?.gift_account_number || '');
  const [giftAccountHolder, setGiftAccountHolder] = useState(invitation?.gift_account_holder || initialGroom);
  const [giftAddress, setGiftAddress] = useState(invitation?.gift_address || '');

  if (!workspace) return null;

  const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/u/${sanitizedSlug || 'undangan'}` : `/u/${sanitizedSlug || 'undangan'}`;

  const handleCopyLink = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleSave = async (publishOverride?: boolean) => {
    setErrorNotice('');
    setSaveNotice('');

    if (!sanitizedSlug || sanitizedSlug.length < 3) {
      setErrorNotice('Tautan slug minimal 3 karakter (hanya huruf kecil, angka, dan strip).');
      return;
    }

    const nextPublished = publishOverride !== undefined ? publishOverride : isPublished;

    const payload: Partial<WeddingInvitation> = {
      slug: sanitizedSlug,
      is_published: nextPublished,
      theme,
      quote_title: quoteTitle.trim(),
      quote_body: quoteBody.trim(),
      groom_full_name: groomFullName.trim(),
      groom_nickname: groomNickname.trim(),
      groom_parents: groomParents.trim(),
      bride_full_name: brideFullName.trim(),
      bride_nickname: brideNickname.trim(),
      bride_parents: brideParents.trim(),
      akad_date: akadDate || undefined,
      akad_time: akadTime.trim(),
      akad_venue: akadVenue.trim(),
      akad_address: akadAddress.trim(),
      akad_maps_url: akadMapsUrl.trim(),
      resepsi_date: resepsiDate || undefined,
      resepsi_time: resepsiTime.trim(),
      resepsi_venue: resepsiVenue.trim(),
      resepsi_address: resepsiAddress.trim(),
      resepsi_maps_url: resepsiMapsUrl.trim(),
      gift_bank_name: giftBankName.trim(),
      gift_account_number: giftAccountNumber.trim(),
      gift_account_holder: giftAccountHolder.trim(),
      gift_address: giftAddress.trim()
    };

    const success = await saveInvitation(payload);
    if (success) {
      if (publishOverride !== undefined) setIsPublished(publishOverride);
      setSaveNotice(nextPublished ? 'Undangan digital berhasil dipublikasikan & disimpan!' : 'Pengaturan undangan berhasil disimpan (Mode Draft).');
      setTimeout(() => setSaveNotice(''), 4000);
    }
  };

  // WhatsApp generator link for selected guest
  const selectedGuest = guests.find(g => g.id === selectedGuestId);
  const guestParam = selectedGuest ? encodeURIComponent(selectedGuest.name) : '';
  const guestPersonalUrl = guestParam ? `${publicUrl}?to=${guestParam}` : publicUrl;
  const whatsappTemplate = `Kepada Yth. ${selectedGuest?.name || 'Bapak/Ibu/Saudara/i'},\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Anda untuk menghadiri pernikahan kami:\n\n${guestPersonalUrl}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.\n\nTerima kasih,\n${groomNickname || 'Pengantin'} & ${brideNickname || 'Pengantin'}`;
  const whatsappUrl = `https://wa.me/${selectedGuest?.phone ? selectedGuest.phone.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(whatsappTemplate)}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Publish Status */}
      <section className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <Globe size={22} />
              </span>
              <h2 className="font-serif text-2xl font-bold text-slate-900">Undangan Digital</h2>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Halaman web undangan pernikahan resmi untuk dibagikan kepada keluarga dan tamu via WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {isPublished ? '● Terpublikasi (Online)' : '○ Mode Draft (Belum Aktif)'}
            </span>
            <button
              disabled={busy}
              onClick={() => handleSave(!isPublished)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm ${
                isPublished 
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isPublished ? 'Tarik ke Draft' : 'Publikasikan Sekarang'}
            </button>
          </div>
        </div>

        {/* Public Link Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tautan Publik Undangan:</span>
            <div className="font-mono text-sm text-rose-700 font-semibold break-all">
              {publicUrl}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => handleCopyLink(publicUrl)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copiedLink ? 'Tersalin!' : 'Salin Tautan'}
            </button>
            <Link
              href={`/u/${sanitizedSlug || 'undangan'}?preview=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Lihat simulasi undangan sekarang tanpa harus melengkapi semua data"
            >
              <Sparkles size={14} className="text-amber-500" />
              Pratinjau Live
              <ExternalLink size={12} />
            </Link>
            <Link
              href={`/u/${sanitizedSlug || 'undangan'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Eye size={14} />
              Buka Halaman Publik
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* Petunjuk Penggunaan */}
        <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
          <Sparkles className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-800">Petunjuk Penggunaan Undangan Digital:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500">
              <li><strong>Tidak harus lengkap dulu:</strong> Anda dapat langsung mengklik tombol <em>Pratinjau Live</em> untuk melihat tampilan contoh.</li>
              <li><strong>Publikasikan Saat Siap:</strong> Klik tombol hijau <em>Publikasikan Sekarang</em> di atas agar undangan resmi online dan dapat dibuka oleh para tamu via WhatsApp.</li>
            </ul>
          </div>
        </div>

        {saveNotice && (
          <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
            <Check size={16} />
            {saveNotice}
          </div>
        )}
        {errorNotice && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-2">
            <AlertCircle size={16} />
            {errorNotice}
          </div>
        )}
      </section>

      {/* WhatsApp Generator for Guest List */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-emerald-500 text-white rounded-xl">
            <Send size={18} />
          </span>
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-900">Kirim Undangan via WhatsApp ke Buku Tamu</h3>
            <p className="text-xs text-slate-600">Pilih tamu dari buku tamu untuk membuat tautan dengan nama tamu otomatis.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="text-xs font-medium text-slate-700 block mb-1">Pilih Tamu Undangan:</label>
            <select
              aria-label="Pilih Tamu Undangan"
              value={selectedGuestId}
              onChange={e => setSelectedGuestId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm"
            >
              <option value="">-- Tamu Umum (Tanpa Nama Khusus) --</option>
              {guests.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.pax} pax) {g.phone ? `· ${g.phone}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-medium text-slate-700 block">Preview Teks WhatsApp Siap Kirim:</label>
            <div className="bg-white border border-emerald-200 rounded-xl p-3 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-28 overflow-y-auto">
              {whatsappTemplate}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Share2 size={14} />
                Buka & Kirim di WhatsApp
              </a>
              <button
                onClick={() => handleCopyLink(guestPersonalUrl)}
                className="px-3.5 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Copy size={13} />
                Salin Link Personal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Editor Form */}
      <form onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-6">
        
        {/* Section 1: Tema & Tautan */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Palette size={18} className="text-rose-500" />
            <h3 className="font-serif text-lg font-bold text-slate-900">Pilihan Tema & Tautan Web</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tautan Slug Khusus (Custom URL):
              </label>
              <div className="flex items-center">
                <span className="bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl px-3 py-2.5 text-xs text-slate-500">
                  pocketwedding.id/u/
                </span>
                <input
                  required
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="rohim-wiwit"
                  className="w-full border border-slate-300 rounded-r-xl p-2.5 text-sm font-mono focus:border-rose-500 outline-none"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Gunakan huruf kecil, angka, dan tanda hubung (-).</p>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Palette size={14} className="text-rose-500" />
                    <span>Pilihan Template & Tema Undangan (12 Pilihan):</span>
                  </label>
                  <p className="text-[11px] text-slate-500">Pilih tema dengan arsitektur pintu 3D, emblem adat otentik, dan palet warna khas</p>
                </div>
                <a
                  href="/preview-themes.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition shadow-2xs self-start sm:self-auto"
                >
                  <Sparkles size={13} className="text-amber-600" />
                  <span>Uji Pratinjau 3D Interaktif</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                  { id: 'all', label: 'Semua (12)' },
                  { id: 'nusantara', label: 'Adat Nusantara (6)' },
                  { id: 'modern', label: 'Modern & Floral (3)' },
                  { id: 'luxury', label: 'Luxury & Eksklusif (3)' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setThemeFilter(cat.id as ThemeCategory)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      themeFilter === cat.id
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
                {THEMES.filter(t => themeFilter === 'all' || t.category === themeFilter).map(t => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition relative ${
                        isSelected 
                          ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/70 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full border shrink-0 ${t.previewColor}`} />
                          <strong className="text-xs font-bold text-slate-900 leading-tight">{t.name}</strong>
                        </div>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                            <Check size={10} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md self-start">
                        {t.badge}
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {t.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Profil Kedua Mempelai */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Heart size={18} className="text-rose-500" />
            <h3 className="font-serif text-lg font-bold text-slate-900">Profil Kedua Mempelai</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Pengantin Pria */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Pengantin Pria (Groom)</span>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Lengkap & Gelar:</label>
                <input
                  required
                  type="text"
                  value={groomFullName}
                  onChange={e => setGroomFullName(e.target.value)}
                  placeholder="Ahmad Nur Rochim, S.Kom."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Panggilan:</label>
                <input
                  required
                  type="text"
                  value={groomNickname}
                  onChange={e => setGroomNickname(e.target.value)}
                  placeholder="Rohim"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Orang Tua (Putra dari):</label>
                <input
                  type="text"
                  value={groomParents}
                  onChange={e => setGroomParents(e.target.value)}
                  placeholder="Putra pertama dari Bpk. Fulan & Ibu Fulanah"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Pengantin Wanita */}
            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">Pengantin Wanita (Bride)</span>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Lengkap & Gelar:</label>
                <input
                  required
                  type="text"
                  value={brideFullName}
                  onChange={e => setBrideFullName(e.target.value)}
                  placeholder="Wiwit Lestari, S.Pd."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Panggilan:</label>
                <input
                  required
                  type="text"
                  value={brideNickname}
                  onChange={e => setBrideNickname(e.target.value)}
                  placeholder="Wiwit"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Orang Tua (Putri dari):</label>
                <input
                  type="text"
                  value={brideParents}
                  onChange={e => setBrideParents(e.target.value)}
                  placeholder="Putri kedua dari Bpk. H. Fulan & Ibu Hj. Fulanah"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Jadwal & Lokasi Acara */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Calendar size={18} className="text-rose-500" />
            <h3 className="font-serif text-lg font-bold text-slate-900">Jadwal & Lokasi Acara</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Akad Nikah */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Akad Nikah / Pemberkatan</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Tanggal:</label>
                  <input
                    type="date"
                    value={akadDate}
                    onChange={e => setAkadDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Waktu:</label>
                  <input
                    type="text"
                    value={akadTime}
                    onChange={e => setAkadTime(e.target.value)}
                    placeholder="08:00 - 10:00 WIB"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Tempat / Gedung:</label>
                <input
                  type="text"
                  value={akadVenue}
                  onChange={e => setAkadVenue(e.target.value)}
                  placeholder="Masjid Agung / Rumah Mempelai"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Alamat Lengkap:</label>
                <textarea
                  rows={2}
                  value={akadAddress}
                  onChange={e => setAkadAddress(e.target.value)}
                  placeholder="Jl. Malioboro No. 1, Yogyakarta"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Tautan Google Maps:</label>
                <input
                  type="url"
                  value={akadMapsUrl}
                  onChange={e => setAkadMapsUrl(e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                />
              </div>
            </div>

            {/* Resepsi */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Resepsi Pernikahan</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Tanggal:</label>
                  <input
                    type="date"
                    value={resepsiDate}
                    onChange={e => setResepsiDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Waktu:</label>
                  <input
                    type="text"
                    value={resepsiTime}
                    onChange={e => setResepsiTime(e.target.value)}
                    placeholder="11:00 - 14:00 WIB"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nama Tempat / Ballroom:</label>
                <input
                  type="text"
                  value={resepsiVenue}
                  onChange={e => setResepsiVenue(e.target.value)}
                  placeholder="Grand Ballroom Hotel..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Alamat Lengkap:</label>
                <textarea
                  rows={2}
                  value={resepsiAddress}
                  onChange={e => setResepsiAddress(e.target.value)}
                  placeholder="Jl. Solo Km. 9, Yogyakarta"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Tautan Google Maps:</label>
                <input
                  type="url"
                  value={resepsiMapsUrl}
                  onChange={e => setResepsiMapsUrl(e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Amplop Digital & Hadiah */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <Gift size={18} className="text-rose-500" />
            <h3 className="font-serif text-lg font-bold text-slate-900">Amplop Digital & Kado Pernikahan</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nama Bank / e-Wallet:</label>
              <input
                type="text"
                value={giftBankName}
                onChange={e => setGiftBankName(e.target.value)}
                placeholder="BCA / Mandiri / Dana"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nomor Rekening:</label>
              <input
                type="text"
                value={giftAccountNumber}
                onChange={e => setGiftAccountNumber(e.target.value)}
                placeholder="1234567890"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Atas Nama Pemilik Rekening:</label>
              <input
                type="text"
                value={giftAccountHolder}
                onChange={e => setGiftAccountHolder(e.target.value)}
                placeholder="Ahmad Nur Rochim"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Alamat Pengiriman Kado Fisik (Opsional):</label>
            <input
              type="text"
              value={giftAddress}
              onChange={e => setGiftAddress(e.target.value)}
              placeholder="Jl. Perumahan Indah No. 12, Sleman, D.I. Yogyakarta (Up: Wiwit)"
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
            />
          </div>
        </section>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleSave(false)}
            className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition"
          >
            Simpan sebagai Draft
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition shadow-md flex items-center gap-2"
          >
            <Sparkles size={16} />
            {busy ? 'Menyimpan…' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>

      {/* Wishes Wall Management */}
      <section className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <MessageSquareHeart size={20} className="text-rose-500" />
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Daftar Ucapan & Doa dari Tamu ({wishes.length})
            </h3>
          </div>
        </div>

        {wishes.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            Belum ada ucapan doa dari tamu. Sebarkan tautan undangan digital untuk mengumpulkan ucapan dan konfirmasi kehadiran.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {wishes.map(wish => (
              <div key={wish.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-slate-900">{wish.guest_name}</strong>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      wish.attendance === 'attending' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : wish.attendance === 'not_attending'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      {wish.attendance === 'attending' ? `Hadir (${wish.pax} pax)` : wish.attendance === 'not_attending' ? 'Tidak Hadir' : 'Ragu-ragu'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(wish.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{wish.message}</p>
                </div>
                <button
                  disabled={busy}
                  onClick={async () => {
                    if (window.confirm(`Hapus ucapan dari ${wish.guest_name}?`)) {
                      await deleteWish(wish.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition self-end sm:self-start"
                  title="Hapus ucapan"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
