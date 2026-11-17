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
  ChevronDown
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { WeddingInvitation, InvitationWish } from '@/types';

interface PublicInvitationViewProps {
  slug?: string;
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

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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
        if (slug === 'preview' || isPreview) {
          setInvitation({
            id: 'preview-id',
            workspace_id: 'preview-ws',
            slug: slug || 'preview',
            is_published: true,
            theme: 'classic-ivory',
            quote_title: 'Surat Ar-Rum : 21',
            quote_body: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
            groom_full_name: 'Ahmad Nur Rohim',
            groom_nickname: 'Rohim',
            groom_parents: 'Putra dari Bpk. H. Ahmad & Ibu Hj. Siti',
            bride_full_name: 'Wiwit',
            bride_nickname: 'Wiwit',
            bride_parents: 'Putri dari Bpk. Drs. H. Subagyo & Ibu Hj. Aminah',
            akad_date: '2027-03-24',
            akad_time: '08:00 - 10:00 WIB',
            akad_venue: "Masjid Jami' Yogyakarta",
            akad_address: 'Jl. Kaliurang KM 9, Sleman, D.I. Yogyakarta',
            resepsi_date: '2027-03-24',
            resepsi_time: '11:00 - 14:00 WIB',
            resepsi_venue: 'Ballroom Hotel Grand Keisha',
            resepsi_address: 'Jl. Affandi No. 9, Gejayan, Sleman, D.I. Yogyakarta',
            gift_bank_name: 'BCA',
            gift_account_number: '1234567890',
            gift_account_holder: 'Ahmad Nur Rohim',
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
        // Autoplay policy fallback
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

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
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
      }
    } catch {
      // fallback
    } finally {
      setSubmittingWish(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4 text-center">
        <Heart size={36} className="text-rose-400 animate-pulse mb-3" />
        <p className="font-serif text-slate-600 text-sm tracking-wide">Menyiapkan Undangan Pernikahan…</p>
      </div>
    );
  }

  if (notFound || !invitation) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
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
    'classic-ivory': 'bg-[#FAF8F5] text-slate-800 font-sans',
    'sage-garden': 'bg-[#F4F7F4] text-slate-800 font-sans',
    'romantic-rose': 'bg-[#FDF6F7] text-slate-800 font-sans',
    'midnight-gold': 'bg-[#0F172A] text-slate-100 font-sans',
  }[invitation.theme || 'classic-ivory'];

  const accentColor = {
    'classic-ivory': 'text-amber-700 bg-amber-50 border-amber-200',
    'sage-garden': 'text-emerald-800 bg-emerald-50 border-emerald-200',
    'romantic-rose': 'text-rose-800 bg-rose-50 border-rose-200',
    'midnight-gold': 'text-amber-300 bg-slate-800 border-amber-500/40',
  }[invitation.theme || 'classic-ivory'];

  const buttonAccent = {
    'classic-ivory': 'bg-amber-800 hover:bg-amber-900 text-white',
    'sage-garden': 'bg-emerald-800 hover:bg-emerald-900 text-white',
    'romantic-rose': 'bg-rose-700 hover:bg-rose-800 text-white',
    'midnight-gold': 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold',
  }[invitation.theme || 'classic-ivory'];

