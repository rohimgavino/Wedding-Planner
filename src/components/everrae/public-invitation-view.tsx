"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  Calendar, 
  Clock, 
  MapPin, 
  ExternalLink, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  MailOpen, 
  MessageSquareHeart, 
  Send, 
  Sparkles, 
  Gift, 
  Music,
  BookmarkCheck,
  Share2,
  ChevronDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { WeddingInvitation, InvitationWish } from '@/types';

interface PublicInvitationViewProps {
  slug?: string;
}

// Helper to generate Google Calendar Link
function makeGoogleCalendarUrl(title: string, dateStr?: string, timeStr?: string, venue?: string, address?: string): string {
  if (!dateStr) return '#';
  const cleanDate = dateStr.replace(/-/g, '');
  const startIso = `${cleanDate}T080000Z`;
  const endIso = `${cleanDate}T130000Z`;
  const text = encodeURIComponent(title);
  const location = encodeURIComponent(`${venue || ''}, ${address || ''}`.trim());
  const details = encodeURIComponent(`Menghadiri ${title}. Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}

export function PublicInvitationView({ slug: propSlug }: PublicInvitationViewProps = {}) {
  const params = useParams();
  const searchParams = useSearchParams();
  const pathnameSlug = typeof window !== 'undefined' ? window.location.pathname.replace(/^\/u\/?/, '').split('/')[0].split('?')[0] : '';
  const slug = propSlug || (params?.slug as string) || pathnameSlug || '';
  const guestName = searchParams?.get('to') || '';

  const [invitation, setInvitation] = useState<WeddingInvitation | null>(null);
  const [wishes, setWishes] = useState<InvitationWish[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Cover opening state
  const [isOpened, setIsOpened] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // RSVP Form states
  const [senderName, setSenderName] = useState(guestName);
  const [attendance, setAttendance] = useState<'attending' | 'not_attending' | 'tentative'>('attending');
  const [pax, setPax] = useState(1);
  const [message, setMessage] = useState('');
  const [submittingWish, setSubmittingWish] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Quick Greetings template chips
  const quickWishes = [
    "Barakallahu lakuma wa baraka 'alaikuma wa jama'a bainakuma fii khoir 🤲",
    "Selamat menempuh hidup baru! Semoga sakinah, mawaddah, warahmah.",
    "Happy wedding! Bahagia selalu dan saling menguatkan sampai surga ✨",
    "Selamat atas pernikahannya! Semoga senantiasa dipenuhi keberkahan."
  ];

  // Load invitation & wishes
  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      
      const isPreview = searchParams?.get('preview') === 'true';
      const { data: inv, error: invError } = await supabase
        .from('wedding_invitations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (invError || !inv || (!inv.is_published && !isPreview)) {
        if (slug === 'preview' || isPreview || slug === 'rohim-wiwit') {
          setInvitation({
            id: 'preview-id',
            workspace_id: 'preview-ws',
            slug: slug || 'rohim-wiwit',
            is_published: true,
            theme: 'classic-ivory',
            quote_title: 'Surat Ar-Rum : 21',
            quote_body: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
            groom_full_name: 'Ahmad Nur Rohim',
            groom_nickname: 'Rohim',
            groom_parents: 'Putra tercinta dari Bpk. H. Ahmad & Ibu Hj. Siti',
            bride_full_name: 'Wiwit Nur Hidayah',
            bride_nickname: 'Wiwit',
            bride_parents: 'Putri tercinta dari Bpk. Drs. H. Subagyo & Ibu Hj. Aminah',
            akad_date: '2027-03-24',
            akad_time: '08:00 - 10:00 WIB',
            akad_venue: "Masjid Raya Grand Mosque",
            akad_address: 'Jl. Kaliurang KM 9, Sleman, D.I. Yogyakarta',
            akad_maps_url: 'https://maps.google.com/?q=Yogyakarta',
            resepsi_date: '2027-03-24',
            resepsi_time: '11:00 - 14:00 WIB',
            resepsi_venue: 'The Grand Ballroom Palace',
            resepsi_address: 'Jl. Gejayan No. 9, Sleman, D.I. Yogyakarta',
            resepsi_maps_url: 'https://maps.google.com/?q=Yogyakarta',
            gift_bank_name: 'BCA (Bank Central Asia)',
            gift_account_number: '8020 9481 22',
            gift_account_holder: 'Ahmad Nur Rohim',
            gift_address: 'Gedung Graha Cinta, Jl. Kaliurang KM 9, Sleman, DIY 55581 (Penerima: Rohim & Wiwit - 081234567890)',
            music_url: '/audio/wedding-acoustic.mp3'
          });
          setLoading(false);
          return;
        }
        setNotFound(true);
        setLoading(false);
        return;
      }

      setInvitation(inv as WeddingInvitation);

      // Load wishes
      const { data: wishList } = await supabase
        .from('wedding_invitation_wishes')
        .select('*')
        .eq('invitation_id', inv.id)
        .order('created_at', { ascending: false });

      setWishes((wishList || []) as InvitationWish[]);
      setLoading(false);
    };

    void load();
  }, [slug, searchParams]);

  // Update senderName when guestName query param loads
  useEffect(() => {
    if (guestName && !senderName) {
      setSenderName(guestName);
    }
  }, [guestName, senderName]);

  // Countdown timer effect
  useEffect(() => {
    const targetDateStr = invitation?.resepsi_date || invitation?.akad_date;
    if (!targetDateStr) return;

    const target = new Date(targetDateStr).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [invitation]);

  const handleOpenInvitation = () => {
    setIsOpened(true);
    // Play audio safely
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(() => {
        setIsPlayingMusic(false);
      });
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(() => {});
    }
  };

  const handleCopy = async (text: string, isAddr = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isAddr) {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedBank(true);
        setTimeout(() => setCopiedBank(false), 2000);
      }
    } catch {}
  };

  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || submittingWish || !senderName.trim() || !message.trim()) return;

    setSubmittingWish(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('submit_invitation_wish', {
        p_slug: slug,
        p_guest_name: senderName.trim(),
        p_attendance: attendance,
        p_pax: Number(pax),
        p_message: message.trim()
      });

      if (!error && data) {
        setWishes(prev => [data as InvitationWish, ...prev]);
        setMessage('');
        setWishSuccess(true);
        setTimeout(() => setWishSuccess(false), 3500);
      } else if (slug === 'rohim-wiwit' || slug === 'preview') {
        // Local simulation fallback for preview
        const mockWish: InvitationWish = {
          id: Math.random().toString(),
          invitation_id: invitation.id,
          guest_name: senderName.trim(),
          attendance,
          pax: Number(pax),
          message: message.trim(),
          created_at: new Date().toISOString()
        };
        setWishes(prev => [mockWish, ...prev]);
        setMessage('');
        setWishSuccess(true);
        setTimeout(() => setWishSuccess(false), 3500);
      }
    } catch {
      // fallback
    } finally {
      setSubmittingWish(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 text-center">
        <div className="relative">
          <Heart size={40} className="text-amber-600 animate-pulse" />
          <Sparkles size={20} className="text-amber-400 absolute -top-2 -right-2 animate-bounce" />
        </div>
        <p className="font-serif text-slate-800 text-sm tracking-widest mt-4 uppercase">Membuka Kartu Undangan…</p>
        <p className="text-xs text-slate-400 mt-1">Mohon tunggu sebentar</p>
      </div>
    );
  }

  if (notFound || !invitation) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <Heart size={44} className="text-slate-300 mb-3" />
        <h1 className="font-serif text-2xl font-bold text-slate-800 mb-2">Undangan Belum Tersedia</h1>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Tautan undangan ini tidak ditemukan atau belum dipublikasikan oleh kedua mempelai.
        </p>
        <Link 
          href="/"
          className="px-5 py-2.5 rounded-full bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition"
        >
          Kunjungi Pocket Wedding
        </Link>
      </div>
    );
  }

  // Theme styling configurations
  const themeClass = {
    'classic-ivory': 'bg-[#FBF9F5] text-slate-800 font-sans',
    'sage-garden': 'bg-[#F4F7F4] text-slate-800 font-sans',
    'romantic-rose': 'bg-[#FDF6F7] text-slate-800 font-sans',
    'midnight-gold': 'bg-[#0D1322] text-slate-100 font-sans',
  }[invitation.theme || 'classic-ivory'];

  const accentColor = {
    'classic-ivory': 'text-amber-900 bg-[#FFFDF9] border-amber-200/90 shadow-sm',
    'sage-garden': 'text-emerald-950 bg-[#F9FBF9] border-emerald-200/90 shadow-sm',
    'romantic-rose': 'text-rose-950 bg-[#FFFDFD] border-rose-200/90 shadow-sm',
    'midnight-gold': 'text-amber-200 bg-[#141C30] border-amber-400/30 shadow-sm',
  }[invitation.theme || 'classic-ivory'];

  const buttonAccent = {
    'classic-ivory': 'bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white',
    'sage-garden': 'bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 text-white',
    'romantic-rose': 'bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-800 hover:to-rose-900 text-white',
    'midnight-gold': 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold',
  }[invitation.theme || 'classic-ivory'];

  const dateFormatted = invitation.resepsi_date 
    ? new Date(invitation.resepsi_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : invitation.akad_date 
      ? new Date(invitation.akad_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : '';

  return (
    <div className={`min-h-screen ${themeClass} selection:bg-rose-100 relative overflow-x-hidden`}>
      {/* Background Audio Track */}
      <audio ref={audioRef} loop src={invitation.music_url || '/audio/wedding-acoustic.mp3'} preload="auto" />

      {/* ========================================================
          DECORATIVE BACKGROUND TEXTURES, AURA & ROMANTIC PETALS
          ======================================================== */}
      {/* 1. Fine Linen Art Paper Grain Texture */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(198, 170, 120, 0.05) 1px, transparent 1px), radial-gradient(circle at 0% 0%, rgba(160, 125, 75, 0.04) 1px, transparent 1px)`,
          backgroundSize: '18px 18px, 28px 28px'
        }}
        aria-hidden="true"
      />

      {/* 2. Soft Radial Golden Ambient Glow Vignettes */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full bg-gradient-to-b from-amber-200/20 via-amber-100/10 to-transparent blur-3xl" />
        <div className="absolute top-[35%] -left-[15%] w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-amber-300/15 via-rose-200/10 to-transparent blur-3xl" />
        <div className="absolute top-[65%] -right-[15%] w-[560px] h-[560px] rounded-full bg-gradient-to-bl from-amber-200/20 via-emerald-100/10 to-transparent blur-3xl" />
        <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 w-[650px] h-[650px] rounded-full bg-gradient-to-t from-amber-300/15 via-amber-100/5 to-transparent blur-3xl" />
      </div>

      {/* 3. Luxury Botanical Filigree Watermarks (SVG Corner Ornaments) */}
      <div className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden" aria-hidden="true">
        {/* Top-Left Botanical Branch */}
        <svg className="absolute -top-4 -left-4 w-52 h-52 text-[#C6AA78] opacity-[0.14] rotate-[-15deg]" viewBox="0 0 200 200" fill="none" stroke="currentColor">
          <path d="M20,180 Q60,120 120,80 T190,20" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M60,120 Q45,100 40,85 Q55,95 60,120" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <path d="M85,105 Q105,95 115,80 Q105,100 85,105" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <path d="M120,80 Q110,55 100,45 Q120,60 120,80" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <path d="M150,60 Q170,50 175,35 Q165,55 150,60" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <circle cx="120" cy="80" r="2.5" fill="currentColor" />
          <circle cx="150" cy="60" r="2" fill="currentColor" />
          <circle cx="190" cy="20" r="3" fill="currentColor" />
        </svg>

        {/* Top-Right Botanical Branch */}
        <svg className="absolute -top-4 -right-4 w-52 h-52 text-[#C6AA78] opacity-[0.14] scale-x-[-1] rotate-[-15deg]" viewBox="0 0 200 200" fill="none" stroke="currentColor">
          <path d="M20,180 Q60,120 120,80 T190,20" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M60,120 Q45,100 40,85 Q55,95 60,120" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <path d="M85,105 Q105,95 115,80 Q105,100 85,105" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <path d="M120,80 Q110,55 100,45 Q120,60 120,80" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <path d="M150,60 Q170,50 175,35 Q165,55 150,60" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <circle cx="120" cy="80" r="2.5" fill="currentColor" />
          <circle cx="150" cy="60" r="2" fill="currentColor" />
          <circle cx="190" cy="20" r="3" fill="currentColor" />
        </svg>

        {/* Bottom-Left Floral Sprig */}
        <svg className="absolute -bottom-6 -left-6 w-60 h-60 text-[#C6AA78] opacity-[0.12] rotate-[45deg]" viewBox="0 0 200 200" fill="none" stroke="currentColor">
          <path d="M180,20 Q120,60 80,120 T20,190" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M120,60 Q100,45 85,40 Q95,55 120,60" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <path d="M105,85 Q95,105 80,115 Q100,105 105,85" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <path d="M80,120 Q55,110 45,100 Q60,120 80,120" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
        </svg>

        {/* Bottom-Right Floral Sprig */}
        <svg className="absolute -bottom-6 -right-6 w-60 h-60 text-[#C6AA78] opacity-[0.12] scale-x-[-1] rotate-[45deg]" viewBox="0 0 200 200" fill="none" stroke="currentColor">
          <path d="M180,20 Q120,60 80,120 T20,190" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M120,60 Q100,45 85,40 Q95,55 120,60" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <path d="M105,85 Q95,105 80,115 Q100,105 105,85" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          <path d="M80,120 Q55,110 45,100 Q60,120 80,120" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
        </svg>
      </div>

      {/* 4. Falling Gentle Golden Rose Petals (Romantic Atmosphere) */}
      {isOpened && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          {[
            { left: '10%', delay: '0s', dur: '14s', size: 14, rot: 35 },
            { left: '26%', delay: '4s', dur: '18s', size: 18, rot: 60 },
            { left: '44%', delay: '7s', dur: '16s', size: 12, rot: 15 },
            { left: '62%', delay: '2s', dur: '15s', size: 16, rot: 45 },
            { left: '79%', delay: '9s', dur: '20s', size: 19, rot: 80 },
            { left: '92%', delay: '5s', dur: '17s', size: 13, rot: 25 },
          ].map((petal, idx) => (
            <div
              key={idx}
              className="absolute top-[-40px] pointer-events-none opacity-40 animate-fall-petal"
              style={{
                left: petal.left,
                animationDelay: petal.delay,
                animationDuration: petal.dur,
              }}
            >
              <svg
                width={petal.size}
                height={petal.size * 1.3}
                viewBox="0 0 24 32"
                fill="none"
                style={{ transform: `rotate(${petal.rot}deg)` }}
              >
                <path
                  d="M12,0 C20,8 24,18 20,26 C16,32 8,32 4,26 C0,18 4,8 12,0 Z"
                  fill="currentColor"
                  className="text-amber-300/40"
                />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* Floating Audio Controller */}
      {isOpened && (
        <button
          onClick={toggleMusic}
          aria-label={isPlayingMusic ? 'Hentikan musik' : 'Putar musik'}
          className="fixed top-5 right-5 z-40 p-3 rounded-full bg-white/90 backdrop-blur-md shadow-xl border border-amber-200/70 text-slate-800 hover:scale-105 active:scale-95 transition flex items-center justify-center"
        >
          {isPlayingMusic ? (
            <div className="relative">
              <Music size={18} className="text-amber-700 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
          ) : (
            <VolumeX size={18} className="text-slate-400" />
          )}
        </button>
      )}

      {/* Floating Bottom Sticky Navigation Pill */}
      {isOpened && (
        <nav 
          aria-label="Navigasi bagian undangan"
          className="fixed bottom-5 inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
        >
          <div className="bg-slate-900/90 text-white backdrop-blur-lg border border-white/20 rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-6 pointer-events-auto text-xs font-serif tracking-wider">
            <button 
              type="button"
              onClick={() => scrollToSection('mempelai')} 
              className="hover:text-amber-300 transition flex flex-col items-center gap-0.5"
            >
              <Heart size={14} />
              <span className="text-[10px]">Mempelai</span>
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection('acara')} 
              className="hover:text-amber-300 transition flex flex-col items-center gap-0.5"
            >
              <Calendar size={14} />
              <span className="text-[10px]">Acara</span>
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection('kado')} 
              className="hover:text-amber-300 transition flex flex-col items-center gap-0.5"
            >
              <Gift size={14} />
              <span className="text-[10px]">Kado</span>
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection('doa')} 
              className="hover:text-amber-300 transition flex flex-col items-center gap-0.5"
            >
              <MessageSquareHeart size={14} />
              <span className="text-[10px]">Doa</span>
            </button>
          </div>
        </nav>
      )}

      {/* ========================================================
          1. COVER / AMPLOP PEMBUKA (LUXURY ROYAL WAX SEAL)
          ======================================================== */}
      {!isOpened && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Background Photo with Dark Luxury Scrim */}
          <div className="absolute inset-0">
            <Image
              src="/images/wedding-flowers.jpg"
              alt="Wedding Flowers"
              fill
              className="object-cover scale-105 filter blur-xs"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1E1513]/90 via-[#18110F]/93 to-[#0E0B0A]/98 backdrop-blur-xs" />
          </div>

          {/* Ornamental Golden Border Frame */}
          <div className="relative max-w-md w-full bg-gradient-to-b from-white/12 to-white/5 border border-amber-300/40 rounded-[32px] p-6 sm:p-8 text-center space-y-6 shadow-2xl backdrop-blur-md animate-fade-in">
            {/* Inner Gold Hairline Frame */}
            <div className="absolute inset-2.5 rounded-[26px] border border-amber-200/25 pointer-events-none" />

            {/* Royal Monogram Emblem */}
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-[2px] shadow-lg shadow-amber-950/40">
              <div className="w-full h-full rounded-full bg-[#18110F] flex items-center justify-center text-amber-200 font-serif text-lg tracking-widest font-bold">
                {invitation.groom_nickname[0] || 'R'}&{invitation.bride_nickname[0] || 'W'}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-amber-200/90 font-serif block">
                WALIMATUL &lsquo;URSY
              </span>
              <p className="text-[9px] tracking-widest text-white/60 font-sans uppercase">
                THE WEDDING CELEBRATION OF
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl font-normal text-white tracking-wide pt-1">
                {invitation.groom_nickname} <span className="font-light italic text-amber-300">&</span> {invitation.bride_nickname}
              </h1>
              <p className="text-xs text-amber-100/80 font-serif tracking-widest pt-2">
                {dateFormatted}
              </p>
            </div>

            {/* Guest Invitation Box */}
            <div className="py-4 px-3 rounded-2xl bg-black/40 border border-white/15 my-4 space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-amber-200/80 block">
                Kepada Yth. Bapak/Ibu/Saudara/i:
              </span>
              <strong className="text-lg sm:text-xl font-serif text-white block capitalize">
                {guestName || 'Tamu Undangan Yang Berbahagia'}
              </strong>
              <span className="text-[10px] text-white/50 block">Di Tempat</span>
              <p className="text-[9px] text-white/40 italic pt-1">
                *Mohon maaf apabila ada kesalahan penulisan nama atau gelar
              </p>
            </div>

            {/* Open Invitation CTA */}
            <button
              onClick={handleOpenInvitation}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-serif font-bold text-sm tracking-wider uppercase transition shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              <MailOpen size={18} className="text-slate-950 transition-transform group-hover:-translate-y-0.5" />
              <span>Buka Undangan</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          2. ISI UNDANGAN LENGKAP (MAIN CONTENT)
          ======================================================== */}
      <main className="max-w-2xl mx-auto px-4 py-12 sm:py-20 space-y-20 relative z-10">
        
        {/* ================= HERO SECTION ================= */}
        <section className="text-center space-y-6 pt-4">
          <div className="relative rounded-[36px] overflow-hidden border border-amber-300/40 p-8 sm:p-12 shadow-xl bg-gradient-to-b from-[#2A1E1B] to-[#171110] text-white">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-25">
              <Image
                src="/images/wedding-flowers.jpg"
                alt="Flower texture"
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute inset-2.5 rounded-[30px] border border-amber-200/20 pointer-events-none" />

            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-amber-300/30 bg-black/30 text-amber-200 text-[10px] font-serif tracking-[0.25em] uppercase">
                <Sparkles size={12} className="text-amber-300" />
                <span>The Wedding Celebration</span>
              </div>

              <h2 className="font-serif text-5xl sm:text-6xl font-light tracking-tight text-white">
                {invitation.groom_nickname} <span className="italic text-amber-300 font-normal">&</span> {invitation.bride_nickname}
              </h2>

              <p className="text-xs sm:text-sm font-serif tracking-widest text-amber-100/90 pt-1">
                {dateFormatted}
              </p>

              {/* COUNTDOWN TIMER */}
              <div className="pt-6">
                <p className="text-[10px] uppercase font-serif tracking-widest text-amber-200/75 mb-3">
                  Menghitung Hari Bahagia
                </p>
                <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-xs mx-auto">
                  {[
                    { label: 'Hari', value: timeLeft.days },
                    { label: 'Jam', value: timeLeft.hours },
                    { label: 'Menit', value: timeLeft.minutes },
                    { label: 'Detik', value: timeLeft.seconds },
                  ].map((box, i) => (
                    <div key={i} className="p-2.5 sm:p-3 rounded-2xl bg-black/40 border border-amber-300/30 backdrop-blur text-center">
                      <strong className="block text-xl sm:text-2xl font-serif text-amber-200 font-semibold font-variant-numeric:tabular-nums">
                        {box.value}
                      </strong>
                      <span className="text-[9px] uppercase tracking-wider text-white/60">{box.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAVE THE DATE BUTTON */}
              <div className="pt-4">
                <a
                  href={makeGoogleCalendarUrl(
                    `Pernikahan ${invitation.groom_nickname} & ${invitation.bride_nickname}`,
                    invitation.resepsi_date || invitation.akad_date,
                    invitation.resepsi_time || invitation.akad_time,
                    invitation.resepsi_venue || invitation.akad_venue,
                    invitation.resepsi_address || invitation.akad_address
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-serif font-bold tracking-wider uppercase transition shadow-md hover:scale-105"
                >
                  <BookmarkCheck size={14} />
                  <span>Simpan ke Google Calendar</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ================= AYAT SUCI / DOA AR-RUM ================= */}
        {invitation.quote_body && (
          <section className="text-center max-w-xl mx-auto p-8 sm:p-10 rounded-[32px] border border-amber-200/80 bg-white/70 backdrop-blur shadow-sm space-y-4">
            <p className="text-base font-serif text-amber-900 tracking-wide">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <div className="w-12 h-0.5 bg-amber-300 mx-auto rounded-full" />
            <h3 className="font-serif text-xs font-bold tracking-widest uppercase text-amber-800">
              {invitation.quote_title || 'Surat Ar-Rum : 21'}
            </h3>
            <p className="text-xs sm:text-sm font-serif italic leading-relaxed text-slate-700 max-w-md mx-auto">
              &ldquo;{invitation.quote_body}&rdquo;
            </p>
          </section>
        )}

        {/* ================= PROFIL MEMPELAI (THE COUPLE) ================= */}
        <section id="mempelai" className="space-y-10 text-center scroll-mt-20">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-serif tracking-[0.25em] text-amber-800 block">
              PASANGAN MEMPELAI
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
              Kedua Mempelai
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Dengan memohon rahmat dan ridho-Nya, kami bermaksud mengikat janji suci:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
            {/* Pengantin Pria */}
            <div className={`p-8 rounded-[32px] border ${accentColor} space-y-4 text-center relative overflow-hidden group hover:shadow-md transition`}>
              {/* Floral corner flourish accent */}
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-[2px] shadow-md">
                <div className="w-full h-full rounded-full bg-[#FAF8F5] flex items-center justify-center font-serif text-2xl font-bold text-amber-900">
                  {invitation.groom_nickname[0] || 'R'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-amber-800 font-serif font-bold">
                  Mempelai Pria
                </span>
                <h4 className="font-serif text-2xl font-bold text-slate-900">{invitation.groom_full_name}</h4>
                <p className="text-xs text-slate-600 font-serif leading-relaxed pt-1">
                  {invitation.groom_parents}
                </p>
              </div>
            </div>

            {/* Pengantin Wanita */}
            <div className={`p-8 rounded-[32px] border ${accentColor} space-y-4 text-center relative overflow-hidden group hover:shadow-md transition`}>
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-[2px] shadow-md">
                <div className="w-full h-full rounded-full bg-[#FAF8F5] flex items-center justify-center font-serif text-2xl font-bold text-amber-900">
                  {invitation.bride_nickname[0] || 'W'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-amber-800 font-serif font-bold">
                  Mempelai Wanita
                </span>
                <h4 className="font-serif text-2xl font-bold text-slate-900">{invitation.bride_full_name}</h4>
                <p className="text-xs text-slate-600 font-serif leading-relaxed pt-1">
                  {invitation.bride_parents}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= DETAIL ACARA (AKAD & RESEPSI) ================= */}
        <section id="acara" className="space-y-10 text-center scroll-mt-20">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-serif tracking-[0.25em] text-amber-800 block">
              WAKTU & TEMPAT
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
              Rangkaian Acara
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir di acara kami:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
            {/* Kartu Akad Nikah */}
            <div className={`p-7 rounded-[32px] border ${accentColor} text-left space-y-5 flex flex-col justify-between`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-3 border-amber-200/60">
                  <strong className="font-serif text-xl text-amber-950 font-bold">Akad Nikah</strong>
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                    <Heart size={16} />
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5 font-medium">
                    <Calendar size={16} className="text-amber-800 shrink-0" />
                    <span>{invitation.akad_date ? new Date(invitation.akad_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 font-medium">
                    <Clock size={16} className="text-amber-800 shrink-0" />
                    <span>{invitation.akad_time || '08:00 WIB - Selesai'}</span>
                  </div>
                  <div className="flex items-start gap-2.5 pt-1">
                    <MapPin size={16} className="text-amber-800 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-sm font-serif font-bold text-slate-900">{invitation.akad_venue}</strong>
                      <span className="text-slate-500 block text-[11px] leading-relaxed pt-0.5">{invitation.akad_address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {invitation.akad_maps_url && (
                <div className="pt-3 border-t border-amber-100 flex flex-wrap gap-2">
                  <a
                    href={invitation.akad_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold ${buttonAccent} transition shadow-sm`}
                  >
                    <MapPin size={13} />
                    <span>Petunjuk Lokasi (Maps)</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>

            {/* Kartu Resepsi */}
            <div className={`p-7 rounded-[32px] border ${accentColor} text-left space-y-5 flex flex-col justify-between`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-3 border-amber-200/60">
                  <strong className="font-serif text-xl text-amber-950 font-bold">Resepsi Pernikahan</strong>
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                    <Sparkles size={16} />
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5 font-medium">
                    <Calendar size={16} className="text-amber-800 shrink-0" />
                    <span>{invitation.resepsi_date ? new Date(invitation.resepsi_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                  </div>
                  <div className="flex items-center gap-2.5 font-medium">
                    <Clock size={16} className="text-amber-800 shrink-0" />
                    <span>{invitation.resepsi_time || '11:00 WIB - 14:00 WIB'}</span>
                  </div>
                  <div className="flex items-start gap-2.5 pt-1">
                    <MapPin size={16} className="text-amber-800 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-sm font-serif font-bold text-slate-900">{invitation.resepsi_venue}</strong>
                      <span className="text-slate-500 block text-[11px] leading-relaxed pt-0.5">{invitation.resepsi_address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {invitation.resepsi_maps_url && (
                <div className="pt-3 border-t border-amber-100 flex flex-wrap gap-2">
                  <a
                    href={invitation.resepsi_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold ${buttonAccent} transition shadow-sm`}
                  >
                    <MapPin size={13} />
                    <span>Petunjuk Lokasi (Maps)</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= LOVE STORY TIMELINE ================= */}
        <section className="text-center max-w-lg mx-auto space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-serif tracking-[0.25em] text-amber-800 block">
              KISAH KAMI
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              Cerita Perjalanan Cinta
            </h3>
          </div>

          <div className="space-y-4 text-left">
            <div className="p-4 rounded-2xl bg-white border border-amber-200/70 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-serif">Pertemuan Pertama</span>
              <h4 className="font-serif font-bold text-sm text-slate-900">Takdir Mempertemukan</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dipertemukan dalam sebuah momen sederhana yang membuka jalan komunikasi dan ketertarikan satu sama lain.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-amber-200/70 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-serif">Keseriusan & Lamaran</span>
              <h4 className="font-serif font-bold text-sm text-slate-900">Meminta Doa Restu</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dengan niat yang tulus dan restu kedua orang tua, kami mengikat janji untuk melangkah ke jenjang pernikahan.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-300/80 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-serif">Hari Bahagia</span>
              <h4 className="font-serif font-bold text-sm text-amber-950">Menuju Ikatan Suci</h4>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                InsyaAllah kami akan mengikrarkan akad suci, menyatukan dua keluarga dalam naungan cinta dan ridho-Nya.
              </p>
            </div>
          </div>
        </section>

        {/* ================= AMPLOP DIGITAL & KADO ================= */}
        {invitation.gift_account_number && (
          <section id="kado" className="text-center max-w-lg mx-auto space-y-6 scroll-mt-20">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-serif tracking-[0.25em] text-amber-800 block">
                TANDA KASIH
              </span>
              <h3 className="font-serif text-3xl font-bold text-slate-900">
                Amplop Digital & Kado
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Doa restu Anda merupakan karunia terindah bagi kami. Bagi Anda yang bermaksud memberikan tanda kasih, dapat melalui:
              </p>
            </div>

            {/* VIP Digital Bank Card */}
            <div className="p-6 sm:p-7 rounded-[28px] bg-gradient-to-br from-[#241A18] via-[#1A1210] to-[#0F0B0A] text-white border border-amber-300/40 shadow-xl space-y-4 text-left relative overflow-hidden">
              {/* Chip illustration */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-400 to-amber-200 opacity-90 shadow-inner flex items-center justify-center">
                  <div className="w-7 h-5 border border-amber-800/40 rounded-xs" />
                </div>
                <span className="font-serif text-xs uppercase tracking-widest text-amber-200 font-bold">
                  {invitation.gift_bank_name || 'BANK BCA'}
                </span>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-[9px] uppercase tracking-wider text-white/50 block">NOMOR REKENING</span>
                <div className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-amber-200">
                  {invitation.gift_account_number}
                </div>
                <p className="text-xs font-serif text-white/90 pt-1">
                  Atas Nama: <strong className="text-amber-100">{invitation.gift_account_holder}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(invitation.gift_account_number || '', false)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition flex items-center justify-center gap-2 shadow-sm"
              >
                {copiedBank ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedBank ? 'Nomor Rekening Tersalin!' : 'Salin Nomor Rekening'}</span>
              </button>
            </div>

            {/* Physical Gift Delivery Address */}
            {invitation.gift_address && (
              <div className="p-5 rounded-2xl bg-white border border-amber-200/70 text-left text-xs space-y-2 shadow-xs">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <Gift size={15} />
                  <span>Kirim Kado Fisik ke Alamat:</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{invitation.gift_address}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(invitation.gift_address || '', true)}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-800 font-semibold hover:underline pt-1"
                >
                  {copiedAddress ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedAddress ? 'Alamat Tersalin!' : 'Salin Alamat Lengkap'}</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* ================= FORM RSVP & WISHES WALL ================= */}
        <section id="doa" className="space-y-8 max-w-xl mx-auto scroll-mt-20">
          <div className="text-center space-y-1.5">
            <span className="text-[10px] uppercase font-serif tracking-[0.25em] text-amber-800 block">
              RSVP & UCAPAN
            </span>
            <h3 className="font-serif text-3xl font-bold text-slate-900">
              Konfirmasi & Doa Restu
            </h3>
            <p className="text-xs text-slate-500">
              Mohon konfirmasi kehadiran serta kirimkan doa restu terbaik untuk kedua mempelai:
            </p>
          </div>

          {/* Form RSVP */}
          <form onSubmit={handleSubmitWish} className={`p-6 sm:p-7 rounded-[32px] border ${accentColor} space-y-4`}>
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">Nama Lengkap:</label>
              <input
                required
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder="Tuliskan nama Anda / keluarga"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-amber-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">Konfirmasi Kehadiran:</label>
                <select
                  aria-label="Konfirmasi Kehadiran"
                  value={attendance}
                  onChange={e => setAttendance(e.target.value as 'attending' | 'not_attending' | 'tentative')}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-amber-600"
                >
                  <option value="attending">Hadir</option>
                  <option value="not_attending">Tidak Dapat Hadir</option>
                  <option value="tentative">Masih Ragu</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">Jumlah Tamu (Pax):</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={pax}
                  onChange={e => setPax(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {/* Quick Greeting Chips */}
            <div>
              <span className="text-[10px] text-slate-500 font-semibold block mb-1.5">
                Template Ucapan Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickWishes.map((w, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMessage(w)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 transition text-left"
                  >
                    {w.slice(0, 36)}…
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">Ucapan & Doa Restu:</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tuliskan ucapan dan doa terbaik untuk kedua mempelai…"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-amber-600"
              />
            </div>

            <button
              type="submit"
              disabled={submittingWish}
              className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${buttonAccent} transition shadow-md`}
            >
              <Send size={14} />
              <span>{submittingWish ? 'Mengirimkan…' : 'Kirim Konfirmasi & Doa Restu'}</span>
            </button>

            {wishSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs rounded-xl text-center">
                Terima kasih! Ucapan dan doa restu Anda telah tersampaikan.
              </div>
            )}
          </form>

          {/* Wishes List */}
          <div className="space-y-3 pt-2">
            <h4 className="font-serif text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-amber-200/60 pb-2">
              Doa Restu dari Kerabat & Sahabat ({wishes.length})
            </h4>

            {wishes.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400 font-serif italic">
                Jadilah yang pertama mengirimkan ucapan doa restu untuk kedua mempelai.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {wishes.map(w => (
                  <div key={w.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5 text-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xs font-bold font-serif text-amber-950">{w.guest_name}</strong>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        w.attendance === 'attending' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : w.attendance === 'not_attending'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {w.attendance === 'attending' ? `Hadir (${w.pax} pax)` : w.attendance === 'not_attending' ? 'Tidak Hadir' : 'Ragu'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{w.message}</p>
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      {new Date(w.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="text-center pt-12 pb-16 border-t border-amber-200/60 space-y-3 text-slate-600">
          <p className="font-serif text-sm italic max-w-md mx-auto leading-relaxed">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.
          </p>
          <p className="font-serif font-bold text-lg text-slate-900 pt-2">
            Kami yang berbahagia,<br />
            {invitation.groom_nickname} & {invitation.bride_nickname}
          </p>
          <div className="pt-6">
            <Link href="/" className="text-[11px] text-slate-400 hover:text-slate-700 transition">
              Dibuat dengan cinta via Pocket Wedding
            </Link>
          </div>
        </footer>

      </main>
    </div>
  );
}
