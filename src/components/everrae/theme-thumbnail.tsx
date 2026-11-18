/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { InvitationTheme } from '@/types';
import { getInvitationThemeConfig } from './invitation-theme-config';

interface ThemeCardThumbnailProps {
  themeId: InvitationTheme;
  slug?: string;
}

export function ThemeCardThumbnail({ themeId, slug = 'rohim-wiwit' }: ThemeCardThumbnailProps) {
  const config = getInvitationThemeConfig(themeId);

  // Background gradient per theme
  const bgGradients: Record<InvitationTheme, string> = {
    'bugis-pinisi': 'radial-gradient(circle at 50% 30%, #173830 0%, #0E241E 50%, #071310 100%)',
    'jawa-keraton': 'radial-gradient(circle at 50% 30%, #2B1D14 0%, #1A1009 50%, #0C0704 100%)',
    'minang-songket': 'radial-gradient(circle at 50% 30%, #541120 0%, #300610 50%, #150207 100%)',
    'bali-dewata': 'radial-gradient(circle at 50% 30%, #2A251D 0%, #171410 50%, #0A0907 100%)',
    'sunda-siger': 'radial-gradient(circle at 50% 30%, #1A3A2D 0%, #0E241A 50%, #06120C 100%)',
    'batak-gorga': 'radial-gradient(circle at 50% 30%, #3D1212 0%, #220808 50%, #100303 100%)',
    'islamic-arabesque': 'radial-gradient(circle at 50% 30%, #103828 0%, #092116 50%, #04120B 100%)',
    'classic-ivory': 'radial-gradient(circle at 50% 30%, #332B22 0%, #1D1812 50%, #0D0A07 100%)',
    'sage-garden': 'radial-gradient(circle at 50% 30%, #283C30 0%, #15241B 50%, #0A140E 100%)',
    'romantic-rose': 'radial-gradient(circle at 50% 30%, #441724 0%, #290B14 50%, #140409 100%)',
    'midnight-gold': 'radial-gradient(circle at 50% 30%, #0D2042 0%, #071024 50%, #02050D 100%)',
    'monochrome-editorial': 'radial-gradient(circle at 50% 30%, #242424 0%, #141414 50%, #080808 100%)',
  };

  return (
    <Link
      href={`/u/${slug || 'rohim-wiwit'}?preview=true&theme=${themeId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative w-full h-44 rounded-xl overflow-hidden border border-slate-700/30 shadow-inner group block select-none ${config.bodyClass}`}
      style={{ background: bgGradients[themeId] || bgGradients['bali-dewata'] }}
      title={`Klik untuk pratinjau live tema ${config.name}`}
    >
      {/* Background pattern layer */}
      <div className="bg-pattern-layer" aria-hidden="true" />

      {/* Miniature Top Corner Ornaments */}
      <div className="absolute inset-0 pointer-events-none opacity-50 overflow-hidden" aria-hidden="true">
        <div className="scale-50 origin-top-left absolute top-1 left-1">
          {config.cornerTopLeft}
        </div>
        <div className="scale-50 origin-top-right absolute top-1 right-1">
          {config.cornerTopRight}
        </div>
      </div>

      {/* Miniature Door Accents / Framing */}
      <div className="absolute inset-x-2 top-2 bottom-2 border border-[#DFBA73]/30 rounded-lg pointer-events-none flex items-center justify-between px-1">
        <div className="w-8 opacity-35 scale-75 origin-left">
          {config.doorSvg}
        </div>
        <div className="w-8 opacity-35 scale-75 origin-right transform scale-x-[-1]">
          {config.doorSvg}
        </div>
      </div>

      {/* Center Hero: Cultural Emblem + Miniature Arch Photo */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-2 text-center">
        {/* Cultural Emblem */}
        <div className="w-12 h-7 scale-90 mb-1 drop-shadow-md">
          {config.heroEmblem}
        </div>

        {/* Arch Photo Frame */}
        <div className={`w-20 h-24 relative overflow-hidden shadow-lg p-0.5 bg-gradient-to-tr from-[#FFE4A0] via-[#DFBA73] to-[#9E7A3E] ${config.archClass}`}>
          <div className="w-full h-full relative overflow-hidden bg-black/80 rounded-[inherit]">
            <img 
              src="/images/wedding-flowers.jpg" 
              alt={config.name}
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-x-0 bottom-0 py-0.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent text-center">
              <span className="text-[7px] uppercase font-bold text-[#FFE4A0] tracking-wider block truncate px-1">
                {config.sealSubtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Small Wax Seal floating badge */}
        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-gradient-to-tr from-[#FFE4A0] via-[#DFBA73] to-[#8A6828] border border-white/70 shadow-md flex flex-col items-center justify-center text-[#261706] text-[7px] font-black font-serif leading-none">
          R&W
        </div>
      </div>

      {/* Hover Overlay with Preview Icon */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
        <span className="px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-1.5 group-hover:translate-y-0 transition-transform">
          <Eye size={13} />
          Pratinjau Desain
        </span>
      </div>
    </Link>
  );
}