  return (
    <div className={`min-h-screen ${themeClass} selection:bg-rose-100 relative`}>
      {/* Background Audio */}
      <audio ref={audioRef} loop src={invitation.music_url || '/audio/wedding-acoustic.mp3'} preload="none" />

      {/* Floating Music Button (after cover opened) */}
      {isOpened && (
        <button
          onClick={toggleMusic}
          aria-label={isPlayingMusic ? 'Hentikan musik' : 'Putar musik'}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-white/90 backdrop-blur shadow-lg border border-slate-200 text-slate-800 hover:scale-105 transition"
        >
          {isPlayingMusic ? <Volume2 size={20} className="text-rose-600 animate-pulse" /> : <VolumeX size={20} className="text-slate-400" />}
        </button>
      )}

      {/* COVER / AMPLOP PEMBUKA */}
      {!isOpened && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gradient-to-b from-[#2B1B17]/95 to-[#1A120B]/95 text-white backdrop-blur-md">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-fade-in">
            <span className="text-xs uppercase tracking-[0.3em] text-amber-200 font-sans block">
              THE WEDDING INVITATION
            </span>

            <div className="space-y-1">
              <h1 className="font-serif text-4xl sm:text-5xl font-light text-white tracking-wide">
                {invitation.groom_nickname} & {invitation.bride_nickname}
              </h1>
              <p className="text-xs text-amber-100/80 font-serif tracking-widest pt-2">
                {invitation.resepsi_date ? new Date(invitation.resepsi_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
              </p>
            </div>

            <div className="py-4 border-y border-white/15 my-4 space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-white/70 block">
                Kepada Yth. Bapak/Ibu/Saudara/i:
              </span>
              <strong className="text-lg font-serif text-amber-200 block">
                {guestName || 'Tamu Undangan'}
              </strong>
              <span className="text-[10px] text-white/50 block">Di Tempat</span>
            </div>

            <button
              onClick={handleOpenInvitation}
              className="w-full py-3.5 px-6 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-serif font-bold text-sm tracking-wider uppercase transition shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <MailOpen size={17} />
              Buka Undangan
            </button>
          </div>
        </div>
      )}

      {/* ISI UNDANGAN LENGKAP */}
      <main className="max-w-3xl mx-auto px-4 py-16 space-y-24">
        
        {/* HERO SECTION */}
        <section className="text-center space-y-6 pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-current/20 text-xs font-serif tracking-widest uppercase opacity-80">
            <Sparkles size={14} />
            The Wedding of
          </div>

          <h2 className="font-serif text-5xl sm:text-7xl font-normal tracking-tight">
            {invitation.groom_nickname} <span className="italic font-light opacity-60">&</span> {invitation.bride_nickname}
          </h2>

          <p className="text-sm font-serif tracking-widest opacity-75">
            {invitation.akad_date ? new Date(invitation.akad_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
          </p>

          {/* COUNTDOWN TIMER */}
          <div className="pt-6 grid grid-cols-4 gap-3 max-w-sm mx-auto">
            {[
              { label: 'Hari', value: timeLeft.days },
              { label: 'Jam', value: timeLeft.hours },
              { label: 'Menit', value: timeLeft.minutes },
              { label: 'Detik', value: timeLeft.seconds },
            ].map((box, i) => (
              <div key={i} className={`p-3 rounded-2xl border text-center ${accentColor}`}>
                <strong className="block text-2xl font-serif">{box.value}</strong>
                <span className="text-[10px] uppercase tracking-wider opacity-75">{box.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* AYAT SUCI / KUTIPAN */}
        {invitation.quote_body && (
          <section className="text-center max-w-xl mx-auto p-8 rounded-3xl border border-current/15 bg-white/40 backdrop-blur space-y-3">
            <h3 className="font-serif text-sm font-bold tracking-wider uppercase opacity-80">
              {invitation.quote_title}
            </h3>
            <p className="text-xs sm:text-sm font-serif italic leading-relaxed opacity-85">
              &ldquo;{invitation.quote_body}&rdquo;
            </p>
          </section>
        )}

        {/* PROFIL KEDUA MEMPELAI */}
        <section className="space-y-8 text-center">
          <div className="space-y-1">
            <h3 className="font-serif text-3xl font-bold">Pasangan Mempelai</h3>
            <p className="text-xs opacity-75">Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Pengantin Pria */}
            <div className={`p-6 rounded-3xl border ${accentColor} space-y-2`}>
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-200/50 flex items-center justify-center font-serif text-xl font-bold text-slate-700">
                {invitation.groom_nickname[0] || 'G'}
              </div>
              <h4 className="font-serif text-xl font-bold pt-2">{invitation.groom_full_name}</h4>
              <p className="text-xs opacity-75 font-serif">{invitation.groom_parents}</p>
            </div>

            {/* Pengantin Wanita */}
            <div className={`p-6 rounded-3xl border ${accentColor} space-y-2`}>
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-200/50 flex items-center justify-center font-serif text-xl font-bold text-slate-700">
                {invitation.bride_nickname[0] || 'B'}
              </div>
              <h4 className="font-serif text-xl font-bold pt-2">{invitation.bride_full_name}</h4>
              <p className="text-xs opacity-75 font-serif">{invitation.bride_parents}</p>
            </div>
          </div>
        </section>

        {/* DETAIL ACARA: AKAD & RESEPSI */}
        <section className="space-y-8 text-center">
          <div className="space-y-1">
            <h3 className="font-serif text-3xl font-bold">Waktu & Tempat Acara</h3>
            <p className="text-xs opacity-75">Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Anda menghadiri:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Kartu Akad */}
            <div className={`p-6 rounded-3xl border ${accentColor} text-left space-y-4`}>
              <div className="flex items-center justify-between border-b pb-3 border-current/15">
                <strong className="font-serif text-lg">Akad Nikah</strong>
                <Heart size={16} className="text-rose-500" />
              </div>
              <div className="space-y-2 text-xs opacity-90">
                <div className="flex items-center gap-2">
                  <Calendar size={15} />
                  <span>{invitation.akad_date ? new Date(invitation.akad_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={15} />
                  <span>{invitation.akad_time}</span>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <MapPin size={15} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-semibold">{invitation.akad_venue}</strong>
                    <span className="opacity-80 block text-[11px] leading-relaxed">{invitation.akad_address}</span>
                  </div>
                </div>
              </div>

              {invitation.akad_maps_url && (
                <a
                  href={invitation.akad_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold ${buttonAccent} transition shadow-sm`}
                >
                  <MapPin size={13} />
                  Google Maps
                  <ExternalLink size={11} />
                </a>
              )}
            </div>

            {/* Kartu Resepsi */}
            <div className={`p-6 rounded-3xl border ${accentColor} text-left space-y-4`}>
              <div className="flex items-center justify-between border-b pb-3 border-current/15">
                <strong className="font-serif text-lg">Resepsi Pernikahan</strong>
                <Sparkles size={16} className="text-amber-500" />
              </div>
              <div className="space-y-2 text-xs opacity-90">
                <div className="flex items-center gap-2">
                  <Calendar size={15} />
                  <span>{invitation.resepsi_date ? new Date(invitation.resepsi_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={15} />
                  <span>{invitation.resepsi_time}</span>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <MapPin size={15} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-semibold">{invitation.resepsi_venue}</strong>
                    <span className="opacity-80 block text-[11px] leading-relaxed">{invitation.resepsi_address}</span>
                  </div>
                </div>
              </div>

              {invitation.resepsi_maps_url && (
                <a
                  href={invitation.resepsi_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold ${buttonAccent} transition shadow-sm`}
                >
                  <MapPin size={13} />
                  Google Maps
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        </section>

        {/* AMPLOP DIGITAL & KADO */}
        {invitation.gift_account_number && (
          <section className="text-center max-w-lg mx-auto space-y-4">
            <div className="space-y-1">
              <Gift size={24} className="mx-auto text-rose-500" />
              <h3 className="font-serif text-2xl font-bold">Tanda Kasih & Kado Pernikahan</h3>
              <p className="text-xs opacity-75 max-w-sm mx-auto">
                Doa restu Anda merupakan karunia terindah bagi kami. Bagi Anda yang bermaksud memberikan tanda kasih:
              </p>
            </div>

            <div className={`p-6 rounded-3xl border ${accentColor} space-y-3`}>
              <span className="text-xs uppercase font-serif tracking-widest block opacity-75">{invitation.gift_bank_name}</span>
              <div className="font-mono text-2xl font-bold tracking-wider py-1">
                {invitation.gift_account_number}
              </div>
              <p className="text-xs font-medium">a.n. {invitation.gift_account_holder}</p>

              <button
                onClick={() => handleCopy(invitation.gift_account_number || '')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-current/20 hover:bg-slate-50 transition shadow-sm"
              >
                {copiedBank ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copiedBank ? 'Nomor Tersalin!' : 'Salin Nomor Rekening'}
              </button>

              {invitation.gift_address && (
                <div className="pt-4 border-t border-current/15 text-left text-xs space-y-1">
                  <strong className="block text-[11px] uppercase tracking-wider opacity-75">Kirim Kado Fisik:</strong>
                  <p className="opacity-80">{invitation.gift_address}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* FORM RSVP & WISHES WALL */}
        <section className="space-y-8 max-w-xl mx-auto">
          <div className="text-center space-y-1">
            <MessageSquareHeart size={24} className="mx-auto text-rose-500" />
            <h3 className="font-serif text-3xl font-bold">Konfirmasi Kehadiran & Doa Restu</h3>
            <p className="text-xs opacity-75">Mohon konfirmasi kehadiran serta berikan doa restu untuk kami</p>
          </div>

          {/* Form RSVP */}
          <form onSubmit={handleSubmitWish} className={`p-6 rounded-3xl border ${accentColor} space-y-4`}>
            <div>
              <label className="text-xs font-semibold block mb-1">Nama Anda:</label>
              <input
                required
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder="Nama Lengkap / Keluarga"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Konfirmasi Kehadiran:</label>
                <select
                  aria-label="Konfirmasi Kehadiran"
                  value={attendance}
                  onChange={e => setAttendance(e.target.value as 'attending' | 'not_attending' | 'tentative')}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                >
                  <option value="attending">Hadir</option>
                  <option value="not_attending">Tidak Dapat Hadir</option>
                  <option value="tentative">Masih Ragu</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1">Jumlah Tamu (Pax):</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={pax}
                  onChange={e => setPax(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Ucapan & Doa Restu:</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tuliskan ucapan dan doa terbaik untuk kedua mempelai…"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingWish}
              className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${buttonAccent} transition shadow-md`}
            >
              <Send size={14} />
              {submittingWish ? 'Mengirimkan…' : 'Kirim Konfirmasi & Doa'}
            </button>

            {wishSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs rounded-xl text-center">
                Terima kasih! Ucapan dan doa restu Anda telah tersampaikan.
              </div>
            )}
          </form>

          {/* Wishes List */}
          <div className="space-y-3 pt-2">
            <h4 className="font-serif text-sm font-bold opacity-80 uppercase tracking-wider border-b pb-2">
              Doa Restu dari Sahabat & Kerabat ({wishes.length})
            </h4>

            {wishes.length === 0 ? (
              <p className="text-center py-6 text-xs opacity-60 font-serif italic">
                Jadilah yang pertama mengirimkan ucapan doa restu untuk kedua mempelai.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {wishes.map(w => (
                  <div key={w.id} className="p-4 rounded-2xl bg-white/70 border border-current/10 shadow-sm space-y-1 text-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-xs font-bold font-serif">{w.guest_name}</strong>
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
                    <p className="text-xs opacity-85 leading-relaxed">{w.message}</p>
                    <span className="text-[10px] opacity-50 block pt-1">
                      {new Date(w.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-center pt-16 pb-8 border-t border-current/15 space-y-3 opacity-75">
          <p className="font-serif text-sm italic max-w-md mx-auto leading-relaxed">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.
          </p>
          <p className="font-serif font-bold text-lg">
            Kami yang berbahagia,<br />
            {invitation.groom_nickname} & {invitation.bride_nickname}
          </p>
          <div className="pt-8">
            <Link href="/" className="text-[11px] opacity-60 hover:opacity-100 transition">
              Dibuat dengan cinta via Pocket Wedding
            </Link>
          </div>
        </footer>

      </main>
    </div>
  );
}
