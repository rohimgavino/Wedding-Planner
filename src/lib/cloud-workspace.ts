import type { SupabaseClient } from '@supabase/supabase-js';
import type { Workspace, BudgetItem, TaskItem, GuestItem, WorkspaceMember, SavingsContribution, Vendor, VendorInstallment, VendorPayment } from '@/types';
export type Table = 'budgets' | 'tasks' | 'guests' | 'savings_contributions' | 'vendors' | 'vendor_installments' | 'vendor_payments';
export interface WorkspaceParams { groom_name: string; bride_name: string; wedding_date: string; target_budget: number; target_savings: number }
export interface CloudSnapshot { workspace: Workspace | null; budgets: BudgetItem[]; tasks: TaskItem[]; guests: GuestItem[]; members: WorkspaceMember[]; savings: SavingsContribution[]; vendors: Vendor[]; installments: VendorInstallment[]; payments: VendorPayment[] }
const fields: Record<Table, string[]> = {
 vendors: ['name','contact_name','contact_phone','contract_notes','contract_total'],
 vendor_installments: ['vendor_id','title','amount','due_date'],
 vendor_payments: ['installment_id','amount','paid_on','notes'],
 savings_contributions: ['contributor_id','amount','contributed_on','notes'],
 budgets: ['category','title','allocated_amount','spent_amount','payment_status','notes'],
 tasks: ['title','phase','pic','is_completed','due_date','notes'],
 guests: ['name','category','pax','phone','rsvp_status','notes'],
};
function clean(table: Table, item: Record<string, unknown>) {
 if (['vendors','vendor_installments','vendor_payments'].includes(table)) {
  for (const key of ['contract_total','amount']) if (item[key]!==undefined && (!Number.isSafeInteger(item[key]) || Number(item[key])<(key==='contract_total'?0:1))) throw new Error('Jumlah Rupiah tidak valid.');
  for (const key of ['due_date','paid_on']) if (item[key]!==undefined) {
   const value=String(item[key]), date=new Date(value+'T00:00:00Z');
   if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==value || value<'1900-01-01') throw new Error('Tanggal tidak valid.');
  }
 }
 return Object.fromEntries(Object.entries(item).filter(([key,value])=>fields[table].includes(key) && value !== undefined)); }
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
  if (!workspace) return {workspace:null,budgets:[],tasks:[],guests:[],members:[],savings:[],vendors:[],installments:[],payments:[]};
  const [budgets,tasks,guests,members,savings,vendors,installments,payments] = await Promise.all(['budgets','tasks','guests','workspace_members','savings_contributions','vendors','vendor_installments','vendor_payments'].map(table=>this.db.from(table).select('*').eq('workspace_id',workspace.id).order('created_at',{ascending:true})));
  return {workspace,budgets:checked(budgets) || [],tasks:checked(tasks) || [],guests:checked(guests) || [],members:checked(members) || [],savings:checked(savings) || [],vendors:checked(vendors) || [],installments:checked(installments) || [],payments:checked(payments) || []};
 }
 async create(params: WorkspaceParams) {
  await this.requireUser();
  if (!params.groom_name.trim() || !params.bride_name.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(params.wedding_date) || ![params.target_budget,params.target_savings].every(n=>Number.isSafeInteger(n)&&n>=0)) throw new Error('Nama, tanggal, dan target anggaran harus valid.');
  const key = 'everrae:starter-create-request:' + (await this.requireUser()).id;
  let requestId = sessionStorage.getItem(key);
  if (!requestId) { requestId = crypto.randomUUID(); sessionStorage.setItem(key, requestId); }
  const id = checked(await this.db.rpc('create_starter_workspace',{p_request_id:requestId,p_groom_name:params.groom_name,p_bride_name:params.bride_name,p_wedding_date:params.wedding_date,p_target_budget:params.target_budget,p_target_savings:params.target_savings}));
  sessionStorage.removeItem(key);
  return id as string;
 }
 async saveWhatsAppTemplate(workspaceId: string, template: NonNullable<Workspace['wa_template']>) {
  await this.requireUser();
  return checked(await this.db.from('workspaces').update({wa_template:template}).eq('id',workspaceId).select('id').single());
 }
 async applyStarterTemplate(workspaceId: string) {
  await this.requireUser();
  return checked(await this.db.rpc('use_starter_template',{p_workspace_id:workspaceId}));
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
