import type { SupabaseClient } from '@supabase/supabase-js';
import type { Workspace, BudgetItem, TaskItem, GuestItem, WorkspaceMember, SavingsContribution } from '@/types';
type Table = 'budgets' | 'tasks' | 'guests' | 'savings_contributions';
export interface WorkspaceParams { groom_name: string; bride_name: string; wedding_date: string; target_budget: number; target_savings: number }
export interface CloudSnapshot { workspace: Workspace | null; budgets: BudgetItem[]; tasks: TaskItem[]; guests: GuestItem[]; members: WorkspaceMember[]; savings: SavingsContribution[] }
const fields: Record<Table, string[]> = {
 savings_contributions: ['contributor_id','amount','contributed_on','notes'],
 budgets: ['category','title','allocated_amount','spent_amount','payment_status','notes'],
 tasks: ['title','phase','pic','is_completed','due_date','notes'],
 guests: ['name','category','pax','phone','rsvp_status','notes'],
};
function clean(table: Table, item: Record<string, unknown>) { return Object.fromEntries(Object.entries(item).filter(([key,value])=>fields[table].includes(key) && value !== undefined)); }
function checked<T>(result: {data:T;error:unknown}): T { if (result.error) throw new Error('Operasi cloud gagal. Periksa koneksi dan konfigurasi database, lalu coba lagi.'); return result.data; }
export class CloudWorkspace {
 constructor(private db: SupabaseClient) {}
 private async requireUser() { const {data,error} = await this.db.auth.getUser(); if (error || !data.user) throw new Error('Login diperlukan. Silakan masuk kembali.'); return data.user; }
 async load(id?: string): Promise<CloudSnapshot> {
  await this.requireUser();
  let query = this.db.from('workspaces').select('*').order('created_at',{ascending:false}).limit(1);
  if (id) query = query.eq('id',id);
  const rows = checked(await query) as Workspace[];
  const workspace = rows[0] || null;
  if (!workspace) return {workspace:null,budgets:[],tasks:[],guests:[],members:[],savings:[]};
  const [budgets,tasks,guests,members,savings] = await Promise.all(['budgets','tasks','guests','workspace_members','savings_contributions'].map(table=>this.db.from(table).select('*').eq('workspace_id',workspace.id).order('created_at',{ascending:true})));
  return {workspace,budgets:checked(budgets) || [],tasks:checked(tasks) || [],guests:checked(guests) || [],members:checked(members) || [],savings:checked(savings) || []};
 }
 async create(params: WorkspaceParams) {
  await this.requireUser();
  if (!params.groom_name.trim() || !params.bride_name.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(params.wedding_date) || ![params.target_budget,params.target_savings].every(n=>Number.isSafeInteger(n)&&n>=0)) throw new Error('Nama, tanggal, dan target anggaran harus valid.');
  const id = checked(await this.db.rpc('create_workspace',{p_title:`Pernikahan ${params.groom_name} & ${params.bride_name}`,p_wedding_date:params.wedding_date}));
  // RPC is atomic for workspace + owner. Metadata is a separate authorized update.
  checked(await this.db.from('workspaces').update(params).eq('id',id).select('id').single());

  // Auto-seed template bawaan (contoh pengisian aktif) agar user langsung paham
  try {
    const defaultBudgets = [
      { category: "Venue & Gedung", title: "Sewa Gedung Resepsi", allocated: 25000000, actual_paid: 0 },
      { category: "Katering", title: "Paket Katering 500 Pax", allocated: 35000000, actual_paid: 0 },
      { category: "Rias & Busana", title: "MUA Akad & Resepsi + Sewa Gaun/Jas", allocated: 10000000, actual_paid: 0 },
      { category: "Dekorasi", title: "Dekorasi Pelaminan & Lorong Masuk", allocated: 12000000, actual_paid: 0 },
      { category: "Dokumentasi", title: "Foto & Video Cinematic Hari H", allocated: 7500000, actual_paid: 0 },
      { category: "Undangan & Souvenir", title: "Cetak Undangan Fisik & 300 Souvenir", allocated: 3500000, actual_paid: 0 },
      { category: "Mahar & Seserahan", title: "Perlengkapan Mahar & Kotak Seserahan", allocated: 5000000, actual_paid: 0 },
      { category: "Dana Darurat", title: "Cadangan Biaya Tak Terduga", allocated: 4000000, actual_paid: 0 }
    ];
    const defaultTasks = [
      { title: "Minta Surat Pengantar RT/RW untuk Nikah", phase: "Dokumen KUA", pic: "both", is_completed: false, notes: "Bawa KTP dan KK asli serta fotokopi." },
      { title: "Urus Surat Model N1, N2, dan N4 di Kelurahan", phase: "Dokumen KUA", pic: "both", is_completed: false, notes: "Surat pengantar kelurahan menuju KUA setempat." },
      { title: "Cek Kesehatan & Imunisasi TT di Puskesmas", phase: "Dokumen KUA", pic: "bride", is_completed: false, notes: "Sertifikat layak kawin (Elsimil / Puskesmas)." },
      { title: "Pertemuan Keluarga & Kesepakatan Tanggal", phase: "H-6 Bulan", pic: "both", is_completed: false },
      { title: "Survey & Booking Gedung / Lokasi Acara", phase: "H-6 Bulan", pic: "both", is_completed: false },
      { title: "Test Food & Booking Katering", phase: "H-6 Bulan", pic: "both", is_completed: false },
      { title: "Booking MUA & Pilihan Busana Pengantin", phase: "H-3 Bulan", pic: "bride", is_completed: false },
      { title: "Booking Fotografer & Tim Video", phase: "H-3 Bulan", pic: "groom", is_completed: false }
    ];
    const defaultGuests = [
      { name: "Keluarga Besar Pihak Pria", count_pax: 20, is_rsvp_sent: false, rsvp_status: "attending", contact_phone: "" },
      { name: "Keluarga Besar Pihak Wanita", count_pax: 20, is_rsvp_sent: false, rsvp_status: "attending", contact_phone: "" },
      { name: "Teman Kerja & Sahabat", count_pax: 10, is_rsvp_sent: false, rsvp_status: "pending", contact_phone: "" }
    ];

    await Promise.allSettled([
      this.db.from('budgets').insert(defaultBudgets.map(b => ({ ...b, workspace_id: id }))),
      this.db.from('tasks').insert(defaultTasks.map(t => ({ ...t, workspace_id: id }))),
      this.db.from('guests').insert(defaultGuests.map(g => ({ ...g, workspace_id: id })))
    ]);
  } catch (err) {
    console.warn('Gagal inject template bawaan:', err);
  }

  return id as string;
 }
 async insert(table: Table, workspaceId: string, item: Record<string,unknown>) {
  await this.requireUser();
  return checked(await this.db.from(table).insert({...clean(table,item),workspace_id:workspaceId}).select('*').single());
 }
 async insertGuests(workspaceId: string, items: Record<string,unknown>[]) {
  await this.requireUser();
  return checked(await this.db.from('guests').insert(items.map(item=>({...clean('guests',item),workspace_id:workspaceId}))).select('*')) as GuestItem[];
 }
 async update(table: Table, workspaceId: string, id: string, item: Record<string,unknown>) {
  await this.requireUser();
  return checked(await this.db.from(table).update(clean(table,item)).eq('workspace_id',workspaceId).eq('id',id).select('*').single());
 }
 async remove(table: Table, workspaceId: string, id: string) {
  await this.requireUser();
  const rows = checked(await this.db.from(table).delete().eq('workspace_id',workspaceId).eq('id',id).select('id'));
  if (!rows?.length) throw new Error('Data tidak ditemukan atau akses telah berubah. Muat ulang workspace.');
 }
 async resetPlanningContent(workspaceId: string, confirmation: string) {
  if (confirmation !== 'RESET RENCANA') throw new Error('Ketik konfirmasi RESET RENCANA dengan tepat.');
  await this.requireUser();
  const result = await this.db.rpc('reset_planning_content',{p_workspace_id:workspaceId,p_confirmation:confirmation});
  if (result.error) throw new Error('Reset belum berhasil dikonfirmasi. Pastikan Anda owner, koneksi tersedia, dan migration reset sudah diterapkan. Muat ulang sebelum mencoba lagi.');
  return result.data;
 }
 async issue(workspaceId: string) {
  await this.requireUser();
  const token = checked(await this.db.rpc('create_partner_invitation',{p_workspace_id:workspaceId}));
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new Error('Undangan tidak valid.');
  return token;
 }
 async accept(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Undangan tidak valid atau kedaluwarsa.');
  await this.requireUser();
  return checked(await this.db.rpc('accept_partner_invitation',{p_token:token})) as string;
 }
}
