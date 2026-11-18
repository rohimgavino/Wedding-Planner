import React from 'react';
import { InvitationTheme } from '@/types';

export interface ThemeVisualConfig {
  id: InvitationTheme;
  bodyClass: string;
  name: string;
  doorBg: string;
  plaqueThemeTag: string;
  sealSubtitle: string;
  celebrationTag: string;
  archTag: string;
  doorLabelLeft: string;
  doorLabelRight: string;
  event1Badge: string;
  event2Badge: string;
  defaultVenue1: string;
  defaultVenue2: string;
  archClass: string;
  doorSvg: React.ReactNode;
  heroEmblem: React.ReactNode;
  cornerTopLeft: React.ReactNode;
  cornerTopRight: React.ReactNode;
}

export function getInvitationThemeConfig(themeKey: string): ThemeVisualConfig {
  // Normalize theme keys if shorthand is provided
  const normalizedKey: InvitationTheme = (() => {
    switch (themeKey) {
      case 'bugis': return 'bugis-pinisi';
      case 'jawa': return 'jawa-keraton';
      case 'minang': return 'minang-songket';
      case 'bali': return 'bali-dewata';
      case 'sunda': return 'sunda-siger';
      case 'batak': return 'batak-gorga';
      case 'islamic': return 'islamic-arabesque';
      case 'ivory': return 'classic-ivory';
      case 'sage': return 'sage-garden';
      case 'rose': return 'romantic-rose';
      case 'midnight': return 'midnight-gold';
      case 'monochrome': return 'monochrome-editorial';
      default: return (themeKey as InvitationTheme) || 'bugis-pinisi';
    }
  })();

  switch (normalizedKey) {
    // 1. BUGIS MAKASSAR PINISI
    case 'bugis-pinisi':
      return {
        id: 'bugis-pinisi',
        bodyClass: 'theme-bugis',
        name: 'Bugis Makassar Pinisi',
        doorBg: 'linear-gradient(135deg, #4A0E17 0%, #1A0508 100%)',
        plaqueThemeTag: 'TRADITIONAL BUGIS PINISI',
        sealSubtitle: 'WALASOJI',
        celebrationTag: 'MAPPETTUADA & SOMPA',
        archTag: 'ROHIM & WIWIT · PINISI',
        doorLabelLeft: 'SULAWESI',
        doorLabelRight: 'PINISI',
        event1Badge: 'AKAD NIKAH / SOMPA',
        event2Badge: 'RESEPSI / MAMPACCI',
        defaultVenue1: 'Kediaman Mempelai Wanita, Pantai Losari Makassar',
        defaultVenue2: 'Grand Phinisi Ballroom, Makassar, Sulawesi Selatan',
        archClass: 'rounded-t-[120px] rounded-b-[20px] border-[2.5px] border-[#DFBA73]',
        doorSvg: (
          <svg className="door-svg-emblem" viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8">
            <path d="M85,15 C60,40 30,80 30,130 C30,170 50,195 85,210" strokeWidth="2.2" />
            <polygon points="50,55 65,70 50,85 35,70" fill="#DFBA73" fillOpacity="0.4" />
            <polygon points="50,105 65,120 50,135 35,120" fill="#DFBA73" fillOpacity="0.4" />
            <polygon points="50,155 65,170 50,185 35,170" fill="#DFBA73" fillOpacity="0.4" />
            <circle cx="50" cy="120" r="4" fill="#FFE4A0" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#DFBA73" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M15,50 Q50,60 85,50 L75,62 Q50,66 25,62 Z" fill="#DFBA73" fillOpacity="0.4" />
            <path d="M50,10 L50,50" strokeWidth="2.5" />
            <path d="M50,12 L80,38 L50,42 Z" fill="#DFBA73" fillOpacity="0.7" />
            <path d="M50,15 L25,40 L50,44 Z" fill="#DFBA73" fillOpacity="0.5" />
            <path d="M5,55 Q25,50 45,55 T85,55 T100,55" strokeDasharray="2,2" />
          </svg>
        ),
        cornerTopLeft: (
          <svg className="floral-corner floral-tl" viewBox="0 0 100 100" fill="none">
            <path d="M5,5 Q40,10 70,35 Q90,55 95,95 Q55,90 35,70 Q10,40 5,5 Z" fill="#DFBA73" fillOpacity="0.25" />
            <circle cx="35" cy="35" r="20" fill="#871A2E" fillOpacity="0.85" />
            <circle cx="35" cy="35" r="10" fill="#FFE4A0" />
            <path d="M5,5 Q35,35 65,15" stroke="#DFBA73" strokeWidth="2.5" />
            <path d="M5,5 Q35,35 15,65" stroke="#DFBA73" strokeWidth="2.5" />
          </svg>
        ),
        cornerTopRight: (
          <svg className="floral-corner floral-tr" viewBox="0 0 100 100" fill="none">
            <path d="M5,5 Q40,10 70,35 Q90,55 95,95 Q55,90 35,70 Q10,40 5,5 Z" fill="#DFBA73" fillOpacity="0.25" />
            <circle cx="35" cy="35" r="20" fill="#871A2E" fillOpacity="0.85" />
            <circle cx="35" cy="35" r="10" fill="#FFE4A0" />
            <path d="M5,5 Q35,35 65,15" stroke="#DFBA73" strokeWidth="2.5" />
            <path d="M5,5 Q35,35 15,65" stroke="#DFBA73" strokeWidth="2.5" />
          </svg>
        ),
      };

    // 2. ROYAL KERATON JAWA
    case 'jawa-keraton':
      return {
        id: 'jawa-keraton',
        bodyClass: 'theme-jawa',
        name: 'Royal Keraton Jawa',
        doorBg: 'linear-gradient(135deg, #1C3325 0%, #0B1710 100%)',
        plaqueThemeTag: 'ROYAL KERATON JAWA',
        sealSubtitle: 'GUNUNGAN',
        celebrationTag: 'PAWIWAHAN & PANGGIH',
        archTag: 'ROHIM & WIWIT · KERATON',
        doorLabelLeft: 'KERATON',
        doorLabelRight: 'JAWADWIPA',
        event1Badge: 'AKAD NIKAH KUDUS',
        event2Badge: 'RESEPSI & PANGGIH',
        defaultVenue1: 'Dalem Ageng Sasana Krida, Kawasan Keraton Ngayogyakarta',
        defaultVenue2: 'Pendopo Agung Ambarrukmo, D.I. Yogyakarta',
        archClass: 'rounded-[30px] border-[3px] border-[#DFBA73]',
        doorSvg: (
          <svg className="door-svg-emblem" viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8">
            <path d="M85,15 C45,45 25,85 25,130 C25,175 45,200 85,215" strokeWidth="2.2" />
            <path d="M85,35 Q35,75 35,130 Q35,185 85,195" strokeDasharray="2,2" />
            <path d="M45,70 Q60,50 75,70 Q60,90 45,70 Z" fill="#DFBA73" fillOpacity="0.4" />
            <path d="M45,120 Q60,100 75,120 Q60,140 45,120 Z" fill="#DFBA73" fillOpacity="0.4" />
            <path d="M45,170 Q60,150 75,170 Q60,190 45,170 Z" fill="#DFBA73" fillOpacity="0.4" />
            <circle cx="60" cy="120" r="5" fill="#FFE4A0" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#DFBA73" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M50,5 C50,5 20,30 20,55 C20,65 35,68 50,68 C65,68 80,65 80,55 C80,30 50,5 50,5 Z" fill="#DFBA73" fillOpacity="0.35" />
            <line x1="50" y1="5" x2="50" y2="68" strokeDasharray="2,2" />
            <circle cx="50" cy="36" r="8" fill="#DFBA73" fillOpacity="0.6" />
            <path d="M35,48 Q50,40 65,48" />
          </svg>
        ),
        cornerTopLeft: (
          <svg className="floral-corner floral-tl" viewBox="0 0 100 100" fill="none">
            <path d="M10,0 L10,60" stroke="#DFBA73" strokeWidth="2" strokeDasharray="3,3" />
            <path d="M25,0 L25,45" stroke="#DFBA73" strokeWidth="2" strokeDasharray="3,3" />
            <circle cx="10" cy="15" r="4" fill="#FFF" />
            <circle cx="10" cy="30" r="4" fill="#FFF" />
            <circle cx="10" cy="45" r="4" fill="#FFF" />
            <circle cx="10" cy="60" r="6" fill="#FFE4A0" />
            <circle cx="25" cy="15" r="4" fill="#FFF" />
            <circle cx="25" cy="30" r="4" fill="#FFF" />
            <circle cx="25" cy="45" r="6" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopRight: (
          <svg className="floral-corner floral-tr" viewBox="0 0 100 100" fill="none">
            <path d="M10,0 L10,60" stroke="#DFBA73" strokeWidth="2" strokeDasharray="3,3" />
            <path d="M25,0 L25,45" stroke="#DFBA73" strokeWidth="2" strokeDasharray="3,3" />
            <circle cx="10" cy="15" r="4" fill="#FFF" />
            <circle cx="10" cy="30" r="4" fill="#FFF" />
            <circle cx="10" cy="45" r="4" fill="#FFF" />
            <circle cx="10" cy="60" r="6" fill="#FFE4A0" />
            <circle cx="25" cy="15" r="4" fill="#FFF" />
            <circle cx="25" cy="30" r="4" fill="#FFF" />
            <circle cx="25" cy="45" r="6" fill="#FFE4A0" />
          </svg>
        ),
      };

    // 3. MINANG KEMILAU SONGKET
    case 'minang-songket':
      return {
        id: 'minang-songket',
        bodyClass: 'theme-minang',
        name: 'Minang Kemilau Songket',
        doorBg: 'linear-gradient(135deg, #7A1719 0%, #2A0506 100%)',
        plaqueThemeTag: 'MINANG KEMILAU SONGKET',
        sealSubtitle: 'GONJONG',
        celebrationTag: 'BARALEK GADANG',
        archTag: 'ROHIM & WIWIT · MINANG',
        doorLabelLeft: 'RANAH',
        doorLabelRight: 'MINANG',
        event1Badge: 'AKAD NIKAH',
        event2Badge: 'BARALEK GADANG',
        defaultVenue1: 'Masjid Raya Sumatera Barat, Kota Padang',
        defaultVenue2: 'Istano Basa Pagaruyung Hall, Batusangkar, Tanah Datar',
        archClass: 'rounded-tl-[120px] rounded-br-[120px] rounded-tr-[20px] rounded-bl-[20px] border-[2.5px] border-[#DFBA73]',
        doorSvg: (
          <svg className="door-svg-emblem" viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8">
            <path d="M85,15 C40,30 20,80 20,130 C20,180 40,205 85,215" strokeWidth="2.2" />
            <polygon points="50,40 70,80 30,80" fill="#DFBA73" fillOpacity="0.45" />
            <polygon points="50,95 70,135 30,135" fill="#DFBA73" fillOpacity="0.45" />
            <polygon points="50,150 70,190 30,190" fill="#DFBA73" fillOpacity="0.45" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#DFBA73" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M10,48 C20,30 30,12 35,8 C40,18 45,35 50,40 C55,35 60,18 65,8 C70,12 80,30 90,48 Z" fill="#DFBA73" fillOpacity="0.45" />
            <path d="M10,48 L90,48 L80,58 L20,58 Z" fill="#DFBA73" fillOpacity="0.7" />
            <line x1="35" y1="8" x2="35" y2="48" strokeDasharray="2,2" />
            <line x1="65" y1="8" x2="65" y2="48" strokeDasharray="2,2" />
          </svg>
        ),
        cornerTopLeft: (
          <svg className="floral-corner floral-tl" viewBox="0 0 100 100" fill="none">
            <path d="M0,0 L90,0 L70,20 L0,20 Z" fill="#DFBA73" fillOpacity="0.5" />
            <path d="M0,0 L0,90 L20,70 L20,0 Z" fill="#DFBA73" fillOpacity="0.5" />
            <circle cx="35" cy="35" r="14" fill="#DFBA73" fillOpacity="0.6" />
            <polygon points="35,15 45,35 35,55 25,35" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopRight: (
          <svg className="floral-corner floral-tr" viewBox="0 0 100 100" fill="none">
            <path d="M0,0 L90,0 L70,20 L0,20 Z" fill="#DFBA73" fillOpacity="0.5" />
            <path d="M0,0 L0,90 L20,70 L20,0 Z" fill="#DFBA73" fillOpacity="0.5" />
            <circle cx="35" cy="35" r="14" fill="#DFBA73" fillOpacity="0.6" />
            <polygon points="35,15 45,35 35,55 25,35" fill="#FFE4A0" />
          </svg>
        ),
      };

    // 4. DEWATA SANCTUARY BALI
    case 'bali-dewata':
      return {
        id: 'bali-dewata',
        bodyClass: 'theme-bali',
        name: 'Dewata Sanctuary Bali',
        doorBg: 'linear-gradient(135deg, #182822 0%, #0A120F 100%)',
        plaqueThemeTag: 'DEWATA SANCTUARY BALI',
        sealSubtitle: 'CANDI BENTAR',
        celebrationTag: 'PAWIWAHAN SUCI DEWATA',
        archTag: 'ROHIM & WIWIT · BALI',
        doorLabelLeft: 'CANDI',
        doorLabelRight: 'BENTAR',
        event1Badge: 'PAWIWAHAN SUCI',
        event2Badge: 'RESEPSI SEMARA RATIH',
        defaultVenue1: 'Pura Luhur Uluwatu Amphitheater, Badung, Bali',
        defaultVenue2: 'The Royal Pita Maha Resort, Ubud, Gianyar, Bali',
        archClass: 'rounded-t-[60px] rounded-b-[14px] border-[2.5px] border-[#DFBA73]',
        doorSvg: (
          <svg className="door-svg-emblem" viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8">
            <path d="M85,10 L30,45 L30,70 L50,70 L30,95 L30,120 L50,120 L25,150 L25,215" strokeWidth="2.2" />
            <polygon points="50,45 75,65 50,85 30,65" fill="#DFBA73" fillOpacity="0.45" />
            <polygon points="50,100 75,120 50,140 30,120" fill="#DFBA73" fillOpacity="0.45" />
            <circle cx="50" cy="175" r="8" fill="#FFE4A0" />
            <path d="M30,175 Q50,165 70,175" stroke="#DFBA73" strokeWidth="2" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#DFBA73" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M50,4 L42,20 L58,20 Z" fill="#DFBA73" fillOpacity="0.8" />
            <path d="M50,20 L35,36 L65,36 Z" fill="#DFBA73" fillOpacity="0.6" />
            <path d="M50,36 L25,55 L75,55 Z" fill="#DFBA73" fillOpacity="0.45" />
            <path d="M15,62 L85,62 L80,68 L20,68 Z" fill="#DFBA73" fillOpacity="0.7" />
            <circle cx="50" cy="36" r="3" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopLeft: (
          <svg className="floral-corner floral-tl" viewBox="0 0 100 100" fill="none">
            <circle cx="35" cy="35" r="14" fill="#FFE4A0" fillOpacity="0.9" />
            <circle cx="35" cy="35" r="7" fill="#F59E0B" />
            <circle cx="20" cy="55" r="10" fill="#FFF" fillOpacity="0.9" />
            <circle cx="20" cy="55" r="5" fill="#F59E0B" />
            <path d="M5,5 Q45,20 65,65" stroke="#DFBA73" strokeWidth="2" />
          </svg>
        ),
        cornerTopRight: (
          <svg className="floral-corner floral-tr" viewBox="0 0 100 100" fill="none">
            <circle cx="35" cy="35" r="14" fill="#FFE4A0" fillOpacity="0.9" />
            <circle cx="35" cy="35" r="7" fill="#F59E0B" />
            <circle cx="20" cy="55" r="10" fill="#FFF" fillOpacity="0.9" />
            <circle cx="20" cy="55" r="5" fill="#F59E0B" />
            <path d="M5,5 Q45,20 65,65" stroke="#DFBA73" strokeWidth="2" />
          </svg>
        ),
      };

    // 5. SUNDA PARAHYANGAN
    case 'sunda-siger':
      return {
        id: 'sunda-siger',
        bodyClass: 'theme-sunda',
        name: 'Sunda Parahyangan',
        doorBg: 'linear-gradient(135deg, #0D3A2F 0%, #051A14 100%)',
        plaqueThemeTag: 'SUNDA PARAHYANGAN',
        sealSubtitle: 'SIGER PASUNDAN',
        celebrationTag: 'WALIMATUL NIKAH & SAWER',
        archTag: 'ROHIM & WIWIT · PASUNDAN',
        doorLabelLeft: 'PRIANGAN',
        doorLabelRight: 'PARAHYANGAN',
        event1Badge: 'AKAD NIKAH KHIDMAT',
        event2Badge: 'RESEPSI & SAWER PANGANTEN',
        defaultVenue1: 'Masjid Raya Al-Jabbar, Gedebage, Bandung',
        defaultVenue2: 'Bumi Sangkuriang Pavilion, Ciumbuleuit, Bandung',
        archClass: 'rounded-t-[110px] rounded-b-[20px] border-[2.5px] border-[#DFBA73]',
        doorSvg: (
          <svg className="door-svg-emblem" viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8">
            <path d="M85,15 C50,35 25,75 25,130 C25,180 50,205 85,215" strokeWidth="2.2" />
            <line x1="25" y1="60" x2="85" y2="60" strokeDasharray="2,2" />
            <line x1="25" y1="110" x2="85" y2="110" strokeDasharray="2,2" />
            <line x1="25" y1="160" x2="85" y2="160" strokeDasharray="2,2" />
            <path d="M40,85 Q60,70 75,85 Q60,100 40,85 Z" fill="#DFBA73" fillOpacity="0.4" />
            <path d="M40,135 Q60,120 75,135 Q60,150 40,135 Z" fill="#DFBA73" fillOpacity="0.4" />
            <circle cx="60" cy="85" r="4" fill="#FFE4A0" />
            <circle cx="60" cy="135" r="4" fill="#FFE4A0" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#DFBA73" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M15,55 C20,38 30,22 35,16 C40,25 45,35 50,10 C55,35 60,25 65,16 C70,22 80,38 85,55 Z" fill="#DFBA73" fillOpacity="0.45" />
            <path d="M12,56 L88,56 L82,64 L18,64 Z" fill="#DFBA73" fillOpacity="0.75" />
            <circle cx="50" cy="16" r="4" fill="#FFE4A0" />
            <circle cx="35" cy="22" r="3" fill="#FFE4A0" />
            <circle cx="65" cy="22" r="3" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopLeft: (
          <svg className="floral-corner floral-tl" viewBox="0 0 100 100" fill="none">
            <path d="M5,5 Q40,15 60,50" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="20" cy="15" r="4" fill="#FFF" />
            <circle cx="35" cy="22" r="4" fill="#FFF" />
            <circle cx="48" cy="35" r="5" fill="#FFE4A0" />
            <path d="M15,30 Q30,40 20,55 Q10,45 15,30 Z" fill="#10B981" fillOpacity="0.6" />
          </svg>
        ),
        cornerTopRight: (
          <svg className="floral-corner floral-tr" viewBox="0 0 100 100" fill="none">
            <path d="M5,5 Q40,15 60,50" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="20" cy="15" r="4" fill="#FFF" />
            <circle cx="35" cy="22" r="4" fill="#FFF" />
            <circle cx="48" cy="35" r="5" fill="#FFE4A0" />
            <path d="M15,30 Q30,40 20,55 Q10,45 15,30 Z" fill="#10B981" fillOpacity="0.6" />
          </svg>
        ),
      };

    // 6. BATAK ROYAL ULOS
    case 'batak-gorga':
      return {
        id: 'batak-gorga',
        bodyClass: 'theme-batak',
        name: 'Batak Royal Ulos',
        doorBg: 'linear-gradient(135deg, #3B1214 0%, #150506 100%)',
        plaqueThemeTag: 'BATAK ROYAL ULOS',
        sealSubtitle: 'GORGA TOBA',
        celebrationTag: 'PAMASU-MASUON & ULAON UNJUK',
        archTag: 'ROHIM & WIWIT · TOBA',
        doorLabelLeft: 'DALIHAN',
        doorLabelRight: 'NA TOLU',
        event1Badge: 'PAMASU-MASUON (PEMBERKATAN)',
        event2Badge: 'ULAON UNJUK (PESTA ADAT)',
        defaultVenue1: 'Gereja HKBP Balige, Toba Samosir, Sumatera Utara',
        defaultVenue2: 'Tiara Convention Center, Kota Medan, Sumatera Utara',
        archClass: 'rounded-t-[36px] rounded-b-[10px] border-[3px] border-[#D4A76A]',
        doorSvg: (
          <svg className="door-svg-emblem" viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8">
            <path d="M85,15 C45,35 25,80 25,130 C25,180 45,205 85,215" strokeWidth="2.2" />
            <path d="M50,50 Q70,50 70,70 Q70,90 50,90 Q35,90 35,70 Q35,58 45,58" stroke="#DC2626" strokeWidth="2.5" />
            <path d="M50,120 Q70,120 70,140 Q70,160 50,160 Q35,160 35,140 Q35,128 45,128" stroke="#DFBA73" strokeWidth="2.5" />
            <circle cx="50" cy="70" r="4" fill="#FFF" />
            <circle cx="50" cy="140" r="4" fill="#DC2626" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#DFBA73" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M10,22 Q35,48 50,14 Q65,48 90,22" strokeWidth="2.5" />
            <path d="M25,48 L75,48 L65,60 L35,60 Z" fill="#DC2626" fillOpacity="0.55" />
            <circle cx="50" cy="35" r="7" fill="#DFBA73" fillOpacity="0.7" />
          </svg>
        ),
        cornerTopLeft: (
          <svg className="floral-corner floral-tl" viewBox="0 0 100 100" fill="none">
            <rect x="0" y="0" width="80" height="15" fill="#DC2626" fillOpacity="0.6" />
            <rect x="0" y="0" width="15" height="80" fill="#DC2626" fillOpacity="0.6" />
            <polygon points="25,25 40,40 25,55 10,40" fill="#DFBA73" />
            <circle cx="25" cy="40" r="4" fill="#FFF" />
          </svg>
        ),
        cornerTopRight: (
          <svg className="floral-corner floral-tr" viewBox="0 0 100 100" fill="none">
            <rect x="0" y="0" width="80" height="15" fill="#DC2626" fillOpacity="0.6" />
            <rect x="0" y="0" width="15" height="80" fill="#DC2626" fillOpacity="0.6" />
            <polygon points="25,25 40,40 25,55 10,40" fill="#DFBA73" />
            <circle cx="25" cy="40" r="4" fill="#FFF" />
          </svg>
        ),
      };

    // 7. MADINAH ARABESQUE GOLD
    case 'islamic-arabesque':
      return {
        id: 'islamic-arabesque',
        bodyClass: 'theme-islamic',
        name: 'Madinah Arabesque Gold',
        doorBg: 'linear-gradient(135deg, #162B22 0%, #0A1410 100%)',
        plaqueThemeTag: 'MADINAH ARABESQUE GOLD',
        sealSubtitle: 'RUB EL HIZB',
        celebrationTag: "WALIMATUL 'URSY",
        archTag: 'ROHIM & WIWIT · ARABESQUE',
        doorLabelLeft: 'MADINAH',
        doorLabelRight: 'AL-MUNAWARAH',
        event1Badge: 'AKAD IJAB QABUL',
        event2Badge: "WALIMATUL 'URSY",
        defaultVenue1: 'Masjid Nasional Al-Akbar, Surabaya, Jawa Timur',
        defaultVenue2: 'Grand City Convex Hall, Surabaya, Jawa Timur',
        archClass: 'rounded-t-[125px] rounded-b-[14px] border-[2.5px] border-[#DFBA73]',
        doorSvg: (
          <svg className="door-svg-emblem" viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8">
            <path d="M85,15 C40,25 20,70 20,120 C20,170 40,205 85,215" strokeWidth="2.2" />
            <rect x="36" y="55" width="28" height="28" fill="#DFBA73" fillOpacity="0.35" />
            <rect x="36" y="55" width="28" height="28" transform="rotate(45 50 69)" fill="#DFBA73" fillOpacity="0.35" />
            <rect x="36" y="125" width="28" height="28" fill="#DFBA73" fillOpacity="0.35" />
            <rect x="36" y="125" width="28" height="28" transform="rotate(45 50 139)" fill="#DFBA73" fillOpacity="0.35" />
            <circle cx="50" cy="69" r="4" fill="#FFE4A0" />
            <circle cx="50" cy="139" r="4" fill="#FFE4A0" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#DFBA73" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M50,8 C46,18 30,26 30,48 L70,48 C70,26 54,18 50,8 Z" fill="#DFBA73" fillOpacity="0.45" />
            <path d="M22,48 L78,48 L74,58 L26,58 Z" fill="#DFBA73" fillOpacity="0.75" />
            <circle cx="50" cy="8" r="3" fill="#FFE4A0" />
            <rect x="44" y="28" width="12" height="12" transform="rotate(45 50 34)" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopLeft: (
          <svg className="floral-corner floral-tl" viewBox="0 0 100 100" fill="none">
            <path d="M5,5 Q45,5 65,35 Q85,65 95,95" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="35" cy="35" r="12" fill="#10B981" fillOpacity="0.3" />
            <polygon points="35,25 42,35 35,45 28,35" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopRight: (
          <svg className="floral-corner floral-tr" viewBox="0 0 100 100" fill="none">
            <path d="M5,5 Q45,5 65,35 Q85,65 95,95" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="35" cy="35" r="12" fill="#10B981" fillOpacity="0.3" />
            <polygon points="35,25 42,35 35,45 28,35" fill="#FFE4A0" />
          </svg>
        ),
      };

    // 8. CLASSIC IVORY & GOLD
    case 'classic-ivory':
      return {
        id: 'classic-ivory',
        bodyClass: 'theme-ivory',
        name: 'Classic Ivory & Gold',
        doorBg: 'linear-gradient(135deg, #FAF7F0 0%, #E8E0D0 100%)',
        plaqueThemeTag: 'CLASSIC IVORY & GOLD',
        sealSubtitle: 'ROYAL WAX SEAL',
        celebrationTag: 'HOLY MATRIMONY & RECEPTION',
        archTag: 'ROHIM & WIWIT · LUXURY',
        doorLabelLeft: 'CLASSIC',
        doorLabelRight: 'ESTATE',
        event1Badge: 'HOLY MATRIMONY',
        event2Badge: 'GRAND WEDDING RECEPTION',
        defaultVenue1: 'The Glass House Cathedral, Jakarta Selatan',
        defaultVenue2: 'The Mulia Grand Ballroom, Senayan, Jakarta Pusat',
        archClass: 'rounded-t-[115px] rounded-b-[22px] border-[2.5px] border-[#DFBA73]',
        doorSvg: (
          <svg className="door-svg-emblem" viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8">
            <rect x="25" y="20" width="60" height="180" rx="8" strokeWidth="2" />
            <rect x="35" y="35" width="40" height="65" rx="4" fill="#DFBA73" fillOpacity="0.25" />
            <rect x="35" y="115" width="40" height="65" rx="4" fill="#DFBA73" fillOpacity="0.25" />
            <circle cx="55" cy="67" r="8" fill="#DFBA73" fillOpacity="0.5" />
            <circle cx="55" cy="147" r="8" fill="#DFBA73" fillOpacity="0.5" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#DFBA73" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M25,50 C18,35 22,18 50,15 C78,18 82,35 75,50" strokeWidth="2.2" />
            <circle cx="50" cy="35" r="14" fill="#DFBA73" fillOpacity="0.4" />
            <text x="50" y="39" textAnchor="middle" fill="#FFE4A0" fontSize="12" fontFamily="serif" fontWeight="bold">R&W</text>
          </svg>
        ),
        cornerTopLeft: (
          <svg className="floral-corner floral-tl" viewBox="0 0 100 100" fill="none">
            <path d="M5,5 Q40,10 60,35 Q75,55 85,85" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="35" cy="35" r="14" fill="#DFBA73" fillOpacity="0.3" />
            <circle cx="35" cy="35" r="6" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopRight: (
          <svg className="floral-corner floral-tr" viewBox="0 0 100 100" fill="none">
            <path d="M5,5 Q40,10 60,35 Q75,55 85,85" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="35" cy="35" r="14" fill="#DFBA73" fillOpacity="0.3" />
            <circle cx="35" cy="35" r="6" fill="#FFE4A0" />
          </svg>
        ),
      };

    // 9. SAGE GARDEN BOTANICAL
    case 'sage-garden':
      return {
        id: 'sage-garden',
        bodyClass: 'theme-sage',
        name: 'Sage Garden Botanical',
        doorBg: 'linear-gradient(135deg, #E6EFE9 0%, #C4D7CB 100%)',
        plaqueThemeTag: 'SAGE GARDEN BOTANICAL',
        sealSubtitle: 'EUCALYPTUS',
        celebrationTag: 'INTIMATE GARDEN CELEBRATION',
        archTag: 'ROHIM & WIWIT · GARDEN',
        doorLabelLeft: 'NATURAL',
        doorLabelRight: 'BOTANIC',
        event1Badge: 'OUTDOOR GARDEN VOWS',
        event2Badge: 'SUNSET DINNER RECEPTION',
        defaultVenue1: 'Pine Hill Forest Glasshouse, Lembang, Bandung',
        defaultVenue2: 'The Gaia Hotel Mountain Terrace, Bandung, Jawa Barat',
        archClass: 'rounded-t-[95px] rounded-b-[18px] border-[2.5px] border-[#CBDCD2]',
        doorSvg: (
          <svg className="door-svg-emblem" viewBox="0 0 100 220" fill="none" stroke="#CBDCD2" strokeWidth="1.8">
            <path d="M85,15 C50,40 30,80 30,130 C30,175 50,200 85,215" strokeWidth="2.2" />
            <line x1="30" y1="50" x2="85" y2="105" stroke="#CBDCD2" strokeOpacity="0.4" />
            <line x1="30" y1="100" x2="85" y2="155" stroke="#CBDCD2" strokeOpacity="0.4" />
            <line x1="85" y1="50" x2="30" y2="105" stroke="#CBDCD2" strokeOpacity="0.4" />
            <line x1="85" y1="100" x2="30" y2="155" stroke="#CBDCD2" strokeOpacity="0.4" />
            <circle cx="58" cy="102" r="5" fill="#A7F3D0" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#CBDCD2" strokeWidth="2" className="w-20 h-14 mx-auto">
            <circle cx="50" cy="35" r="22" strokeDasharray="4,4" />
            <path d="M30,35 Q40,25 50,35 Q60,45 70,35" fill="none" />
            <circle cx="40" cy="28" r="4" fill="#A7F3D0" fillOpacity="0.7" />
            <circle cx="60" cy="42" r="4" fill="#A7F3D0" fillOpacity="0.7" />
          </svg>
        ),
        cornerTopLeft: (
          <svg className="floral-corner floral-tl" viewBox="0 0 100 100" fill="none">
            <path d="M5,5 Q35,25 55,65" stroke="#CBDCD2" strokeWidth="2" />
            <circle cx="25" cy="20" r="8" fill="#A7F3D0" fillOpacity="0.5" />
            <circle cx="45" cy="38" r="10" fill="#A7F3D0" fillOpacity="0.4" />
            <circle cx="55" cy="65" r="6" fill="#A7F3D0" fillOpacity="0.6" />
          </svg>
        ),
        cornerTopRight: (
          <svg className="floral-corner floral-tr" viewBox="0 0 100 100" fill="none">
            <path d="M5,5 Q35,25 55,65" stroke="#CBDCD2" strokeWidth="2" />
            <circle cx="25" cy="20" r="8" fill="#A7F3D0" fillOpacity="0.5" />
            <circle cx="45" cy="38" r="10" fill="#A7F3D0" fillOpacity="0.4" />
            <circle cx="55" cy="65" r="6" fill="#A7F3D0" fillOpacity="0.6" />
          </svg>
        ),
      };

    // 10. ROMANTIC ROSE PEONY
    case 'romantic-rose':
      return {
        id: 'romantic-rose',
        bodyClass: 'theme-rose',
        name: 'Romantic Rose Peony',
        doorBg: 'linear-gradient(135deg, #FFF0F3 0%, #F5D0D9 100%)',
        plaqueThemeTag: 'ROMANTIC ROSE PEONY',
        sealSubtitle: 'PEONY BLUSH',
        celebrationTag: 'SWEET ROMANTIC EVENING',
        archTag: 'ROHIM & WIWIT · ROMANCE',
        doorLabelLeft: 'SWEET',
        doorLabelRight: 'ROMANCE',
        event1Badge: 'AKAD NIKAH SAKINAH',
        event2Badge: 'ROMANTIC CANDLELIGHT DINNER',
        defaultVenue1: 'Plataran Cilandak Garden, Jakarta Selatan',
        defaultVenue2: 'Sampoerna Strategic Glass Pavilion, Jakarta Selatan',
        archClass: 'rounded-t-[130px] rounded-b-[24px] border-[2.5px] border-[#F4B8C5]',
        doorSvg: (
          <svg className="door-svg-emblem" viewBox="0 0 100 220" fill="none" stroke="#F4B8C5" strokeWidth="1.8">
            <path d="M85,15 C45,35 25,80 25,130 C25,180 45,205 85,215" strokeWidth="2.2" />
            <circle cx="55" cy="70" r="16" fill="#FB7185" fillOpacity="0.35" />
            <circle cx="55" cy="70" r="8" fill="#FFE4E6" />
            <circle cx="55" cy="145" r="16" fill="#FB7185" fillOpacity="0.35" />
            <circle cx="55" cy="145" r="8" fill="#FFE4E6" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#F4B8C5" strokeWidth="2" className="w-20 h-14 mx-auto">
            <circle cx="50" cy="35" r="18" fill="#FB7185" fillOpacity="0.45" />
            <circle cx="42" cy="30" r="10" fill="#FB7185" fillOpacity="0.6" />
            <circle cx="58" cy="30" r="10" fill="#FB7185" fillOpacity="0.6" />
            <circle cx="50" cy="38" r="6" fill="#FFE4E6" />
          </svg>
        ),
        cornerTopLeft: (
          <svg className="floral-corner floral-tl" viewBox="0 0 100 100" fill="none">
            <circle cx="35" cy="35" r="18" fill="#FB7185" fillOpacity="0.7" />
            <circle cx="35" cy="35" r="9" fill="#FFE4E6" />
            <circle cx="20" cy="60" r="10" fill="#FDA4AF" fillOpacity="0.8" />
            <path d="M5,5 Q35,35 60,70" stroke="#F4B8C5" strokeWidth="2" />
          </svg>
        ),
        cornerTopRight: (
          <svg className="floral-corner floral-tr" viewBox="0 0 100 100" fill="none">
            <circle cx="35" cy="35" r="18" fill="#FB7185" fillOpacity="0.7" />
            <circle cx="35" cy="35" r="9" fill="#FFE4E6" />
            <circle cx="20" cy="60" r="10" fill="#FDA4AF" fillOpacity="0.8" />
            <path d="M5,5 Q35,35 60,70" stroke="#F4B8C5" strokeWidth="2" />
          </svg>
        ),
      };

    // 11. MIDNIGHT CELESTIAL GOLD
    case 'midnight-gold':
      return {
        id: 'midnight-gold',
        bodyClass: 'theme-midnight',
        name: 'Midnight Celestial Gold',
        doorBg: 'linear-gradient(135deg, #0E1626 0%, #05080E 100%)',
        plaqueThemeTag: 'MIDNIGHT CELESTIAL GOLD',
        sealSubtitle: 'STARLIGHT',
        celebrationTag: 'MIDNIGHT STARLIGHT GALA',
        archTag: 'ROHIM & WIWIT · CELESTIAL',
        doorLabelLeft: 'COSMIC',
        doorLabelRight: 'STARS',
        event1Badge: 'TWILIGHT VOWS',
        event2Badge: 'MIDNIGHT GALA UNDER STARS',
        defaultVenue1: 'Sky Garden Rooftop Terrace, Kuningan, Jakarta',
        defaultVenue2: 'The Ritz-Carlton Grand Ballroom, Mega Kuningan, Jakarta',
        archClass: 'rounded-t-[90px] rounded-b-[20px] border-[2.5px] border-[#FFE4A0] shadow-[0_0_30px_rgba(223,186,115,0.45)]',
        doorSvg: (
          <svg className="door-svg-emblem" viewBox="0 0 100 220" fill="none" stroke="#FFE4A0" strokeWidth="1.8">
            <path d="M85,15 C45,35 25,80 25,130 C25,180 45,205 85,215" strokeWidth="2.2" />
            <polygon points="50,45 62,60 50,75 38,60" fill="#FFE4A0" fillOpacity="0.5" />
            <polygon points="50,125 62,140 50,155 38,140" fill="#FFE4A0" fillOpacity="0.5" />
            <line x1="50" y1="75" x2="50" y2="125" stroke="#FFE4A0" strokeDasharray="3,3" />
            <circle cx="50" cy="60" r="4" fill="#FFF" />
            <circle cx="50" cy="140" r="4" fill="#FFF" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#FFE4A0" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M40,15 C52,18 60,30 58,45 C56,58 45,65 35,62 C48,58 52,42 46,30 C43,24 38,18 40,15 Z" fill="#FFE4A0" fillOpacity="0.8" />
            <polygon points="65,22 67,28 73,30 67,32 65,38 63,32 57,30 63,28" fill="#FFF" />
            <polygon points="75,42 76,46 80,47 76,48 75,52 74,48 70,47 74,46" fill="#FFF" />
          </svg>
        ),
        cornerTopLeft: (
          <svg className="floral-corner floral-tl" viewBox="0 0 100 100" fill="none">
            <line x1="10" y1="10" x2="45" y2="25" stroke="#FFE4A0" strokeWidth="1.5" />
            <line x1="45" y1="25" x2="65" y2="60" stroke="#FFE4A0" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="3.5" fill="#FFF" />
            <circle cx="45" cy="25" r="4" fill="#FFE4A0" />
            <circle cx="65" cy="60" r="5" fill="#FFF" />
            <circle cx="25" cy="50" r="2.5" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopRight: (
          <svg className="floral-corner floral-tr" viewBox="0 0 100 100" fill="none">
            <line x1="10" y1="10" x2="45" y2="25" stroke="#FFE4A0" strokeWidth="1.5" />
            <line x1="45" y1="25" x2="65" y2="60" stroke="#FFE4A0" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="3.5" fill="#FFF" />
            <circle cx="45" cy="25" r="4" fill="#FFE4A0" />
            <circle cx="65" cy="60" r="5" fill="#FFF" />
            <circle cx="25" cy="50" r="2.5" fill="#FFE4A0" />
          </svg>
        ),
      };

    // 12. MODERN EDITORIAL MINIMAL
    case 'monochrome-editorial':
    default:
      return {
        id: 'monochrome-editorial',
        bodyClass: 'theme-monochrome',
        name: 'Modern Editorial Minimal',
        doorBg: 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)',
        plaqueThemeTag: 'MODERN EDITORIAL MINIMAL',
        sealSubtitle: 'VOGUE ARCH',
        celebrationTag: 'CONTEMPORARY MATRIMONY',
        archTag: 'ROHIM & WIWIT · EDITORIAL',
        doorLabelLeft: 'MODERN',
        doorLabelRight: 'MINIMAL',
        event1Badge: 'CEREMONY OF UNION',
        event2Badge: 'MODERN DINNER & COCKTAILS',
        defaultVenue1: 'Museum MACAN Modern Space, Kebon Jeruk, Jakarta Barat',
        defaultVenue2: 'The Langham Grand Ballroom, SCBD, Jakarta Selatan',
        archClass: 'rounded-none border-[2.5px] border-[#FFFFFF]',
        doorSvg: (
          <svg className="door-svg-emblem" viewBox="0 0 100 220" fill="none" stroke="#FFFFFF" strokeWidth="1.5">
            <rect x="25" y="20" width="60" height="180" stroke="#FFFFFF" strokeOpacity="0.7" />
            <line x1="40" y1="20" x2="40" y2="200" stroke="#FFFFFF" strokeOpacity="0.3" />
            <line x1="55" y1="20" x2="55" y2="200" stroke="#FFFFFF" strokeOpacity="0.3" />
            <line x1="70" y1="20" x2="70" y2="200" stroke="#FFFFFF" strokeOpacity="0.3" />
            <rect x="52" y="90" width="6" height="40" fill="#DFBA73" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#FFFFFF" strokeWidth="1.5" className="w-20 h-14 mx-auto">
            <rect x="25" y="10" width="50" height="50" stroke="#FFFFFF" />
            <line x1="25" y1="35" x2="75" y2="35" stroke="#DFBA73" strokeWidth="1" />
            <text x="50" y="28" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontFamily="sans-serif" letterSpacing="2">NO. 1</text>
            <text x="50" y="48" textAnchor="middle" fill="#DFBA73" fontSize="9" fontFamily="sans-serif" letterSpacing="1">ETERNAL</text>
          </svg>
        ),
        cornerTopLeft: (
          <svg className="floral-corner floral-tl" viewBox="0 0 100 100" fill="none">
            <line x1="10" y1="10" x2="60" y2="10" stroke="#FFF" strokeWidth="1.5" />
            <line x1="10" y1="10" x2="10" y2="60" stroke="#FFF" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="2.5" fill="#DFBA73" />
          </svg>
        ),
        cornerTopRight: (
          <svg className="floral-corner floral-tr" viewBox="0 0 100 100" fill="none">
            <line x1="10" y1="10" x2="60" y2="10" stroke="#FFF" strokeWidth="1.5" />
            <line x1="10" y1="10" x2="10" y2="60" stroke="#FFF" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="2.5" fill="#DFBA73" />
          </svg>
        ),
      };
  }
}
