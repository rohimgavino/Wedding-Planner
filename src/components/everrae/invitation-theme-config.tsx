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
  heroCardBg: string;
  heroCardBorder: string;
  heroArtwork: React.ReactNode;
  heroPatternSvg: React.ReactNode;
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
        heroCardBg: 'linear-gradient(180deg, #381E10 0%, #201007 50%, #120803 100%)',
        heroCardBorder: 'border-[#DFBA73]/60',
        heroArtwork: (
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="none">
            {/* Ambient Background & Sogan Aura */}
            <rect width="200" height="280" fill="url(#jawaBg)" />
            <defs>
              <linearGradient id="jawaBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2A1408" />
                <stop offset="100%" stopColor="#100502" />
              </linearGradient>
            </defs>
            {/* Sunburst rays */}
            <circle cx="100" cy="130" r="70" fill="#DFBA73" fillOpacity="0.1" />
            <circle cx="100" cy="130" r="45" fill="#FFE4A0" fillOpacity="0.15" />
            {/* Javanese Gebyok Arch Frame */}
            <path d="M20,280 L20,70 Q100,10 180,70 L180,280" stroke="#DFBA73" strokeWidth="2.5" fill="none" />
            <path d="M30,280 L30,78 Q100,24 170,78 L170,280" stroke="#DFBA73" strokeWidth="1" strokeDasharray="3,3" fill="none" />
            {/* Golden Gunungan / Kayon Wayang in Center */}
            <path d="M100,35 C100,35 60,95 60,165 C60,205 85,225 100,230 C115,225 140,205 140,165 C140,95 100,35 100,35 Z" fill="#DFBA73" fillOpacity="0.3" stroke="#FFE4A0" strokeWidth="2" />
            {/* Tree of Life Inner filigree */}
            <line x1="100" y1="50" x2="100" y2="225" stroke="#FFE4A0" strokeWidth="2" />
            <path d="M80,110 Q100,95 120,110" stroke="#FFE4A0" strokeWidth="1.5" />
            <path d="M72,145 Q100,125 128,145" stroke="#FFE4A0" strokeWidth="1.5" />
            <path d="M68,180 Q100,160 132,180" stroke="#FFE4A0" strokeWidth="1.5" />
            {/* Ronce Melati Jasmine garlands */}
            <g fill="#FFFFFF" fillOpacity="0.85">
              <circle cx="45" cy="110" r="4" />
              <circle cx="43" cy="125" r="4" />
              <circle cx="41" cy="140" r="4" />
              <circle cx="43" cy="155" r="4" />
              <circle cx="45" cy="170" r="4.5" />
              <circle cx="155" cy="110" r="4" />
              <circle cx="157" cy="125" r="4" />
              <circle cx="159" cy="140" r="4" />
              <circle cx="157" cy="155" r="4" />
              <circle cx="155" cy="170" r="4.5" />
            </g>
          </svg>
        ),
        heroPatternSvg: (
          <svg viewBox="0 0 80 80" width="80" height="80" fill="none" stroke="#DFBA73" strokeWidth="1">
            <circle cx="40" cy="40" r="16" />
            <ellipse cx="40" cy="20" rx="6" ry="12" />
            <ellipse cx="40" cy="60" rx="6" ry="12" />
            <ellipse cx="20" cy="40" rx="12" ry="6" />
            <ellipse cx="60" cy="40" rx="12" ry="6" />
          </svg>
        ),
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

    // 2. Bugis Makassar Pinisi
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
        heroCardBg: 'linear-gradient(180deg, #103227 0%, #0B221B 50%, #04140F 100%)',
        heroCardBorder: 'border-[#2AC496]/50',
        heroArtwork: (
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="none">
            <rect width="200" height="280" fill="url(#bugisBg)" />
            <defs>
              <linearGradient id="bugisBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B261D" />
                <stop offset="100%" stopColor="#03100C" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="50" fill="#FFE4A0" fillOpacity="0.15" />
            {/* Pinisi Ship Illustration */}
            <path d="M40,195 Q100,215 160,195 L145,215 Q100,230 55,215 Z" fill="#DFBA73" fillOpacity="0.8" />
            {/* Ship Masts */}
            <line x1="85" y1="70" x2="85" y2="195" stroke="#FFE4A0" strokeWidth="2.5" />
            <line x1="125" y1="85" x2="125" y2="195" stroke="#FFE4A0" strokeWidth="2" />
            {/* Billowing Canvas Sails */}
            <path d="M85,75 Q115,100 85,130 Z" fill="#DFBA73" fillOpacity="0.5" stroke="#FFE4A0" strokeWidth="1.5" />
            <path d="M85,135 Q120,160 85,185 Z" fill="#DFBA73" fillOpacity="0.5" stroke="#FFE4A0" strokeWidth="1.5" />
            <path d="M125,90 Q150,115 125,140 Z" fill="#DFBA73" fillOpacity="0.5" stroke="#FFE4A0" strokeWidth="1.5" />
            {/* Front Jib Sails */}
            <path d="M85,75 L45,150 L85,150 Z" fill="#FFE4A0" fillOpacity="0.35" stroke="#FFE4A0" strokeWidth="1.2" />
            {/* Ocean Waves */}
            <path d="M20,215 Q50,205 80,215 T140,215 T200,215" stroke="#2AC496" strokeWidth="2" fill="none" />
            <path d="M10,225 Q50,215 90,225 T170,225" stroke="#2AC496" strokeWidth="1.2" strokeOpacity="0.6" fill="none" />
          </svg>
        ),
        heroPatternSvg: (
          <svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="#2AC496" strokeWidth="1" opacity="0.4">
            <polygon points="30,5 55,30 30,55 5,30" />
            <polygon points="30,15 45,30 30,45 15,30" />
          </svg>
        ),
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
            <path d="M15,55 Q50,65 85,55 L75,65 Q50,72 25,65 Z" fill="#DFBA73" fillOpacity="0.5" />
            <line x1="45" y1="15" x2="45" y2="55" />
            <line x1="65" y1="25" x2="65" y2="55" />
            <path d="M45,20 Q65,30 45,45" fill="#DFBA73" fillOpacity="0.6" />
            <path d="M65,30 Q80,38 65,50" fill="#DFBA73" fillOpacity="0.6" />
          </svg>
        ),
        cornerTopLeft: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <polygon points="10,10 50,10 10,50" fill="#DFBA73" fillOpacity="0.25" stroke="#DFBA73" strokeWidth="1.5" />
            <polygon points="10,10 30,10 10,30" fill="#FFE4A0" fillOpacity="0.5" />
            <line x1="50" y1="10" x2="10" y2="50" stroke="#DFBA73" strokeWidth="2" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <polygon points="10,10 50,10 10,50" fill="#DFBA73" fillOpacity="0.25" stroke="#DFBA73" strokeWidth="1.5" />
            <polygon points="10,10 30,10 10,30" fill="#FFE4A0" fillOpacity="0.5" />
            <line x1="50" y1="10" x2="10" y2="50" stroke="#DFBA73" strokeWidth="2" />
          </svg>
        ),
      };

    // 3. Minang Kemilau Songket
    case 'minang-songket':
      return {
        name: 'Minang Kemilau Songket',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(223, 186, 115, 0.18) 0%, transparent 65%), linear-gradient(to bottom, #54111E 0%, #350A12 50%, #170408 100%)',
        doorLabelLeft: 'MINANG',
        doorLabelRight: 'GONJONG',
        sealSubtitle: 'RUMAH GADANG',
        plaqueThemeTag: 'KEMILAU SONGKET MINANGKABAU',
        celebrationTag: 'BARALEK GADANG',
        archClass: 'rounded-t-[40px] rounded-b-[20px] border-2 border-[#DFBA73]',
        archTag: 'ALEK GADANG MARAPULAI',
        heroCardBg: 'linear-gradient(180deg, #4A0B17 0%, #2A040B 50%, #140104 100%)',
        heroCardBorder: 'border-[#DFBA73]/60',
        heroArtwork: (
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="none">
            <rect width="200" height="280" fill="url(#minangBg)" />
            <defs>
              <linearGradient id="minangBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3A0812" />
                <stop offset="100%" stopColor="#120104" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="110" r="55" fill="#DFBA73" fillOpacity="0.12" />
            {/* Iconic Rumah Gadang Curved Roof with 5 Gonjong */}
            {/* Center gonjong */}
            <path d="M100,45 Q90,95 100,120 Q110,95 100,45 Z" fill="#FFE4A0" fillOpacity="0.9" />
            {/* Left and right inner gonjongs */}
            <path d="M60,65 Q75,100 85,125 Q55,105 60,65 Z" fill="#DFBA73" fillOpacity="0.8" />
            <path d="M140,65 Q125,100 115,125 Q145,105 140,65 Z" fill="#DFBA73" fillOpacity="0.8" />
            {/* Far outer soaring gonjongs */}
            <path d="M25,85 Q50,115 65,135 Q30,120 25,85 Z" fill="#DFBA73" fillOpacity="0.7" />
            <path d="M175,85 Q150,115 135,135 Q170,120 175,85 Z" fill="#DFBA73" fillOpacity="0.7" />
            {/* Main Roof Arch Body */}
            <path d="M20,135 Q100,165 180,135 L170,160 Q100,185 30,160 Z" fill="#FFE4A0" fillOpacity="0.85" stroke="#DFBA73" strokeWidth="1.5" />
            {/* Rumah Gadang Wall Carvings */}
            <rect x="40" y="160" width="120" height="45" fill="#3D0A14" stroke="#DFBA73" strokeWidth="1.5" />
            {/* Pucuk Rebung Songket motifs */}
            <g fill="#DFBA73">
              <polygon points="50,195 57,170 64,195" />
              <polygon points="68,195 75,170 82,195" />
              <polygon points="86,195 93,170 100,195" />
              <polygon points="104,195 111,170 118,195" />
              <polygon points="122,195 129,170 136,195" />
              <polygon points="140,195 147,170 154,195" />
            </g>
          </svg>
        ),
        heroPatternSvg: (
          <svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="#DFBA73" strokeWidth="1" opacity="0.35">
            <polygon points="30,5 55,50 5,50" />
            <polygon points="30,18 45,45 15,45" />
          </svg>
        ),
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8" className="w-full">
            <path d="M85,10 C50,45 20,80 20,130 C20,175 40,200 85,215" strokeWidth="2.2" />
            <path d="M20,40 Q55,20 85,60" strokeDasharray="2,2" />
            <path d="M35,80 Q55,60 75,80 Q55,100 35,80 Z" fill="#DFBA73" fillOpacity="0.45" />
            <path d="M35,130 Q55,110 75,130 Q55,150 35,130 Z" fill="#DFBA73" fillOpacity="0.45" />
            <circle cx="55" cy="80" r="5" fill="#FFE4A0" />
            <circle cx="55" cy="130" r="5" fill="#FFE4A0" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#DFBA73" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M50,10 Q35,35 15,30 Q35,48 50,45 Q65,48 85,30 Q65,35 50,10 Z" fill="#DFBA73" fillOpacity="0.5" />
            <path d="M25,48 L75,48 L68,60 L32,60 Z" fill="#DFBA73" fillOpacity="0.7" />
          </svg>
        ),
        cornerTopLeft: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <path d="M10,80 Q10,10 80,10" stroke="#DFBA73" strokeWidth="2.5" />
            <polygon points="25,25 45,15 35,35" fill="#DFBA73" fillOpacity="0.6" />
            <polygon points="35,35 55,25 45,45" fill="#DFBA73" fillOpacity="0.6" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <path d="M10,80 Q10,10 80,10" stroke="#DFBA73" strokeWidth="2.5" />
            <polygon points="25,25 45,15 35,35" fill="#DFBA73" fillOpacity="0.6" />
            <polygon points="35,35 55,25 45,45" fill="#DFBA73" fillOpacity="0.6" />
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
        archTag: 'SEMARA RATIH & KAMBOJA',
        heroCardBg: 'linear-gradient(180deg, #2D2316 0%, #1A140B 50%, #0D0A05 100%)',
        heroCardBorder: 'border-[#DFBA73]/60',
        heroArtwork: (
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="none">
            <rect width="200" height="280" fill="url(#baliBg)" />
            <defs>
              <linearGradient id="baliBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#251C12" />
                <stop offset="100%" stopColor="#0E0A06" />
              </linearGradient>
            </defs>
            {/* Sacred Sunrise Glow */}
            <circle cx="100" cy="115" r="50" fill="#FFE4A0" fillOpacity="0.22" />
            <circle cx="100" cy="115" r="75" fill="#DFBA73" fillOpacity="0.1" />
            {/* Left Candi Bentar (Split Gateway Half) */}
            <path d="M96,30 L80,50 L80,75 L65,85 L65,115 L50,130 L50,165 L35,180 L35,240 L96,240 Z" fill="#DFBA73" fillOpacity="0.45" stroke="#FFE4A0" strokeWidth="1.8" />
            {/* Right Candi Bentar (Mirror Half) */}
            <path d="M104,30 L120,50 L120,75 L135,85 L135,115 L150,130 L150,165 L165,180 L165,240 L104,240 Z" fill="#DFBA73" fillOpacity="0.45" stroke="#FFE4A0" strokeWidth="1.8" />
            {/* Penjor Bamboo Leaves on Sides */}
            <path d="M25,230 Q15,140 40,70 Q45,60 35,55" stroke="#DFBA73" strokeWidth="2.5" fill="none" />
            <path d="M175,230 Q185,140 160,70 Q155,60 165,55" stroke="#DFBA73" strokeWidth="2.5" fill="none" />
            {/* Frangipani / Bunga Kamboja Bali (Plumeria) Flowers */}
            <g transform="translate(100, 160)">
              {/* Central Flower */}
              <circle cx="0" cy="0" r="14" fill="#FFE4A0" />
              <circle cx="0" cy="0" r="7" fill="#F59E0B" />
              <path d="M0,-20 Q12,-10 0,0 Q-12,-10 0,-20 Z" fill="#FFFFFF" fillOpacity="0.9" />
              <path d="M18,-6 Q18,8 0,0 Q10,-14 18,-6 Z" fill="#FFFFFF" fillOpacity="0.9" />
              <path d="M12,16 Q-2,18 0,0 Q14,8 12,16 Z" fill="#FFFFFF" fillOpacity="0.9" />
              <path d="M-12,16 Q-14,8 0,0 Q-2,18 -12,16 Z" fill="#FFFFFF" fillOpacity="0.9" />
              <path d="M-18,-6 Q-10,-14 0,0 Q-18,8 -18,-6 Z" fill="#FFFFFF" fillOpacity="0.9" />
            </g>
            {/* Smaller floating kamboja */}
            <g transform="translate(60, 205) scale(0.65)">
              <circle cx="0" cy="0" r="12" fill="#FFE4A0" />
              <circle cx="0" cy="0" r="6" fill="#F59E0B" />
              <circle cx="0" cy="-14" r="8" fill="#FFF" />
              <circle cx="14" cy="0" r="8" fill="#FFF" />
              <circle cx="0" cy="14" r="8" fill="#FFF" />
              <circle cx="-14" cy="0" r="8" fill="#FFF" />
            </g>
            <g transform="translate(140, 205) scale(0.65)">
              <circle cx="0" cy="0" r="12" fill="#FFE4A0" />
              <circle cx="0" cy="0" r="6" fill="#F59E0B" />
              <circle cx="0" cy="-14" r="8" fill="#FFF" />
              <circle cx="14" cy="0" r="8" fill="#FFF" />
              <circle cx="0" cy="14" r="8" fill="#FFF" />
              <circle cx="-14" cy="0" r="8" fill="#FFF" />
            </g>
          </svg>
        ),
        heroPatternSvg: (
          <svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="#DFBA73" strokeWidth="1" opacity="0.3">
            <circle cx="30" cy="30" r="10" />
            <circle cx="30" cy="12" r="6" />
            <circle cx="48" cy="30" r="6" />
            <circle cx="30" cy="48" r="6" />
            <circle cx="12" cy="30" r="6" />
          </svg>
        ),
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
        archTag: 'SIGER & MELATI PASUNDAN',
        heroCardBg: 'linear-gradient(180deg, #173B2A 0%, #0F271B 50%, #07150E 100%)',
        heroCardBorder: 'border-[#82D4A4]/50',
        heroArtwork: (
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="none">
            <rect width="200" height="280" fill="url(#sundaBg)" />
            <defs>
              <linearGradient id="sundaBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#102E21" />
                <stop offset="100%" stopColor="#05130D" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="115" r="55" fill="#82D4A4" fillOpacity="0.15" />
            {/* Golden Siger Pasundan Crown */}
            <path d="M30,140 C40,100 60,65 70,55 C80,75 90,95 100,40 C110,95 120,75 130,55 C140,65 160,100 170,140 Z" fill="#DFBA73" fillOpacity="0.75" stroke="#FFE4A0" strokeWidth="2" />
            <path d="M25,142 L175,142 L165,158 L35,158 Z" fill="#FFE4A0" stroke="#DFBA73" strokeWidth="1.5" />
            {/* Siger Crown Gemstones */}
            <circle cx="100" cy="70" r="5" fill="#FFF" />
            <circle cx="70" cy="85" r="4" fill="#82D4A4" />
            <circle cx="130" cy="85" r="4" fill="#82D4A4" />
            {/* Cascading Melati Roro Mendut Garlands */}
            <g fill="#FFFFFF" fillOpacity="0.9">
              <circle cx="45" cy="165" r="3.5" />
              <circle cx="43" cy="180" r="3.5" />
              <circle cx="42" cy="195" r="4" />
              <circle cx="44" cy="210" r="4" />
              <circle cx="155" cy="165" r="3.5" />
              <circle cx="157" cy="180" r="3.5" />
              <circle cx="158" cy="195" r="4" />
              <circle cx="156" cy="210" r="4" />
            </g>
          </svg>
        ),
        heroPatternSvg: (
          <svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="#82D4A4" strokeWidth="1" opacity="0.3">
            <path d="M30,5 C40,20 40,40 30,55 C20,40 20,20 30,5 Z" />
            <path d="M5,30 C20,40 40,40 55,30 C40,20 20,20 5,30 Z" />
          </svg>
        ),
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
          </svg>
        ),
        cornerTopLeft: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <circle cx="30" cy="30" r="10" fill="#FFF" fillOpacity="0.8" />
            <circle cx="30" cy="30" r="5" fill="#FFE4A0" />
            <circle cx="45" cy="45" r="7" fill="#FFF" fillOpacity="0.8" />
            <path d="M10,80 Q20,20 80,10" stroke="#DFBA73" strokeWidth="2" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <circle cx="30" cy="30" r="10" fill="#FFF" fillOpacity="0.8" />
            <circle cx="30" cy="30" r="5" fill="#FFE4A0" />
            <circle cx="45" cy="45" r="7" fill="#FFF" fillOpacity="0.8" />
            <path d="M10,80 Q20,20 80,10" stroke="#DFBA73" strokeWidth="2" />
          </svg>
        ),
      };

    // 6. Batak Royal Ulos
    case 'batak-gorga':
      return {
        name: 'Batak Royal Ulos',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(220, 38, 38, 0.2) 0%, transparent 65%), linear-gradient(to bottom, #441414 0%, #290B0B 50%, #120404 100%)',
        doorLabelLeft: 'HORAS',
        doorLabelRight: 'GORGA',
        sealSubtitle: 'ULOS BOLON',
        plaqueThemeTag: 'BATAK ROYAL ULOS',
        celebrationTag: 'PAMASU-MASUON & ULAON UNJUK',
        archClass: 'rounded-t-[50px] rounded-b-[10px] border-2 border-[#E55353]',
        archTag: 'RAGI HOTANG & GORGA',
        heroCardBg: 'linear-gradient(180deg, #3D1010 0%, #240808 50%, #120303 100%)',
        heroCardBorder: 'border-[#E55353]/50',
        heroArtwork: (
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="none">
            <rect width="200" height="280" fill="url(#batakBg)" />
            <defs>
              <linearGradient id="batakBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2A0808" />
                <stop offset="100%" stopColor="#0E0202" />
              </linearGradient>
            </defs>
            {/* Gorga Spirals & Ulos Centerpiece */}
            <circle cx="100" cy="115" r="55" fill="#E55353" fillOpacity="0.2" />
            {/* Ulos Geometry Cross and Diamond patterns */}
            <polygon points="100,50 150,115 100,180 50,115" stroke="#FFE4A0" strokeWidth="2.5" fill="#E55353" fillOpacity="0.3" />
            <polygon points="100,70 135,115 100,160 65,115" stroke="#FFF" strokeWidth="1.5" fill="#000" fillOpacity="0.4" />
            {/* Gorga Simeol-meol spiral motifs */}
            <path d="M100,95 Q115,115 100,135 Q85,115 100,95 Z" fill="#FFE4A0" />
            {/* Top and Bottom Ulos Fringe Borders */}
            <line x1="30" y1="210" x2="170" y2="210" stroke="#FFE4A0" strokeWidth="2" />
            <line x1="30" y1="218" x2="170" y2="218" stroke="#E55353" strokeWidth="3" />
            <line x1="30" y1="225" x2="170" y2="225" stroke="#FFF" strokeWidth="1.5" strokeDasharray="3,3" />
          </svg>
        ),
        heroPatternSvg: (
          <svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="#E55353" strokeWidth="1" opacity="0.35">
            <polygon points="30,5 55,30 30,55 5,30" />
            <circle cx="30" cy="30" r="8" />
          </svg>
        ),
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#E55353" strokeWidth="1.8" className="w-full">
            <path d="M85,15 C40,40 25,80 25,130 C25,180 40,205 85,215" strokeWidth="2.2" />
            <path d="M45,70 Q65,50 70,75 Q60,95 45,70 Z" fill="#E55353" fillOpacity="0.6" />
            <path d="M45,130 Q65,110 70,135 Q60,155 45,130 Z" fill="#E55353" fillOpacity="0.6" />
            <circle cx="55" cy="72" r="4" fill="#FFE4A0" />
            <circle cx="55" cy="132" r="4" fill="#FFE4A0" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#E55353" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M20,60 L50,15 L80,60 Z" stroke="#FFE4A0" strokeWidth="2" fill="#E55353" fillOpacity="0.3" />
            <polygon points="50,28 65,50 35,50" fill="#FFE4A0" />
          </svg>
        ),
        cornerTopLeft: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <polygon points="5,5 50,5 5,50" fill="#E55353" fillOpacity="0.4" stroke="#FFE4A0" strokeWidth="1.5" />
            <line x1="5" y1="5" x2="35" y2="35" stroke="#FFF" strokeWidth="2" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <polygon points="5,5 50,5 5,50" fill="#E55353" fillOpacity="0.4" stroke="#FFE4A0" strokeWidth="1.5" />
            <line x1="5" y1="5" x2="35" y2="35" stroke="#FFF" strokeWidth="2" />
          </svg>
        ),
      };

    // 7. Classic Ivory & Gold
    case 'classic-ivory':
      return {
        name: 'Classic Ivory & Gold',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(223, 186, 115, 0.18) 0%, transparent 65%), linear-gradient(to bottom, #42382C 0%, #292219 50%, #15110C 100%)',
        doorLabelLeft: 'CLASSIC',
        doorLabelRight: 'ESTATE',
        sealSubtitle: 'ROYAL SEAL',
        plaqueThemeTag: 'CLASSIC IVORY & GOLD',
        celebrationTag: 'THE WEDDING CELEBRATION & RESEPSI',
        archClass: 'rounded-t-[115px] rounded-b-[22px] border-2 border-[#DFBA73]',
        archTag: 'THE WEDDING CELEBRATION',
        heroCardBg: 'linear-gradient(180deg, #332B22 0%, #201A13 50%, #110D08 100%)',
        heroCardBorder: 'border-[#DFBA73]/60',
        heroArtwork: (
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="none">
            <rect width="200" height="280" fill="url(#ivoryBg)" />
            <defs>
              <linearGradient id="ivoryBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#241E17" />
                <stop offset="100%" stopColor="#0E0B08" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="115" r="50" fill="#FFE4A0" fillOpacity="0.2" />
            {/* Baroque Rococo Arch & Laurel Wreath */}
            <path d="M40,230 L40,90 Q100,30 160,90 L160,230" stroke="#DFBA73" strokeWidth="2" fill="none" />
            {/* Royal Gold Monogram Wax Seal in Center */}
            <circle cx="100" cy="115" r="32" fill="url(#sealGrad)" stroke="#FFE4A0" strokeWidth="2" />
            <defs>
              <linearGradient id="sealGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF4CC" />
                <stop offset="50%" stopColor="#DFBA73" />
                <stop offset="100%" stopColor="#8A6828" />
              </linearGradient>
            </defs>
            <text x="100" y="123" textAnchor="middle" fill="#241706" fontSize="22" fontFamily="serif" fontWeight="bold">R&W</text>
            {/* Laurel Leaves Garland */}
            <path d="M55,140 Q100,180 145,140" stroke="#DFBA73" strokeWidth="2" fill="none" strokeDasharray="4,4" />
          </svg>
        ),
        heroPatternSvg: (
          <svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="#DFBA73" strokeWidth="1" opacity="0.3">
            <circle cx="30" cy="30" r="16" />
            <circle cx="30" cy="30" r="6" />
          </svg>
        ),
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
            <path d="M5,5 Q55,5 55,55" stroke="#DFBA73" strokeWidth="2" />
            <path d="M5,5 Q5,55 55,55" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="25" cy="25" r="4" fill="#DFBA73" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <path d="M5,5 Q55,5 55,55" stroke="#DFBA73" strokeWidth="2" />
            <path d="M5,5 Q5,55 55,55" stroke="#DFBA73" strokeWidth="2" />
            <circle cx="25" cy="25" r="4" fill="#DFBA73" />
          </svg>
        ),
      };

    // 8. Sage Garden Botanical
    case 'sage-garden':
      return {
        name: 'Sage Garden Botanical',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(132, 204, 150, 0.18) 0%, transparent 65%), linear-gradient(to bottom, #234E35 0%, #153523 50%, #091A10 100%)',
        doorLabelLeft: 'BOTANICAL',
        doorLabelRight: 'GARDEN',
        sealSubtitle: 'EUCALYPTUS',
        plaqueThemeTag: 'SAGE GARDEN BOTANICAL',
        celebrationTag: 'INTIMATE GARDEN CELEBRATION',
        archClass: 'rounded-t-[100px] rounded-b-[18px] border-2 border-[#82D4A4]',
        archTag: 'BOTANICAL CELEBRATION',
        heroCardBg: 'linear-gradient(180deg, #1C3B2A 0%, #10241A 50%, #06120C 100%)',
        heroCardBorder: 'border-[#82D4A4]/50',
        heroArtwork: (
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="none">
            <rect width="200" height="280" fill="url(#sageBg)" />
            <defs>
              <linearGradient id="sageBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#122A1E" />
                <stop offset="100%" stopColor="#05100B" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="115" r="50" fill="#82D4A4" fillOpacity="0.18" />
            {/* Geometric Terrarium Diamond Arch */}
            <polygon points="100,45 160,115 100,185 40,115" stroke="#DFBA73" strokeWidth="2" fill="none" />
            {/* Lush Eucalyptus Branches & Foliage */}
            <path d="M40,180 Q80,120 100,80" stroke="#82D4A4" strokeWidth="2" fill="none" />
            <circle cx="65" cy="140" r="10" fill="#82D4A4" fillOpacity="0.6" />
            <circle cx="85" cy="110" r="9" fill="#82D4A4" fillOpacity="0.6" />
            <circle cx="100" cy="80" r="8" fill="#82D4A4" fillOpacity="0.6" />
            <path d="M160,180 Q120,120 100,80" stroke="#82D4A4" strokeWidth="2" fill="none" />
            <circle cx="135" cy="140" r="10" fill="#82D4A4" fillOpacity="0.6" />
            <circle cx="115" cy="110" r="9" fill="#82D4A4" fillOpacity="0.6" />
          </svg>
        ),
        heroPatternSvg: (
          <svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="#82D4A4" strokeWidth="1" opacity="0.3">
            <ellipse cx="30" cy="30" rx="15" ry="8" transform="rotate(30 30 30)" />
          </svg>
        ),
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#82D4A4" strokeWidth="1.8" className="w-full">
            <path d="M85,15 C45,45 25,85 25,130 C25,175 45,200 85,215" strokeWidth="2" />
            <path d="M45,70 Q70,55 65,80 Q45,85 45,70 Z" fill="#82D4A4" fillOpacity="0.5" />
            <path d="M45,120 Q70,105 65,130 Q45,135 45,120 Z" fill="#82D4A4" fillOpacity="0.5" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#82D4A4" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M20,50 Q50,15 80,50" />
            <circle cx="50" cy="35" r="12" fill="#82D4A4" fillOpacity="0.4" />
          </svg>
        ),
        cornerTopLeft: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <circle cx="30" cy="30" r="12" fill="#82D4A4" fillOpacity="0.7" />
            <circle cx="45" cy="45" r="8" fill="#82D4A4" fillOpacity="0.7" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <circle cx="30" cy="30" r="12" fill="#82D4A4" fillOpacity="0.7" />
            <circle cx="45" cy="45" r="8" fill="#82D4A4" fillOpacity="0.7" />
          </svg>
        ),
      };

    // 9. Romantic Rose Peony
    case 'romantic-rose':
      return {
        name: 'Romantic Rose Peony',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(244, 114, 182, 0.2) 0%, transparent 65%), linear-gradient(to bottom, #54192B 0%, #350E1A 50%, #17050A 100%)',
        doorLabelLeft: 'ROMANTIC',
        doorLabelRight: 'ROSE',
        sealSubtitle: 'PEONY BLUSH',
        plaqueThemeTag: 'ROMANTIC ROSE PEONY',
        celebrationTag: 'SWEET ROMANTIC EVENING',
        archClass: 'rounded-t-[100px] rounded-b-[20px] border-2 border-[#F472B6]',
        archTag: 'ROSES & PEONIES',
        heroCardBg: 'linear-gradient(180deg, #441724 0%, #290B14 50%, #140409 100%)',
        heroCardBorder: 'border-[#F48FB1]/60',
        heroArtwork: (
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="none">
            <rect width="200" height="280" fill="url(#roseBg)" />
            <defs>
              <linearGradient id="roseBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2E0A15" />
                <stop offset="100%" stopColor="#100206" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="115" r="55" fill="#F472B6" fillOpacity="0.2" />
            {/* Blooming Peony & Rose Petals */}
            <circle cx="100" cy="115" r="30" fill="#F472B6" fillOpacity="0.6" />
            <circle cx="100" cy="115" r="18" fill="#FB7185" fillOpacity="0.8" />
            <circle cx="100" cy="115" r="8" fill="#FFE4E6" />
            <path d="M80,85 Q100,65 120,85" stroke="#FFE4E6" strokeWidth="2" />
            <path d="M70,115 Q50,115 65,135" stroke="#FFE4E6" strokeWidth="2" />
            <path d="M130,115 Q150,115 135,135" stroke="#FFE4E6" strokeWidth="2" />
          </svg>
        ),
        heroPatternSvg: (
          <svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="#F472B6" strokeWidth="1" opacity="0.3">
            <circle cx="30" cy="30" r="14" />
            <circle cx="30" cy="30" r="6" />
          </svg>
        ),
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#F472B6" strokeWidth="1.8" className="w-full">
            <path d="M85,15 C45,45 25,85 25,130 C25,175 45,200 85,215" strokeWidth="2" />
            <circle cx="55" cy="80" r="14" fill="#F472B6" fillOpacity="0.4" />
            <circle cx="55" cy="140" r="14" fill="#F472B6" fillOpacity="0.4" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#F472B6" strokeWidth="2" className="w-20 h-14 mx-auto">
            <circle cx="50" cy="35" r="18" fill="#F472B6" fillOpacity="0.5" />
          </svg>
        ),
        cornerTopLeft: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <circle cx="35" cy="35" r="15" fill="#F472B6" fillOpacity="0.7" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <circle cx="35" cy="35" r="15" fill="#F472B6" fillOpacity="0.7" />
          </svg>
        ),
      };

    // 10. Madinah Arabesque Gold
    case 'islamic-arabesque':
      return {
        name: 'Madinah Arabesque Gold',
        doorBg: 'radial-gradient(circle at 50% 50%, rgba(223, 186, 115, 0.2) 0%, transparent 65%), linear-gradient(to bottom, #103D27 0%, #0A2417 50%, #04120B 100%)',
        doorLabelLeft: 'MADINAH',
        doorLabelRight: 'NABAWi',
        sealSubtitle: 'KUBAH EMAS',
        plaqueThemeTag: 'MADINAH ARABESQUE GOLD',
        celebrationTag: 'WALIMATUL \'URSY PENUH BERKAH',
        archClass: 'rounded-t-[100px] rounded-b-[18px] border-2 border-[#DFBA73]',
        archTag: 'KUBAH NABAWI & GIRIH',
        heroCardBg: 'linear-gradient(180deg, #0D3422 0%, #072215 50%, #03120A 100%)',
        heroCardBorder: 'border-[#DFBA73]/60',
        heroArtwork: (
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="none">
            <rect width="200" height="280" fill="url(#islamicBg)" />
            <defs>
              <linearGradient id="islamicBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#082216" />
                <stop offset="100%" stopColor="#020E08" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="115" r="55" fill="#DFBA73" fillOpacity="0.18" />
            {/* Grand Golden Mosque Dome & Minarets */}
            <path d="M100,50 Q135,90 140,130 L60,130 Q65,90 100,50 Z" fill="#DFBA73" fillOpacity="0.8" stroke="#FFE4A0" strokeWidth="2" />
            <line x1="100" y1="35" x2="100" y2="50" stroke="#FFE4A0" strokeWidth="2.5" />
            <circle cx="100" cy="32" r="4" fill="#FFE4A0" />
            {/* Andalusian 8-point Girih Star in Center */}
            <g transform="translate(100, 185) scale(0.9)">
              <rect x="-20" y="-20" width="40" height="40" stroke="#DFBA73" strokeWidth="2" fill="#FFE4A0" fillOpacity="0.25" />
              <rect x="-20" y="-20" width="40" height="40" stroke="#DFBA73" strokeWidth="2" fill="#FFE4A0" fillOpacity="0.25" transform="rotate(45)" />
              <circle cx="0" cy="0" r="8" fill="#DFBA73" />
            </g>
          </svg>
        ),
        heroPatternSvg: (
          <svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="#DFBA73" strokeWidth="1" opacity="0.3">
            <rect x="15" y="15" width="30" height="30" />
            <rect x="15" y="15" width="30" height="30" transform="rotate(45 30 30)" />
          </svg>
        ),
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#DFBA73" strokeWidth="1.8" className="w-full">
            <path d="M85,15 C45,35 25,80 25,130 C25,180 45,205 85,215" strokeWidth="2.2" />
            <polygon points="55,55 70,70 55,85 40,70" fill="#DFBA73" fillOpacity="0.5" />
            <polygon points="55,115 70,130 55,145 40,130" fill="#DFBA73" fillOpacity="0.5" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#DFBA73" strokeWidth="2" className="w-20 h-14 mx-auto">
            <rect x="35" y="15" width="30" height="30" stroke="#DFBA73" />
            <rect x="35" y="15" width="30" height="30" stroke="#DFBA73" transform="rotate(45 50 30)" />
          </svg>
        ),
        cornerTopLeft: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <rect x="10" y="10" width="30" height="30" stroke="#DFBA73" strokeWidth="1.5" />
            <rect x="10" y="10" width="30" height="30" stroke="#DFBA73" strokeWidth="1.5" transform="rotate(45 25 25)" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <rect x="10" y="10" width="30" height="30" stroke="#DFBA73" strokeWidth="1.5" />
            <rect x="10" y="10" width="30" height="30" stroke="#DFBA73" strokeWidth="1.5" transform="rotate(45 25 25)" />
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
        archTag: 'UNDER THE STARS & MOON',
        heroCardBg: 'linear-gradient(180deg, #101E38 0%, #091223 50%, #040810 100%)',
        heroCardBorder: 'border-[#DFBA73]/60',
        heroArtwork: (
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="none">
            <rect width="200" height="280" fill="url(#midnightBg)" />
            <defs>
              <linearGradient id="midnightBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B162C" />
                <stop offset="100%" stopColor="#030710" />
              </linearGradient>
            </defs>
            {/* Celestial Moon and Constellations */}
            <path d="M90,70 C115,75 130,98 126,128 C122,154 100,168 80,162 C106,154 114,122 102,98 C96,86 86,76 90,70 Z" fill="#FFE4A0" fillOpacity="0.9" />
            <polygon points="140,80 143,89 152,92 143,95 140,104 137,95 128,92 137,89" fill="#FFF" />
            <polygon points="65,110 67,116 73,118 67,120 65,126 63,120 57,118 63,116" fill="#FFE4A0" />
            <circle cx="100" cy="200" r="3" fill="#FFF" />
            <circle cx="125" cy="185" r="2.5" fill="#FFE4A0" />
            <circle cx="75" cy="190" r="2.5" fill="#FFE4A0" />
            <line x1="75" y1="190" x2="100" y2="200" stroke="#FFE4A0" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="100" y1="200" x2="125" y2="185" stroke="#FFE4A0" strokeWidth="1" strokeDasharray="3,3" />
          </svg>
        ),
        heroPatternSvg: (
          <svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="#FFE4A0" strokeWidth="1" opacity="0.35">
            <polygon points="30,10 32,25 45,30 32,35 30,50 28,35 15,30 28,25" />
          </svg>
        ),
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#FFE4A0" strokeWidth="1.8" className="w-full">
            <path d="M85,15 C45,35 25,80 25,130 C25,180 45,205 85,215" strokeWidth="2.2" />
            <polygon points="50,45 62,60 50,75 38,60" fill="#FFE4A0" fillOpacity="0.5" />
            <polygon points="50,125 62,140 50,155 38,140" fill="#FFE4A0" fillOpacity="0.5" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#FFE4A0" strokeWidth="2" className="w-20 h-14 mx-auto">
            <path d="M40,15 C52,18 60,30 58,45 C56,58 45,65 35,62 C48,58 52,42 46,30 C43,24 38,18 40,15 Z" fill="#FFE4A0" fillOpacity="0.8" />
          </svg>
        ),
        cornerTopLeft: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <circle cx="10" cy="10" r="3.5" fill="#FFF" />
            <circle cx="45" cy="25" r="4" fill="#FFE4A0" />
            <circle cx="65" cy="60" r="5" fill="#FFF" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <circle cx="10" cy="10" r="3.5" fill="#FFF" />
            <circle cx="45" cy="25" r="4" fill="#FFE4A0" />
            <circle cx="65" cy="60" r="5" fill="#FFF" />
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
        celebrationTag: 'CONTEMPORARY UNION',
        archClass: 'rounded-none border-2 border-white',
        archTag: 'CONTEMPORARY UNION',
        heroCardBg: 'linear-gradient(180deg, #222222 0%, #141414 50%, #0A0A0A 100%)',
        heroCardBorder: 'border-white/40',
        heroArtwork: (
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="none">
            <rect width="200" height="280" fill="#141414" />
            <rect x="25" y="30" width="150" height="220" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="25" y1="140" x2="175" y2="140" stroke="#DFBA73" strokeWidth="1" />
            <circle cx="85" cy="140" r="24" stroke="#FFF" strokeWidth="2" fill="none" />
            <circle cx="115" cy="140" r="24" stroke="#DFBA73" strokeWidth="2" fill="none" />
            <text x="100" y="80" textAnchor="middle" fill="#FFF" fontSize="13" fontFamily="sans-serif" letterSpacing="4">THE UNION</text>
            <text x="100" y="210" textAnchor="middle" fill="#DFBA73" fontSize="11" fontFamily="sans-serif" letterSpacing="3">VOLUME I</text>
          </svg>
        ),
        heroPatternSvg: (
          <svg viewBox="0 0 60 60" width="60" height="60" fill="none" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.15">
            <line x1="0" y1="0" x2="60" y2="60" />
            <line x1="60" y1="0" x2="0" y2="60" />
          </svg>
        ),
        doorSvg: (
          <svg viewBox="0 0 100 220" fill="none" stroke="#FFFFFF" strokeWidth="1.5" className="w-full">
            <rect x="25" y="20" width="60" height="180" stroke="#FFFFFF" strokeOpacity="0.7" />
            <line x1="40" y1="20" x2="40" y2="200" stroke="#FFFFFF" strokeOpacity="0.3" />
            <line x1="55" y1="20" x2="55" y2="200" stroke="#FFFFFF" strokeOpacity="0.3" />
            <line x1="70" y1="20" x2="70" y2="200" stroke="#FFFFFF" strokeOpacity="0.3" />
          </svg>
        ),
        heroEmblem: (
          <svg viewBox="0 0 100 70" fill="none" stroke="#FFFFFF" strokeWidth="1.5" className="w-20 h-14 mx-auto">
            <rect x="25" y="10" width="50" height="50" stroke="#FFFFFF" />
            <text x="50" y="28" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontFamily="sans-serif" letterSpacing="2">NO. 1</text>
            <text x="50" y="48" textAnchor="middle" fill="#DFBA73" fontSize="9" fontFamily="sans-serif" letterSpacing="1">ETERNAL</text>
          </svg>
        ),
        cornerTopLeft: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24">
            <line x1="10" y1="10" x2="60" y2="10" stroke="#FFF" strokeWidth="1.5" />
            <line x1="10" y1="10" x2="10" y2="60" stroke="#FFF" strokeWidth="1.5" />
          </svg>
        ),
        cornerTopRight: (
          <svg viewBox="0 0 100 100" fill="none" className="w-24 h-24 scale-x-[-1]">
            <line x1="10" y1="10" x2="60" y2="10" stroke="#FFF" strokeWidth="1.5" />
            <line x1="10" y1="10" x2="10" y2="60" stroke="#FFF" strokeWidth="1.5" />
          </svg>
        ),
      };
  }
}
