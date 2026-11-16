import { ColorPalette, MoodboardItem } from '@/types';

export interface PresetPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  description: string;
}

export const PRESET_PALETTES: PresetPalette[] = [
  {
    name: 'Earthy Terracotta & Sage',
    primary: '#C86D51',
    secondary: '#7D8D78',
    accent: '#E6D5B8',
    neutral: '#FDFBF7',
    description: 'Nuansa hangat alam, rustic garden, dan daun eucalyptus yang menenangkan.',
  },
  {
    name: 'Classic Burgundy & Rose Gold',
    primary: '#722F37',
    secondary: '#B76E79',
    accent: '#E2BCA4',
    neutral: '#FAFAF9',
    description: 'Mewah, elegan, dan romantis dengan kombinasi merah anggur dan kilau mawar.',
  },
  {
    name: 'Emerald Forest & Champagne Gold',
    primary: '#1B4D3E',
    secondary: '#C5A059',
    accent: '#E8DFC8',
    neutral: '#F8F9FA',
    description: 'Kemegahan ballroom modern dengan warna hijau zamrud dan aksen emas pesta.',
  },
  {
    name: 'Dusty Blue & Pure White',
    primary: '#6B8E9B',
    secondary: '#A5B8C0',
    accent: '#D4DFE2',
    neutral: '#FFFFFF',
    description: 'Kesan anggun, sejuk, dan syahdu ala tema pernikahan modern minimalist.',
  },
  {
    name: 'Rustic Lavender & Soft Lilac',
    primary: '#735DA5',
    secondary: '#B9A7D0',
    accent: '#EAE4F2',
    neutral: '#FAF8FC',
    description: 'Sentuhan manis feminin dengan aroma lavender lembut untuk pesta semi-outdoor.',
  },
];

export function getStarterMoodboardInspirations(): Omit<MoodboardItem, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>[] {
  return [
    {
      category: 'dekorasi',
      title: 'Pelaminan Minimalis Lengkung Semi-Outdoor',
      image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      color_hex: '#C86D51',
      notes: 'Lengkungan kayu natural dengan untaian bunga mawar peach, pampas grass, dan lilin ambient warm.',
      source_link: 'https://unsplash.com',
      sort_order: 1,
    },
    {
      category: 'busana_pengantin',
      title: 'Kebaya Modern Payet Mutiara Broken White',
      image_url: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=800&q=80',
      color_hex: '#E6D5B8',
      notes: 'Bahan brokat chantilly berpayet halus dengan ekor selendang tule menjuntai.',
      source_link: 'https://unsplash.com',
      sort_order: 2,
    },
    {
      category: 'bunga_handbouquet',
      title: 'Hand Bouquet Mawar Garden & Daun Sage',
      image_url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
      color_hex: '#7D8D78',
      notes: 'Kombinasi mawar putih mekar, baby breath, dan pita sutra bertepi raw edge.',
      source_link: 'https://unsplash.com',
      sort_order: 3,
    },
    {
      category: 'rias_makeup',
      title: 'Flawless Soft Glam Makeup Look',
      image_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
      color_hex: '#B76E79',
      notes: 'Complexion glowing satin finish, eyeshadow peach lembut, dan ombre lips glossy nude.',
      source_link: 'https://unsplash.com',
      sort_order: 4,
    },
    {
      category: 'undangan_souvenir',
      title: 'Stationery Undangan Kertas Daur Ulang & Wax Seal',
      image_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
      color_hex: '#C5A059',
      notes: 'Kertas deckle edge buatan tangan dengan cap lilin emas dan benang goni.',
      source_link: 'https://unsplash.com',
      sort_order: 5,
    },
    {
      category: 'kue_catering',
      title: 'Wedding Cake 3 Tier Rustic Floral',
      image_url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80',
      color_hex: '#FDFBF7',
      notes: 'Semi-naked vanilla buttercream cake dihiasi bunga mawar segar dan daun eucalyptus.',
      source_link: 'https://unsplash.com',
      sort_order: 6,
    },
  ];
}
