export interface Workspace {
  id: string;
  title: string;
  wedding_date: string;
  target_budget: number;
  target_savings: number;
  created_at: string;
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
