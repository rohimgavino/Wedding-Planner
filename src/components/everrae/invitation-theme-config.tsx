import React from 'react';
import { InvitationTheme } from '@/types';

export interface ThemeVisualConfig {
  name: string;
  doorBg: string;
  doorLabelLeft: string;
  doorLabelRight: string;
  sealSubtitle: string;
  plaqueThemeTag: string;
  celebrationTag: string;
  archClass: string;
  archTag: string;
  doorSvg: React.ReactNode;
  heroEmblem: React.ReactNode;
  cornerTopLeft: React.ReactNode;
  cornerTopRight: React.ReactNode;
}

export function getInvitationThemeConfig(theme: InvitationTheme): ThemeVisualConfig {
  switch (theme) {
    // 1. Royal Keraton Jawa
    case 'jawa-keraton':
      return {
        name: 'Royal Keraton Jawa',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(223, 186, 115, 0.14) 0%, transparent 65%), linear-gradient(to bottom, #442111 0%, #2B140A 50%, #150904 100%)',
        doorLabelLeft: 'KERATON',
        doorLabelRight: 'JAWADWIPA',
        sealSubtitle: 'GUNUNGAN',
        plaqueThemeTag: 'ROYAL KERATON JAWA',
        celebrationTag: 'PAWIWAHAN & PANGGIH',
        archClass: 'rounded-3xl border-2 border-[#DFBA73]',
        archTag: 'PAWIWAHAN KERATON',
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8" className="w-full">
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
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
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
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
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

    // 2. Traditional Bugis Pinisi
    case 'bugis-pinisi':
      return {
        name: 'Bugis Makassar Pinisi',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(223, 186, 115, 0.16) 0%, transparent 65%), linear-gradient(to bottom, #163830 0%, #0D221D 50%, #06120F 100%)',
        doorLabelLeft: 'SULAWESI',
        doorLabelRight: 'PINISI',
        sealSubtitle: 'WALASOJI',
        plaqueThemeTag: 'TRADITIONAL BUGIS PINISI',
        celebrationTag: 'MAPPETTUADA & SOMPA',
        archClass: 'rounded-t-[120px] rounded-b-[20px] border-2 border-[#DFBA73]',
        archTag: 'SOMPA & MAMPACCI',
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8" className="w-full">
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
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <path d="M5,5 Q40,10 70,35 Q90,55 95,95 Q55,90 35,70 Q10,40 5,5 Z" fill="#DFBA73" fillOpacity="0.25" />
            <circle cx="35" cy="35" r="16" fill="#871A2E" fillOpacity="0.85" />
            <circle cx="35" cy="35" r="8" fill="#FFE4A0" />
            <path d="M5,5 Q35,35 65,15" stroke="#DFBA73" strokeWidth="2" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <path d="M5,5 Q40,10 70,35 Q90,55 95,95 Q55,90 35,70 Q10,40 5,5 Z" fill="#DFBA73" fillOpacity="0.25" />
            <circle cx="35" cy="35" r="16" fill="#871A2E" fillOpacity="0.85" />
            <circle cx="35" cy="35" r="8" fill="#FFE4A0" />
            <path d="M5,5 Q35,35 65,15" stroke="#DFBA73" strokeWidth="2" />
          </svg>
        ),
      };

    // 3. Minang Kemilau Songket
    case 'minang-songket':
      return {
        name: 'Minang Kemilau Songket',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(223, 186, 115, 0.18) 0%, transparent 65%), linear-gradient(to bottom, #5A1221 0%, #350813 50%, #1A0208 100%)',
        doorLabelLeft: 'RANAH',
        doorLabelRight: 'MINANG',
        sealSubtitle: 'GONJONG',
        plaqueThemeTag: 'MINANG KEMILAU SONGKET',
        celebrationTag: 'BARALEK GADANG',
        archClass: 'rounded-tl-[120px] rounded-br-[120px] rounded-tr-[20px] rounded-bl-[20px] border-2 border-[#DFBA73]',
        archTag: 'BARALEK GADANG',
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8" className="w-full">
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
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <path d="M0,0 L90,0 L70,20 L0,20 Z" fill="#DFBA73" fillOpacity="0.5" />
            <path d="M0,0 L0,90 L20,70 L20,0 Z" fill="#DFBA73" fillOpacity="0.5" />
            <circle cx="35" cy="35" r="14" fill="#DFBA73" fillOpacity="0.6" />
            <polygon points="35,15 45,35 35,55 25,35" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <path d="M0,0 L90,0 L70,20 L0,20 Z" fill="#DFBA73" fillOpacity="0.5" />
            <path d="M0,0 L0,90 L20,70 L20,0 Z" fill="#DFBA73" fillOpacity="0.5" />
            <circle cx="35" cy="35" r="14" fill="#DFBA73" fillOpacity="0.6" />
            <polygon points="35,15 45,35 35,55 25,35" fill="#FFE4A0" />
          </svg>
        ),
      };

    // 4. Dewata Sanctuary Bali
    case 'bali-dewata':
      return {
        name: 'Dewata Sanctuary Bali',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(223, 186, 115, 0.15) 0%, transparent 65%), linear-gradient(to bottom, #3A3226 0%, #201B13 50%, #110E0A 100%)',
        doorLabelLeft: 'CANDI',
        doorLabelRight: 'BENTAR',
        sealSubtitle: 'CANDI BENTAR',
        plaqueThemeTag: 'DEWATA SANCTUARY BALI',
        celebrationTag: 'PAWIWAHAN SUCI DEWATA',
        archClass: 'rounded-t-[80px] rounded-b-[14px] border-2 border-[#DFBA73]',
        archTag: 'SEMARA RATIH',
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8" className="w-full">
            <path d="M85,10 L30,45 L30,70 L50,70 L30,95 L30,120 L50,120 L25,150 L25,215" strokeWidth="2.2" />
            <polygon points="50,45 75,65 50,85 30,65" fill="#DFBA73" fillOpacity="0.45" />
            <polygon points="50,100 75,120 50,140 30,120" fill="#DFBA73" fillOpacity="0.45" />
            <circle cx="50" cy="175" r="8" fill="#FFE4A0" />
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
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <circle cx="35" cy="35" r="14" fill="#FFE4A0" fillOpacity="0.9" />
            <circle cx="35" cy="35" r="7" fill="#F59E0B" />
            <circle cx="20" cy="55" r="10" fill="#FFF" fillOpacity="0.9" />
            <circle cx="20" cy="55" r="5" fill="#F59E0B" />
            <path d="M5,5 Q45,20 65,65" stroke="#DFBA73" strokeWidth="2" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <circle cx="35" cy="35" r="14" fill="#FFE4A0" fillOpacity="0.9" />
            <circle cx="35" cy="35" r="7" fill="#F59E0B" />
            <circle cx="20" cy="55" r="10" fill="#FFF" fillOpacity="0.9" />
            <circle cx="20" cy="55" r="5" fill="#F59E0B" />
            <path d="M5,5 Q45,20 65,65" stroke="#DFBA73" strokeWidth="2" />
          </svg>
        ),
      };

    // 5. Sunda Parahyangan
    case 'sunda-siger':
      return {
        name: 'Sunda Parahyangan',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(223, 186, 115, 0.15) 0%, transparent 65%), linear-gradient(to bottom, #234E3C 0%, #143226 50%, #0A1A13 100%)',
        doorLabelLeft: 'PRIANGAN',
        doorLabelRight: 'PARAHYANGAN',
        sealSubtitle: 'SIGER PASUNDAN',
        plaqueThemeTag: 'SUNDA PARAHYANGAN',
        celebrationTag: 'WALIMATUL NIKAH & SAWER',
        archClass: 'rounded-t-[110px] rounded-b-[20px] border-2 border-[#DFBA73]',
        archTag: 'SAWER PANGANTEN',
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8" className="w-full">
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
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <path d="M5,5 Q40,15 60,50" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="20" cy="15" r="4" fill="#FFF" />
            <circle cx="35" cy="22" r="4" fill="#FFF" />
            <circle cx="48" cy="35" r="5" fill="#FFE4A0" />
            <path d="M15,30 Q30,40 20,55 Q10,45 15,30 Z" fill="#10B981" fillOpacity="0.6" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <path d="M5,5 Q40,15 60,50" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="20" cy="15" r="4" fill="#FFF" />
            <circle cx="35" cy="22" r="4" fill="#FFF" />
            <circle cx="48" cy="35" r="5" fill="#FFE4A0" />
            <path d="M15,30 Q30,40 20,55 Q10,45 15,30 Z" fill="#10B981" fillOpacity="0.6" />
          </svg>
        ),
      };

    // 6. Batak Royal Ulos
    case 'batak-gorga':
      return {
        name: 'Batak Royal Ulos',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(220, 38, 38, 0.15) 0%, transparent 65%), linear-gradient(to bottom, #4D1818 0%, #2E0B0B 50%, #180404 100%)',
        doorLabelLeft: 'DALIHAN',
        doorLabelRight: 'NA TOLU',
        sealSubtitle: 'GORGA TOBA',
        plaqueThemeTag: 'BATAK ROYAL ULOS',
        celebrationTag: 'PAMASU-MASUON & ULAON UNJUK',
        archClass: 'rounded-t-[40px] rounded-b-[10px] border-2 border-[#D4A76A]',
        archTag: 'DALIAN NA TOLU',
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8" className="w-full">
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
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <rect x="0" y="0" width="80" height="15" fill="#DC2626" fillOpacity="0.6" />
            <rect x="0" y="0" width="15" height="80" fill="#DC2626" fillOpacity="0.6" />
            <polygon points="25,25 40,40 25,55 10,40" fill="#DFBA73" />
            <circle cx="25" cy="40" r="4" fill="#FFF" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <rect x="0" y="0" width="80" height="15" fill="#DC2626" fillOpacity="0.6" />
            <rect x="0" y="0" width="15" height="80" fill="#DC2626" fillOpacity="0.6" />
            <polygon points="25,25 40,40 25,55 10,40" fill="#DFBA73" />
            <circle cx="25" cy="40" r="4" fill="#FFF" />
          </svg>
        ),
      };

    // 7. Madinah Arabesque Gold
    case 'islamic-arabesque':
      return {
        name: 'Madinah Arabesque Gold',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(223, 186, 115, 0.2) 0%, transparent 65%), linear-gradient(to bottom, #164833 0%, #0B2C1F 50%, #05160F 100%)',
        doorLabelLeft: 'MADINAH',
        doorLabelRight: 'AL-MUNAWARAH',
        sealSubtitle: 'RUB EL HIZB',
        plaqueThemeTag: 'MADINAH ARABESQUE GOLD',
        celebrationTag: 'WALIMATUL \'URSY',
        archClass: 'rounded-t-[125px] rounded-b-[14px] border-2 border-[#DFBA73]',
        archTag: 'WALIMATUL \'URSY',
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8" className="w-full">
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
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <path d="M5,5 Q45,5 65,35 Q85,65 95,95" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="35" cy="35" r="12" fill="#10B981" fillOpacity="0.3" />
            <polygon points="35,25 42,35 35,45 28,35" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <path d="M5,5 Q45,5 65,35 Q85,65 95,95" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="35" cy="35" r="12" fill="#10B981" fillOpacity="0.3" />
            <polygon points="35,25 42,35 35,45 28,35" fill="#FFE4A0" />
          </svg>
        ),
      };

    // 8. Classic Ivory & Gold
    case 'classic-ivory':
      return {
        name: 'Classic Ivory & Gold',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(223, 186, 115, 0.18) 0%, transparent 65%), linear-gradient(to bottom, #42382C 0%, #292219 50%, #15110C 100%)',
        doorLabelLeft: 'CLASSIC',
        doorLabelRight: 'ESTATE',
        sealSubtitle: 'ROYAL SEAL',
        plaqueThemeTag: 'CLASSIC IVORY & GOLD',
        celebrationTag: 'HOLY MATRIMONY & RECEPTION',
        archClass: 'rounded-t-[115px] rounded-b-[22px] border-2 border-[#DFBA73]',
        archTag: 'HOLY MATRIMONY',
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8" className="w-full">
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
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <path d="M5,5 Q40,10 60,35 Q75,55 85,85" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="35" cy="35" r="14" fill="#DFBA73" fillOpacity="0.3" />
            <circle cx="35" cy="35" r="6" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <path d="M5,5 Q40,10 60,35 Q75,55 85,85" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="35" cy="35" r="14" fill="#DFBA73" fillOpacity="0.3" />
            <circle cx="35" cy="35" r="6" fill="#FFE4A0" />
          </svg>
        ),
      };

    // 9. Sage Garden Botanical
    case 'sage-garden':
      return {
        name: 'Sage Garden Botanical',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(167, 243, 208, 0.15) 0%, transparent 65%), linear-gradient(to bottom, #2E4738 0%, #1C2E23 50%, #0D1711 100%)',
        doorLabelLeft: 'NATURAL',
        doorLabelRight: 'BOTANIC',
        sealSubtitle: 'EUCALYPTUS',
        plaqueThemeTag: 'SAGE GARDEN BOTANICAL',
        celebrationTag: 'INTIMATE GARDEN CELEBRATION',
        archClass: 'rounded-t-[95px] rounded-b-[18px] border-2 border-[#CBDCD2]',
        archTag: 'GARDEN CEREMONY',
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#CBDCD2" strokeWidth="1.8" className="w-full">
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
            <path d="M30,35 Q40,25 50,35 Q60,45 70,35" />
            <circle cx="40" cy="28" r="4" fill="#A7F3D0" fillOpacity="0.7" />
            <circle cx="60" cy="42" r="4" fill="#A7F3D0" fillOpacity="0.7" />
          </svg>
        ),
        cornerTopLeft: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <path d="M5,5 Q35,25 55,65" stroke="#CBDCD2" strokeWidth="2" />
            <circle cx="25" cy="20" r="8" fill="#A7F3D0" fillOpacity="0.5" />
            <circle cx="45" cy="38" r="10" fill="#A7F3D0" fillOpacity="0.4" />
            <circle cx="55" cy="65" r="6" fill="#A7F3D0" fillOpacity="0.6" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <path d="M5,5 Q35,25 55,65" stroke="#CBDCD2" strokeWidth="2" />
            <circle cx="25" cy="20" r="8" fill="#A7F3D0" fillOpacity="0.5" />
            <circle cx="45" cy="38" r="10" fill="#A7F3D0" fillOpacity="0.4" />
            <circle cx="55" cy="65" r="6" fill="#A7F3D0" fillOpacity="0.6" />
          </svg>
        ),
      };

    // 10. Romantic Rose Peony
    case 'romantic-rose':
      return {
        name: 'Romantic Rose Peony',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(251, 113, 133, 0.18) 0%, transparent 65%), linear-gradient(to bottom, #541E2D 0%, #350F1B 50%, #1A060C 100%)',
        doorLabelLeft: 'SWEET',
        doorLabelRight: 'ROMANCE',
        sealSubtitle: 'PEONY BLUSH',
        plaqueThemeTag: 'ROMANTIC ROSE PEONY',
        celebrationTag: 'THE WEDDING CELEBRATION',
        archClass: 'rounded-t-[130px] rounded-b-[24px] border-2 border-[#F4B8C5]',
        archTag: 'FOREVER & ALWAYS',
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#F4B8C5" strokeWidth="1.8" className="w-full">
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
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <circle cx="35" cy="35" r="18" fill="#FB7185" fillOpacity="0.7" />
            <circle cx="35" cy="35" r="9" fill="#FFE4E6" />
            <circle cx="20" cy="60" r="10" fill="#FDA4AF" fillOpacity="0.8" />
            <path d="M5,5 Q35,35 60,70" stroke="#F4B8C5" strokeWidth="2" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <circle cx="35" cy="35" r="18" fill="#FB7185" fillOpacity="0.7" />
            <circle cx="35" cy="35" r="9" fill="#FFE4E6" />
            <circle cx="20" cy="60" r="10" fill="#FDA4AF" fillOpacity="0.8" />
            <path d="M5,5 Q35,35 60,70" stroke="#F4B8C5" strokeWidth="2" />
          </svg>
        ),
      };

    // 11. Midnight Celestial Gold
    case 'midnight-gold':
      return {
        name: 'Midnight Celestial Gold',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(223, 186, 115, 0.22) 0%, transparent 65%), linear-gradient(to bottom, #122852 0%, #0A1732 50%, #040916 100%)',
        doorLabelLeft: 'COSMIC',
        doorLabelRight: 'STARS',
        sealSubtitle: 'STARLIGHT',
        plaqueThemeTag: 'MIDNIGHT CELESTIAL GOLD',
        celebrationTag: 'MIDNIGHT STARLIGHT GALA',
        archClass: 'rounded-t-[90px] rounded-b-[20px] border-2 border-[#FFE4A0] shadow-[0_0_30px_rgba(223,186,115,0.35)]',
        archTag: 'UNDER THE STARS',
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#FFE4A0" strokeWidth="1.8" className="w-full">
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
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <line x1="10" y1="10" x2="45" y2="25" stroke="#FFE4A0" strokeWidth="1.5" />
            <line x1="45" y1="25" x2="65" y2="60" stroke="#FFE4A0" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="3.5" fill="#FFF" />
            <circle cx="45" cy="25" r="4" fill="#FFE4A0" />
            <circle cx="65" cy="60" r="5" fill="#FFF" />
            <circle cx="25" cy="50" r="2.5" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <line x1="10" y1="10" x2="45" y2="25" stroke="#FFE4A0" strokeWidth="1.5" />
            <line x1="45" y1="25" x2="65" y2="60" stroke="#FFE4A0" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="3.5" fill="#FFF" />
            <circle cx="45" cy="25" r="4" fill="#FFE4A0" />
            <circle cx="65" cy="60" r="5" fill="#FFF" />
            <circle cx="25" cy="50" r="2.5" fill="#FFE4A0" />
          </svg>
        ),
      };

    // 12. Modern Minimalist Editorial
    case 'monochrome-editorial':
    default:
      return {
        name: 'Modern Minimalist Editorial',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 65%), linear-gradient(to bottom, #2E2E2E 0%, #1A1A1A 50%, #0D0D0D 100%)',
        doorLabelLeft: 'MODERN',
        doorLabelRight: 'MINIMAL',
        sealSubtitle: 'VOGUE ARCH',
        plaqueThemeTag: 'MODERN EDITORIAL MINIMAL',
        celebrationTag: 'CONTEMPORARY MATRIMONY',
        archClass: 'rounded-none border-2 border-white',
        archTag: 'CONTEMPORARY UNION',
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#FFFFFF" strokeWidth="1.5" className="w-full">
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
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <line x1="10" y1="10" x2="60" y2="10" stroke="#FFF" strokeWidth="1.5" />
            <line x1="10" y1="10" x2="10" y2="60" stroke="#FFF" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="2.5" fill="#DFBA73" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <line x1="10" y1="10" x2="60" y2="10" stroke="#FFF" strokeWidth="1.5" />
            <line x1="10" y1="10" x2="10" y2="60" stroke="#FFF" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="2.5" fill="#DFBA73" />
          </svg>
        ),
      };
  }
}
