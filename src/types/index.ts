export interface Workspace {
  id: string;
  title: string;
  wedding_date: string;
  target_budget: number;
  target_savings: number;
  created_at: string;
}

export interface SavingsContribution {
 id: string; workspace_id: string; contributor_id: string; amount: number; contributed_on: string; notes: string; created_at?: string;
}
export interface WorkspaceEntitlement {
 workspace_id: string; feature: 'core' | 'lamaran' | 'honeymoon' | 'starter' | 'premium' | 'wedding_pro' | 'moodboard' | 'shared_savings'; verified_at: string; expires_at: string | null; revoked_at: string | null;
}

export type MemberRole = 'owner' | 'partner';

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: MemberRole;
  display_name: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  workspace_id: string;
  token: string;
  invited_email?: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
}

export type PaymentStatus = 'unpaid' | 'dp' | 'paid';

export interface BudgetItem {
  id: string;
  workspace_id: string;
  category: string;
  title: string;
  allocated_amount: number;
  spent_amount: number;
  payment_status: PaymentStatus;
  notes?: string;
}

export type TaskPhase = 
  | 'H-6 Bulan' 
  | 'H-3 Bulan' 
  | 'H-1 Bulan' 
  | 'H-1 Minggu' 
  | 'Hari H' 
  | 'Dokumen KUA';

export type TaskPIC = 'groom' | 'bride' | 'both';

export interface TaskItem {
  id: string;
  workspace_id: string;
  title: string;
  phase: TaskPhase;
  pic: TaskPIC;
  is_completed: boolean;
  due_date?: string;
}

export type GuestCategory = 
  | 'keluarga_pria' 
  | 'keluarga_wanita' 
  | 'teman_kantor' 
  | 'sahabat' 
  | 'vip' 
  | 'lainnya';

export type RSVPStatus = 'uncontacted' | 'sent' | 'attending' | 'declined';

export interface GuestItem {
  id: string;
  workspace_id: string;
  name: string;
  category: GuestCategory;
  pax: number;
  phone?: string;
  rsvp_status: RSVPStatus;
  notes?: string;
}

export type InvitationTheme = 
  | 'classic-ivory' 
  | 'sage-garden' 
  | 'romantic-rose' 
  | 'midnight-gold'
  | 'jawa-keraton'
  | 'bugis-pinisi'
  | 'minang-songket'
  | 'bali-dewata'
  | 'sunda-siger'
  | 'batak-gorga'
  | 'islamic-arabesque'
  | 'monochrome-editorial';

export interface WeddingInvitation {
  id: string;
  workspace_id: string;
  slug: string;
  is_published: boolean;
  theme: InvitationTheme;
  quote_title?: string;
  quote_body?: string;
  groom_full_name: string;
  groom_nickname: string;
  groom_parents?: string;
  bride_full_name: string;
  bride_nickname: string;
  bride_parents?: string;
  akad_date?: string;
  akad_time?: string;
  akad_venue?: string;
  akad_address?: string;
  akad_maps_url?: string;
  resepsi_date?: string;
  resepsi_time?: string;
  resepsi_venue?: string;
  resepsi_address?: string;
  resepsi_maps_url?: string;
  gift_bank_name?: string;
  gift_account_number?: string;
  gift_account_holder?: string;
  gift_address?: string;
  music_url?: string;
  cover_photo_url?: string;
  groom_instagram?: string;
  bride_instagram?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InvitationWish {
  id: string;
  invitation_id: string;
  guest_name: string;
  attendance: 'attending' | 'not_attending' | 'tentative';
  pax: number;
  message: string;
  created_at: string;
}

export type RundownSession = 'persiapan' | 'akad' | 'temu_manten' | 'resepsi' | 'after_party' | 'lainnya';

export interface RundownEvent {
  id: string;
  workspace_id: string;
  session: RundownSession;
  time_start: string;
  time_end?: string | null;
  activity: string;
  pic_name?: string | null;
  pic_phone?: string | null;
  location?: string | null;
  notes?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export type MoodboardCategory = 'dekorasi' | 'busana_pengantin' | 'rias_makeup' | 'bunga_handbouquet' | 'foto_video' | 'undangan_souvenir' | 'kue_catering' | 'lainnya';

export interface ColorPalette {
  id: string;
  workspace_id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  neutral_color: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MoodboardItem {
  id: string;
  workspace_id: string;
  category: MoodboardCategory;
  title: string;
  image_url: string;
  color_hex?: string | null;
  notes?: string | null;
  source_link?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export type HoneymoonExpenseCategory = 'transportasi' | 'hotel_resort' | 'kuliner' | 'wisata' | 'belanja_souvenir' | 'lainnya';

export interface HoneymoonTrip {
  id: string;
  workspace_id: string;
  destination: string;
  start_date?: string | null;
  end_date?: string | null;
  target_budget: number;
  hotel_name?: string | null;
  booking_code?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HoneymoonExpense {
  id: string;
  workspace_id: string;
  category: HoneymoonExpenseCategory;
  title: string;
  allocated_amount: number;
  spent_amount: number;
  payment_status: 'unpaid' | 'dp' | 'paid';
  booking_reference?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HoneymoonItinerary {
  id: string;
  workspace_id: string;
  day_number: number;
  time_start?: string | null;
  activity: string;
  location?: string | null;
  notes?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export type EngagementGiftCategory =
  | 'cincin'
  | 'ibadah'
  | 'perhiasan'
  | 'busana'
  | 'makeup_skincare'
  | 'sepatu_tas'
  | 'makanan_buah'
  | 'lainnya';

export type EngagementGiftDirection = 'groom_to_bride' | 'bride_to_groom';
export type EngagementGiftStatus = 'planned' | 'purchased' | 'decorating' | 'ready';

export interface EngagementEvent {
  id: string;
  workspace_id: string;
  event_date?: string | null;
  event_time?: string | null;
  venue_name: string;
  venue_address?: string | null;
  spokesperson_groom?: string | null;
  spokesperson_bride?: string | null;
  target_budget: number;
  guest_count?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EngagementGift {
  id: string;
  workspace_id: string;
  direction: EngagementGiftDirection;
  box_number: number;
  title: string;
  category: EngagementGiftCategory;
  status: EngagementGiftStatus;
  estimated_cost: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EngagementRundown {
  id: string;
  workspace_id: string;
  time_start: string;
  time_end?: string | null;
  activity: string;
  pic_name?: string | null;
  notes?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}
