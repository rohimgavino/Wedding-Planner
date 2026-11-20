"use client";

import { useState, useRef } from 'react';
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
  AlertCircle,
  FileText,
  ChevronRight,
  Music,
  Camera,
  Instagram,
  Play,
  Pause,
  Volume2,
  Image as ImageIcon
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { WeddingInvitation, InvitationTheme } from '@/types';
import { ThemeCardThumbnail } from './theme-thumbnail';

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
    culturalNote: 'The Wedding Celebration & Reception'
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
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'details' | 'whatsapp'>('templates');

  // Default initial values from workspace or existing invitation
  const initialGroom = invitation?.groom_full_name || workspace?.title.split('&')[0]?.replace(/^Pernikahan\s+/i, '').trim() || '';
  const initialBride = invitation?.bride_full_name || workspace?.title.split('&')[1]?.trim() || '';
  const defaultSlug = (workspace?.title.replace(/^Pernikahan\s+/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) || 'undangan-kami';

  const [slug, setSlug] = useState(invitation?.slug || defaultSlug);
  const [isPublished, setIsPublished] = useState(invitation?.is_published ?? false);
  const [theme, setTheme] = useState<InvitationTheme>(invitation?.theme || 'classic-ivory');

  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

  const handleSelectTheme = async (selectedTheme: InvitationTheme) => {
    setTheme(selectedTheme);
    const success = await saveInvitation({ theme: selectedTheme });
    if (success) {
      const selectedObj = THEMES.find(t => t.id === selectedTheme);
      setSaveNotice(`Tema aktif berhasil diubah ke "${selectedObj?.name || selectedTheme}"!`);
      setTimeout(() => setSaveNotice(''), 3500);
    }
  };
  
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

  const [coverPhotoUrl, setCoverPhotoUrl] = useState(invitation?.cover_photo_url || '/images/wedding-flowers.jpg');
  const [groomInstagram, setGroomInstagram] = useState(invitation?.groom_instagram || '');
  const [brideInstagram, setBrideInstagram] = useState(invitation?.bride_instagram || '');
  const [musicUrl, setMusicUrl] = useState(invitation?.music_url || '/audio/wedding-acoustic.mp3');
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudioPreview = () => {
    if (!audioPreviewRef.current) return;
    if (isPlayingAudioPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingAudioPreview(false);
    } else {
      audioPreviewRef.current.play().then(() => {
        setIsPlayingAudioPreview(true);
      }).catch(() => {
        setIsPlayingAudioPreview(false);
      });
    }
  };

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
      groom_instagram: groomInstagram.trim(),
      bride_full_name: brideFullName.trim(),
      bride_nickname: brideNickname.trim(),
      bride_parents: brideParents.trim(),
      bride_instagram: brideInstagram.trim(),
      cover_photo_url: coverPhotoUrl.trim(),
      music_url: musicUrl.trim(),
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
              href={`/u/${sanitizedSlug || 'undangan'}?preview=true&theme=${theme}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Lihat simulasi undangan tema aktif sekarang tanpa harus melengkapi semua data"
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

        {/* Active Theme Bar indicator inside Top Banner */}
        <div className="p-3 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700">Tema Aktif Sekarang:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-rose-200 text-xs font-bold text-rose-800 shadow-2xs">
              <span className={`w-2.5 h-2.5 rounded-full border ${currentThemeObj.previewColor}`} />
              {currentThemeObj.name}
              <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                {currentThemeObj.badge}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSubTab('templates')}
            className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1 self-start sm:self-auto hover:underline"
          >
            <span>Ganti Desain Template (12 Pilihan Tersedia)</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Petunjuk Penggunaan Ringkas */}
        <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
          <Sparkles className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-800">Petunjuk Penggunaan Undangan Digital:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500">
              <li><strong>Pilih Template Terlebih Dahulu:</strong> Pilih dari 12 template 3D di tab <em>Pilihan Template</em> di bawah.</li>
              <li><strong>Tidak harus lengkap dulu:</strong> Anda dapat langsung mengklik tombol <em>Pratinjau Live</em> untuk melihat tampilan contoh tema.</li>
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

      {/* Primary Sub-Navigation Tabs */}
      <nav aria-label="Menu Navigasi Undangan Digital" className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap gap-1.5 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('templates')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeSubTab === 'templates'
              ? 'bg-white text-rose-700 shadow-sm ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Palette size={16} className={activeSubTab === 'templates' ? 'text-rose-600' : 'text-slate-500'} />
          <span>1. Pilihan Template (12 Desain 3D)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('details')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeSubTab === 'details'
              ? 'bg-white text-rose-700 shadow-sm ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileText size={16} className={activeSubTab === 'details' ? 'text-rose-600' : 'text-slate-500'} />
          <span>2. Data Mempelai & Acara</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('whatsapp')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeSubTab === 'whatsapp'
              ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-black/5'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Send size={16} className={activeSubTab === 'whatsapp' ? 'text-emerald-600' : 'text-slate-500'} />
          <span>3. Kirim via WhatsApp</span>
        </button>
      </nav>

      {/* TAB 1: Pilihan Template (12 Desain) */}
      {activeSubTab === 'templates' && (
        <div className="space-y-6">
          <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Palette size={20} className="text-rose-500" />
                  <h3 className="font-serif text-xl font-bold text-slate-900">Koleksi Template Undangan 3D (12 Pilihan)</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Dilengkapi arsitektur pintu 3D otentik khas Nusantara, ornamen adat, tata warna elegan, dan musik latar.
                </p>
              </div>

              <a
                href="/preview-themes.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-300 text-amber-900 text-xs font-bold hover:from-amber-100 hover:to-rose-100 transition shadow-2xs self-start sm:self-auto"
              >
                <Sparkles size={14} className="text-amber-600" />
                <span>Buka Simulator Pintu 3D Full Screen</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 mr-1">Kategori:</span>
              {[
                { id: 'all', label: 'Semua Template (12)' },
                { id: 'nusantara', label: '🏛️ Adat Nusantara (6)' },
                { id: 'modern', label: '🌿 Modern & Floral (3)' },
                { id: 'luxury', label: '💎 Luxury & Eksklusif (3)' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setThemeFilter(cat.id as ThemeCategory)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                    themeFilter === cat.id
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 12 Themes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {THEMES.filter(t => themeFilter === 'all' || t.category === themeFilter).map(t => {
                const isSelected = theme === t.id;
                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-3.5 transition relative ${
                      isSelected 
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Miniature Visual Preview Thumbnail */}
                      <ThemeCardThumbnail themeId={t.id} slug={sanitizedSlug || 'rohim-wiwit'} />

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full border shadow-2xs shrink-0 ${t.previewColor}`} />
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">{t.name}</h4>
                        </div>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <Check size={10} strokeWidth={3} />
                            Aktif
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                          {t.badge}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {t.culturalNote}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {t.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      {isSelected ? (
                        <button
                          type="button"
                          disabled
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <Check size={13} />
                          Tema Sedang Aktif
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleSelectTheme(t.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-2xs flex items-center justify-center gap-1"
                        >
                          <Sparkles size={12} />
                          Terapkan Tema Ini
                        </button>
                      )}

                      <Link
                        href={`/u/${sanitizedSlug || 'undangan'}?preview=true&theme=${t.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                        title={`Lihat Pratinjau Tema ${t.name}`}
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom URL Slug Editor */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 mt-4">
              <label className="text-xs font-bold text-slate-800 block">
                Pengaturan Tautan Slug Khusus (Custom Link):
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center flex-1">
                  <span className="bg-slate-200/80 border border-r-0 border-slate-300 rounded-l-xl px-3 py-2.5 text-xs text-slate-600 font-mono">
                    pocketwedding.id/u/
                  </span>
                  <input
                    required
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="rohim-wiwit"
                    className="w-full border border-slate-300 bg-white rounded-r-xl p-2.5 text-sm font-mono focus:border-rose-500 outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleSave()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition shadow-xs shrink-0"
                >
                  Simpan Slug
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Gunakan huruf kecil, angka, dan strip (-). Contoh: <code>rohim-wiwit</code> menghasilkan <code>https://pocketwedding.id/u/rohim-wiwit</code>.
              </p>
            </div>

            {/* Next Step Banner */}
            <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-rose-950">Sudah memilih template favorit?</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Lanjutkan dengan melengkapi nama mempelai, tanggal akad, lokasi resepsi, dan rekening hadiah.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('details')}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs self-start sm:self-auto shrink-0"
              >
                <span>Lanjut ke Data Mempelai & Acara</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: Data Mempelai & Acara Form */}
      {activeSubTab === 'details' && (
        <form onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-6">
          {/* Ayat / Kutipan Suci */}
          <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Sparkles size={18} className="text-rose-500" />
              <h3 className="font-serif text-lg font-bold text-slate-900">Ayat / Kutipan Suci Pernikahan</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Judul Kutipan / Nama Surat:</label>
                <input
                  type="text"
                  value={quoteTitle}
                  onChange={e => setQuoteTitle(e.target.value)}
                  placeholder="Surat Ar-Rum : 21"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Isi Kutipan / Terjemahan Ayat:</label>
                <textarea
                  rows={3}
                  value={quoteBody}
                  onChange={e => setQuoteBody(e.target.value)}
                  placeholder="Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>
            </div>
          </section>

          {/* Profil Kedua Mempelai */}
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
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Instagram size={13} className="text-rose-500" />
                      Akun Instagram (Opsional):
                    </span>
                  </label>
                  <div className="flex items-center">
                    <span className="bg-slate-200/80 border border-r-0 border-slate-300 rounded-l-xl px-2.5 py-2.5 text-xs text-slate-600 font-mono">@</span>
                    <input
                      type="text"
                      value={groomInstagram.replace(/^@/, '')}
                      onChange={e => setGroomInstagram(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''))}
                      placeholder="ahmad.rohim"
                      className="w-full bg-white border border-slate-300 rounded-r-xl p-2.5 text-sm outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
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
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    <span className="inline-flex items-center gap-1">
                      <Instagram size={13} className="text-rose-500" />
                      Akun Instagram (Opsional):
                    </span>
                  </label>
                  <div className="flex items-center">
                    <span className="bg-rose-100 border border-r-0 border-rose-300 rounded-l-xl px-2.5 py-2.5 text-xs text-rose-700 font-mono">@</span>
                    <input
                      type="text"
                      value={brideInstagram.replace(/^@/, '')}
                      onChange={e => setBrideInstagram(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''))}
                      placeholder="wiwit.lestari"
                      className="w-full bg-white border border-rose-300 rounded-r-xl p-2.5 text-sm outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Foto Prewedding & Musik Latar Belakang */}
          <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b pb-3">
              <Camera size={18} className="text-rose-500" />
              <h3 className="font-serif text-lg font-bold text-slate-900">Foto Prewedding &amp; Musik Latar Belakang</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Foto Prewedding */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Foto Cover / Prewedding</span>
                    <span className="text-[11px] text-slate-500">Lengkungan gerbang</span>
                  </div>

                  {/* Preset Quick-Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 block">Pilihan Cepat Foto:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '🌸 Bunga Mewah', url: '/images/wedding-flowers.jpg' },
                        { label: '🏞️ Danau Romantis', url: '/images/landscape-lake.jpg' },
                      ].map(preset => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setCoverPhotoUrl(preset.url)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                            coverPhotoUrl === preset.url 
                              ? 'bg-rose-50 border-rose-400 text-rose-700 font-semibold' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">URL Foto (Link Gambar Eksternal / Cloud):</label>
                    <input
                      type="url"
                      value={coverPhotoUrl}
                      onChange={e => setCoverPhotoUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... atau /images/..."
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Live Photo Preview */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Pratinjau Foto Cover:</span>
                  <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center">
                    {coverPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverPhotoUrl}
                        alt="Pratinjau Cover"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                        <ImageIcon size={24} />
                        <span>Belum ada foto yang dipilih</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Musik Latar Belakang */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Musik Latar (Backsound MP3)</span>
                    <span className="text-[11px] text-slate-500">Auto-play saat dibuka</span>
                  </div>

                  {/* Hidden Audio Player for Preview */}
                  <audio ref={audioPreviewRef} src={musicUrl} preload="none" onEnded={() => setIsPlayingAudioPreview(false)} />

                  {/* Preset Audio Selection */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 block">Pilihan Musik Siap Pakai:</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { label: '🎵 Akustik Pop Romantis', url: '/audio/wedding-acoustic.mp3', tag: 'Populer' },
                        { label: '🏛️ Gamelan Tradisional Jawa', url: 'https://assets.pocketwedding.id/audio/gamelan-wedding.mp3', tag: 'Sakral' },
                        { label: '🌴 Rindik Tradisional Bali', url: 'https://assets.pocketwedding.id/audio/rindik-bali.mp3', tag: 'Damai' },
                        { label: '🪕 Gambus & Oud Islami', url: 'https://assets.pocketwedding.id/audio/islamic-wedding.mp3', tag: 'Syahdu' },
                      ].map(preset => {
                        const isSelected = musicUrl === preset.url;
                        return (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => {
                              setMusicUrl(preset.url);
                              if (isPlayingAudioPreview && audioPreviewRef.current) {
                                audioPreviewRef.current.pause();
                                setIsPlayingAudioPreview(false);
                              }
                            }}
                            className={`p-2 rounded-xl text-left text-xs border transition flex items-center justify-between gap-2 ${
                              isSelected 
                                ? 'bg-rose-50 border-rose-400 text-rose-900 font-semibold' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{preset.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 shrink-0 font-normal">
                              {preset.tag}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">URL Audio Kustom (.mp3):</label>
                    <input
                      type="url"
                      value={musicUrl}
                      onChange={e => {
                        setMusicUrl(e.target.value);
                        if (isPlayingAudioPreview && audioPreviewRef.current) {
                          audioPreviewRef.current.pause();
                          setIsPlayingAudioPreview(false);
                        }
                      }}
                      placeholder="https://domain.com/musik-pilihan.mp3"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Audio Preview Control Button */}
                <div className="pt-2 flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                      <Volume2 size={16} />
                    </span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">Uji Dengar Musik</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[150px] sm:max-w-xs">{musicUrl}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={toggleAudioPreview}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      isPlayingAudioPreview
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    {isPlayingAudioPreview ? <Pause size={13} /> : <Play size={13} />}
                    <span>{isPlayingAudioPreview ? 'Jeda Audio' : 'Putar Audio'}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Jadwal & Lokasi Acara */}
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

          {/* Amplop Digital & Hadiah */}
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
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('templates')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
            >
              ← Kembali ke Pilihan Template
            </button>
            <div className="flex items-center gap-2">
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
          </div>

          {/* Wishes Wall Management */}
          <section className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-4 mt-6">
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
                      type="button"
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

          {/* Next Step Banner to WhatsApp */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Data undangan sudah lengkap?</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Kirim tautan personal undangan ke teman dan kerabat melalui generator WhatsApp.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('whatsapp')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs self-start sm:self-auto shrink-0"
            >
              <span>Kirim via WhatsApp</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: WhatsApp Sender */}
      {activeSubTab === 'whatsapp' && (
        <section className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-emerald-200/80 pb-3">
            <span className="p-2 bg-emerald-500 text-white rounded-xl">
              <Send size={18} />
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">Kirim Undangan via WhatsApp ke Buku Tamu</h3>
              <p className="text-xs text-slate-600">Pilih tamu dari buku tamu untuk membuat tautan dengan nama tamu otomatis.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Pilih Tamu Undangan:</label>
              <select
                aria-label="Pilih Tamu Undangan"
                value={selectedGuestId}
                onChange={e => setSelectedGuestId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">-- Tamu Umum (Tanpa Nama Khusus) --</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.pax} pax) {g.phone ? `· ${g.phone}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Nama tamu akan otomatis disisipkan pada teks pembuka undangan dan URL khusus <code>?to=Nama</code>.
              </p>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Preview Teks WhatsApp Siap Kirim:</label>
              <div className="bg-white border border-emerald-200 rounded-xl p-3.5 text-xs text-slate-700 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed shadow-2xs">
                {whatsappTemplate}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Share2 size={14} />
                  Buka & Kirim di WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyLink(guestPersonalUrl)}
                  className="px-3.5 py-2.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Copy size={13} />
                  Salin Link Personal
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
