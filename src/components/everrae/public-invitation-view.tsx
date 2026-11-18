/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Heart, 
  Sparkles, 
  Music, 
  VolumeX 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { WeddingInvitation, InvitationWish, InvitationTheme } from '@/types';
import { getInvitationThemeConfig } from './invitation-theme-config';

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
  const [pax] = useState(1);
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
      const themeFromQuery = (searchParams?.get('theme') as InvitationTheme) || null;

      const { data: inv, error: invError } = await supabase
        .from('wedding_invitations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (invError || !inv || (!inv.is_published && !isPreview)) {
        if (slug === 'preview' || isPreview || slug === 'rohim-wiwit') {
          const fallbackTheme = themeFromQuery || 'bali-dewata';
          setInvitation({
            id: 'preview-id',
            workspace_id: 'preview-ws',
            slug: slug || 'rohim-wiwit',
            is_published: true,
            theme: fallbackTheme,
            quote_title: 'Surat Ar-Rum : 21',
            quote_body: 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
            groom_full_name: 'Ahmad Nur Rohim',
            groom_nickname: 'Rohim',
            groom_parents: 'Putra tercinta dari Bpk. H. Ahmad & Ibu Hj. Siti',
            bride_full_name: 'Wiwit Nur Hidayah',
            bride_nickname: 'Wiwit',
            bride_parents: 'Putri tercinta dari Bpk. Drs. H. Subagyo & Ibu Hj. Aminah',
            akad_date: '2027-06-17',
            akad_time: '08.00 - 10.00 WIB',
            akad_venue: "Masjid Raya Grand Mosque",
            akad_address: 'Jl. Malioboro No. 1, D.I. Yogyakarta',
            akad_maps_url: 'https://maps.google.com/?q=Yogyakarta',
            resepsi_date: '2027-06-17',
            resepsi_time: '11.00 - 14.00 WIB',
            resepsi_venue: 'The Grand Ballroom Palace',
            resepsi_address: 'Jl. Solo KM 9, Sleman, D.I. Yogyakarta',
            resepsi_maps_url: 'https://maps.google.com/?q=Yogyakarta',
            gift_bank_name: 'Bank Central Asia (BCA)',
            gift_account_number: '8910 4218 9210',
            gift_account_holder: 'ROHIM SETIARAMA',
            music_url: '/audio/wedding-acoustic.mp3',
            cover_photo_url: '/images/wedding-flowers.jpg',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setWishes([
            {
              id: '1',
              invitation_id: 'preview-id',
              guest_name: 'Budi Santoso',
              attendance: 'attending',
              pax: 2,
              message: 'Selamat berbahagia Rohim & Wiwit! Semoga langgeng dan sakinah mawaddah warahmah selalu.',
              created_at: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
              id: '2',
              invitation_id: 'preview-id',
              guest_name: 'Siti Aminah & Keluarga',
              attendance: 'attending',
              pax: 2,
              message: 'Barakallahu lakuma, semoga perjalanan rumah tangga senantiasa dalam ridho Allah SWT.',
              created_at: new Date(Date.now() - 3600000 * 5).toISOString()
            }
          ]);
        } else {
          setNotFound(true);
        }
      } else {
        // When theme query override is provided during preview, prioritize it
        if (themeFromQuery) {
          inv.theme = themeFromQuery;
        }
        setInvitation(inv as WeddingInvitation);

        // Fetch wishes
        const { data: wList } = await supabase
          .from('invitation_wishes')
          .select('*')
          .eq('invitation_id', inv.id)
          .order('created_at', { ascending: false });
        if (wList) setWishes(wList as InvitationWish[]);
      }
      setLoading(false);
    };

    load();
  }, [slug, searchParams]);

  // Dynamic countdown timer
  useEffect(() => {
    if (!invitation) return;
    const targetDateStr = (invitation.resepsi_date === '2027-03-24' || !invitation.resepsi_date) 
      ? '2027-06-17' 
      : invitation.resepsi_date;
    const targetTime = new Date(`${targetDateStr}T09:00:00`).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetTime - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [invitation]);

  // Handle invitation open
  const handleOpenInvitation = () => {
    setIsOpened(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(() => {
        // Browser autoplay restriction
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
      } else if (slug === 'rohim-wiwit' || slug === 'preview') {
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
      <div className="min-h-screen bg-[#080C0B] flex flex-col items-center justify-center p-4 text-center">
        <div className="relative">
          <Heart size={40} className="text-[#DFBA73] animate-pulse" />
          <Sparkles size={20} className="text-[#FFE4A0] absolute -top-2 -right-2 animate-bounce" />
        </div>
        <p className="font-serif text-[#DFBA73] text-sm tracking-widest mt-4 uppercase font-bold">Membuka Undangan Digital…</p>
        <p className="text-xs text-slate-400 mt-1">Mohon tunggu sebentar</p>
      </div>
    );
  }

  if (notFound || !invitation) {
    return (
      <div className="min-h-screen bg-[#080C0B] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto text-white">
        <Heart size={44} className="text-slate-600 mb-3" />
        <h1 className="font-serif text-2xl font-bold text-[#DFBA73] mb-2">Undangan Belum Tersedia</h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Tautan undangan ini tidak ditemukan atau belum dipublikasikan oleh kedua mempelai.
        </p>
        <Link 
          href="/"
          className="px-5 py-2.5 rounded-full bg-[#DFBA73] text-[#121A15] text-xs font-bold hover:brightness-110 transition tracking-wider uppercase"
        >
          Kunjungi Pocket Wedding
        </Link>
      </div>
    );
  }

  // Active theme configuration
  const currentTheme = (searchParams?.get('theme') as string) || invitation.theme || 'bali-dewata';
  const themeConfig = getInvitationThemeConfig(currentTheme);

  const rawDate = invitation.resepsi_date || invitation.akad_date;
  const isOldMockDate = rawDate === '2027-03-24' || !rawDate;
  const displayDateStr = isOldMockDate ? '2027-06-17' : rawDate;
  const dateFormatted = new Date(displayDateStr).toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className={`invitation-root-viewport ${themeConfig.bodyClass}`}>
      {/* Background Audio Track */}
      <audio ref={audioRef} loop src={invitation.music_url || '/audio/wedding-acoustic.mp3'} preload="auto" />

      {/* Floating Music Toggle Button */}
      {isOpened && (
        <button
          type="button"
          onClick={toggleMusic}
          aria-label={isPlayingMusic ? 'Hentikan musik' : 'Putar musik'}
          className="btn-floating-music"
          title={isPlayingMusic ? 'Hentikan Musik' : 'Putar Musik'}
        >
          {isPlayingMusic ? (
            <Music size={18} className="animate-spin" style={{ animationDuration: '4s' }} />
          ) : (
            <VolumeX size={18} />
          )}
        </button>
      )}

      {/* Reset Door Button (Active when opened) */}
      <button
        type="button"
        className="btn-reset-doors"
        onClick={() => {
          setIsOpened(false);
          const body = document.getElementById('invitationBody');
          if (body) body.scrollTop = 0;
        }}
        title="Tutup pintu 3D untuk melihat animasi pembuka lagi"
      >
        🔄 Tutup Pintu &amp; Coba Lagi
      </button>

      {/* Main Viewport Stage */}
      <div className="viewport-stage">
        {/* Smartphone Phone Container */}
        <div id="phoneContainer" className={`phone-container ${isOpened ? 'is-opened' : ''}`}>
          
          {/* Theme Dynamic Cultural Background Pattern Overlay */}
          <div className="bg-pattern-layer" aria-hidden="true" />

          {/* ====================================================
              STAGE 1: 3D DOORS WITH RADICAL CULTURAL ORNAMENTS
              ==================================================== */}
          <div className="doors-wrapper">
            {/* Left Door Leaf */}
            <div className="door-leaf door-left">
              <div className="door-ornament-frame">
                {themeConfig.doorSvg}
                <span style={{ fontSize: '10px', letterSpacing: '3px', fontFamily: 'var(--font-royal)', color: '#DFBA73', fontWeight: 800, textTransform: 'uppercase' }}>
                  {themeConfig.doorLabelLeft}
                </span>
              </div>
              <div className="door-knocker">
                <div className="knocker-ring" />
              </div>
            </div>

            {/* Right Door Leaf */}
            <div className="door-leaf door-right">
              <div className="door-ornament-frame">
                <div style={{ width: '100%', transform: 'scaleX(-1)' }}>
                  {themeConfig.doorSvg}
                </div>
                <span style={{ fontSize: '10px', letterSpacing: '3px', fontFamily: 'var(--font-royal)', color: '#DFBA73', fontWeight: 800, textTransform: 'uppercase' }}>
                  {themeConfig.doorLabelRight}
                </span>
              </div>
              <div className="door-knocker">
                <div className="knocker-ring" />
              </div>
            </div>

            {/* Cover Center Badge (Wax Seal & Guest Plaque) */}
            <div className="cover-center-badge">
              <div className="wax-seal-circle">
                <span className="initials">
                  {(invitation.groom_nickname?.[0] || 'R')}&amp;{(invitation.bride_nickname?.[0] || 'W')}
                </span>
                <span className="subtitle">{themeConfig.sealSubtitle}</span>
              </div>

              <div className="cover-guest-plaque">
                <p className="eyebrow">{themeConfig.plaqueThemeTag}</p>
                <h1 className="couple-title">
                  {invitation.groom_nickname || 'Rohim'} &amp; {invitation.bride_nickname || 'Wiwit'}
                </h1>
                <div className="guest-info">
                  <span>Kepada Yth. Bapak/Ibu/Saudara/i:</span>
                  <p className="guest-name">{guestName || 'Tamu Undangan Istimewa'}</p>
                </div>
              </div>

              <button type="button" className="btn-open-grand" onClick={handleOpenInvitation}>
                <span>✨</span>
                <span>Buka Undangan</span>
                <span>✨</span>
              </button>
            </div>
          </div>

          {/* ====================================================
              STAGE 2: SCROLLING INVITATION (RICH & DISTINCT ORNAMENTS)
              ==================================================== */}
          <div className="invitation-scroll-body" id="invitationBody">
            
            {/* SECTION 1: HERO ARCH SECTION */}
            <section className="hero-arch-section" id="secCover">
              {/* Dynamic Corner Floral / Ornament Watermark */}
              <div id="cornerOrnaments" aria-hidden="true">
                {themeConfig.cornerTopLeft}
                {themeConfig.cornerTopRight}
              </div>

              {/* Dynamic Cultural Top Emblem */}
              <div style={{ width: '80px', height: '60px', margin: '0 auto 12px' }}>
                {themeConfig.heroEmblem}
              </div>

              <p style={{ fontFamily: 'var(--font-royal)', fontSize: '11px', letterSpacing: '3px', color: '#DFBA73', fontWeight: 800, textTransform: 'uppercase', margin: '6px 0 2px' }}>
                {themeConfig.celebrationTag}
              </p>

              <h1 className="hero-script-names">
                {invitation.groom_nickname || 'Rohim'} &amp; {invitation.bride_nickname || 'Wiwit'}
              </h1>
              <p className="hero-wedding-date">
                {dateFormatted.toUpperCase()}
              </p>

              {/* Theme Distinct Arch Photo Wrapper */}
              <div className="arch-photo-wrapper">
                <div className="arch-photo-inner">
                  <img 
                    src={invitation.cover_photo_url || '/images/wedding-flowers.jpg'} 
                    alt="Foto Pengantin" 
                  />
                  <div className="arch-watermark-overlay">
                    {themeConfig.archTag}
                  </div>
                </div>
              </div>

              {/* Countdown Timer Live 4 Pillars */}
              <div className="countdown-container">
                <div className="countdown-card">
                  <div className="countdown-num">{timeLeft.days}</div>
                  <div className="countdown-label">Hari</div>
                </div>
                <div className="countdown-card">
                  <div className="countdown-num">{timeLeft.hours}</div>
                  <div className="countdown-label">Jam</div>
                </div>
                <div className="countdown-card">
                  <div className="countdown-num">{timeLeft.minutes}</div>
                  <div className="countdown-label">Menit</div>
                </div>
                <div className="countdown-card">
                  <div className="countdown-num">{timeLeft.seconds}</div>
                  <div className="countdown-label">Detik</div>
                </div>
              </div>

              {/* Google Calendar Link */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
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
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(223, 186, 115, 0.16)',
                    border: '1px solid rgba(223, 186, 115, 0.4)',
                    color: '#DFBA73',
                    padding: '7px 18px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <span>📅 Simpan ke Google Calendar</span>
                </a>
              </div>
            </section>

            {/* SECTION 2: QURANIC BLESSING CARD */}
            <section className="blessing-section">
              <div className="blessing-card">
                <p className="blessing-title">{invitation.quote_title || 'SURAT AR-RUM : 21'}</p>
                <p className="blessing-quote">
                  &ldquo;{invitation.quote_body || 'Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.'}&rdquo;
                </p>
                <p className="blessing-surah">Q.S AR-RUM AYAT 21</p>
              </div>
            </section>

            {/* SECTION 3: BRIDE & GROOM PROFILES */}
            <section className="profiles-section" id="secCouple">
              <div className="section-headline">
                <span className="section-eyebrow">MEMPELAI PENGANTIN</span>
                <h2 className="section-title">Kedua Mempelai</h2>
                <div style={{ color: '#DFBA73', marginTop: '4px' }}>✦ ❖ ✦</div>
              </div>

              {/* Mempelai Pria */}
              <div className="profile-card">
                <div className="profile-avatar-frame">
                  <div className="profile-avatar-inner">
                    <img src="/images/landscape-lake.jpg" alt="Mempelai Pria" />
                  </div>
                </div>
                <h3 className="profile-name">{invitation.groom_full_name || 'Ahmad Nur Rohim'}</h3>
                <p className="profile-parents">
                  {invitation.groom_parents || 'Putra tercinta dari Bpk. H. Ahmad & Ibu Hj. Siti'}
                </p>
                {invitation.groom_instagram && (
                  <a 
                    href={`https://instagram.com/${invitation.groom_instagram.replace(/^@/, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-instagram"
                  >
                    <span>📷 @{invitation.groom_instagram.replace(/^@/, '')}</span>
                  </a>
                )}
              </div>

              {/* Mempelai Wanita */}
              <div className="profile-card">
                <div className="profile-avatar-frame">
                  <div className="profile-avatar-inner">
                    <img src="/images/wedding-flowers.jpg" alt="Mempelai Wanita" />
                  </div>
                </div>
                <h3 className="profile-name">{invitation.bride_full_name || 'Wiwit Nur Hidayah'}</h3>
                <p className="profile-parents">
                  {invitation.bride_parents || 'Putri tercinta dari Bpk. Drs. H. Subagyo & Ibu Hj. Aminah'}
                </p>
                {invitation.bride_instagram && (
                  <a 
                    href={`https://instagram.com/${invitation.bride_instagram.replace(/^@/, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-instagram"
                  >
                    <span>📷 @{invitation.bride_instagram.replace(/^@/, '')}</span>
                  </a>
                )}
              </div>
            </section>

            {/* SECTION 4: EVENT TIMELINE & MAPS */}
            <section className="events-section" id="secEvent">
              <div className="section-headline">
                <span className="section-eyebrow">WAKTU &amp; TEMPAT</span>
                <h2 className="section-title">Rangkaian Acara</h2>
                <div style={{ color: '#DFBA73', marginTop: '4px' }}>✦ ❖ ✦</div>
              </div>

              {/* Event 1: Akad Nikah */}
              <div className="event-card">
                <span className="event-badge">{themeConfig.event1Badge}</span>
                <h3 className="event-date">{dateFormatted}</h3>
                <p className="event-time">⏰ Pukul {invitation.akad_time || '08.00 - 10.00 WIB'}</p>
                <p className="event-venue">
                  📍 {invitation.akad_venue || themeConfig.defaultVenue1}
                  {invitation.akad_address && (
                    <>
                      <br />
                      <span style={{ fontSize: '11px', color: '#A0B5AA' }}>{invitation.akad_address}</span>
                    </>
                  )}
                </p>
                {invitation.akad_maps_url && (
                  <a 
                    href={invitation.akad_maps_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #FFE4A0, #DFBA73)',
                      border: 'none',
                      color: '#121A15',
                      padding: '8px 20px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textDecoration: 'none'
                    }}
                  >
                    🗺️ Buka Panduan Google Maps
                  </a>
                )}
              </div>

              {/* Event 2: Resepsi */}
              <div className="event-card">
                <span className="event-badge">{themeConfig.event2Badge}</span>
                <h3 className="event-date">{dateFormatted}</h3>
                <p className="event-time">⏰ Pukul {invitation.resepsi_time || '11.00 - 14.00 WIB'}</p>
                <p className="event-venue">
                  📍 {invitation.resepsi_venue || themeConfig.defaultVenue2}
                  {invitation.resepsi_address && (
                    <>
                      <br />
                      <span style={{ fontSize: '11px', color: '#A0B5AA' }}>{invitation.resepsi_address}</span>
                    </>
                  )}
                </p>
                {invitation.resepsi_maps_url && (
                  <a 
                    href={invitation.resepsi_maps_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #FFE4A0, #DFBA73)',
                      border: 'none',
                      color: '#121A15',
                      padding: '8px 20px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textDecoration: 'none'
                    }}
                  >
                    🗺️ Buka Panduan Google Maps
                  </a>
                )}
              </div>
            </section>

            {/* SECTION 5: VIP DIGITAL ENVELOPE */}
            <section className="gift-section" id="secGift">
              <div className="section-headline">
                <span className="section-eyebrow">TANDA KASIH</span>
                <h2 className="section-title">Amplop Digital</h2>
                <div style={{ color: '#DFBA73', marginTop: '4px' }}>✦ ❖ ✦</div>
              </div>

              <div className="vip-card-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '2px', color: '#DFBA73', fontWeight: 800 }}>VIP WEDDING GIFT CARD</span>
                  <span style={{ fontSize: '16px' }}>💳</span>
                </div>
                <div className="chip-micro" />
                <p style={{ fontSize: '12px', color: '#CBDCD2' }}>{invitation.gift_bank_name || 'Bank Central Asia (BCA)'}</p>
                <p className="card-number-gold">{invitation.gift_account_number || '8910 •••• •••• 421'}</p>
                <p style={{ fontSize: '12px', color: '#FFF', fontWeight: 600, marginBottom: '14px' }}>
                  a.n {invitation.gift_account_holder || 'ROHIM SETIARAMA'}
                </p>
                <button 
                  type="button" 
                  className="btn-copy-account" 
                  onClick={() => handleCopy(invitation.gift_account_number || '89104218921')}
                >
                  {copiedBank ? '✓ Berhasil Disalin!' : '📋 Salin Nomor Rekening'}
                </button>
              </div>
            </section>

            {/* SECTION 6: GUESTBOOK & RSVP */}
            <section className="wishes-section" id="secWish">
              <div className="section-headline">
                <span className="section-eyebrow">BUKU TAMU</span>
                <h2 className="section-title">Doa &amp; Restu</h2>
                <div style={{ color: '#DFBA73', marginTop: '4px' }}>✦ ❖ ✦</div>
              </div>

              <div className="wishes-box">
                <form onSubmit={handleSubmitWish}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Nama Anda (Bapak/Ibu/Saudara/i)"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    required
                  />
                  <select 
                    className="input-field"
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value as any)}
                  >
                    <option value="attending">Konfirmasi: Ya, Saya Akan Hadir</option>
                    <option value="tentative">Konfirmasi: Masih Ragu-ragu</option>
                    <option value="not_attending">Konfirmasi: Maaf, Belum Bisa Hadir</option>
                  </select>
                  <textarea 
                    className="input-field" 
                    rows={3} 
                    placeholder="Tuliskan untaian doa dan ucapan selamat untuk kedua mempelai..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-submit-wish" disabled={submittingWish}>
                    {submittingWish ? 'MENGIRIM DOA...' : wishSuccess ? '✓ DOA RESTU TERKIRIM' : 'KIRIM DOA RESTU'}
                  </button>
                </form>

                {/* Wishes Feed */}
                {wishes.length > 0 && (
                  <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {wishes.slice(0, 5).map((w) => (
                      <div key={w.id} style={{ background: 'rgba(8, 16, 13, 0.65)', border: '1px solid rgba(223, 186, 115, 0.25)', borderRadius: '12px', padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <strong style={{ fontSize: '12px', color: '#DFBA73' }}>{w.guest_name}</strong>
                          <span style={{ fontSize: '9px', color: '#9BB8A9' }}>
                            {w.attendance === 'attending' ? '✓ Hadir' : w.attendance === 'tentative' ? '? Ragu' : '✗ Izin'}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#E2ECE6', fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>
                          &ldquo;{w.message}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* FLOATING BOTTOM DOCK NAVIGATION */}
          <nav className="bottom-dock" aria-label="Navigasi Undangan">
            <button type="button" className="dock-btn" onClick={() => scrollToSection('secCover')}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              <span>Sampul</span>
            </button>
            <button type="button" className="dock-btn" onClick={() => scrollToSection('secCouple')}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <span>Mempelai</span>
            </button>
            <button type="button" className="dock-btn" onClick={() => scrollToSection('secEvent')}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/></svg>
              <span>Acara</span>
            </button>
            <button type="button" className="dock-btn" onClick={() => scrollToSection('secGift')}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.1-.9-2-2-2z"/></svg>
              <span>Hadiah</span>
            </button>
            <button type="button" className="dock-btn" onClick={() => scrollToSection('secWish')}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
              <span>Ucapan</span>
            </button>
          </nav>

        </div>
      </div>
    </div>
  );
}
