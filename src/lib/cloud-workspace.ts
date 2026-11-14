import type { SupabaseClient } from '@supabase/supabase-js';
import type { Workspace, BudgetItem, TaskItem, GuestItem, WorkspaceMember, SavingsContribution, WorkspaceEntitlement } from '@/types';
type Table = 'budgets' | 'tasks' | 'guests' | 'savings_contributions';
export interface WorkspaceParams { groom_name: string; bride_name: string; wedding_date: string; target_budget: number; target_savings: number }
export interface CloudSnapshot { workspace: Workspace | null; budgets: BudgetItem[]; tasks: TaskItem[]; guests: GuestItem[]; members: WorkspaceMember[]; savings: SavingsContribution[]; entitlements: WorkspaceEntitlement[]; developerTestAccess: boolean }
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
  if (!workspace) return {workspace:null,budgets:[],tasks:[],guests:[],members:[],savings:[],entitlements:[],developerTestAccess:false};
  const [budgets,tasks,guests,members,savings,entitlements] = await Promise.all(['budgets','tasks','guests','workspace_members','savings_contributions','workspace_entitlements'].map(table=>this.db.from(table).select('*').eq('workspace_id',workspace.id).order(table==='workspace_entitlements'?'verified_at':'created_at',{ascending:true})));
  const testAccess=checked(await this.db.rpc('has_developer_test_access',{p_workspace_id:workspace.id}));
  return {developerTestAccess:testAccess===true,workspace,budgets:checked(budgets) || [],tasks:checked(tasks) || [],guests:checked(guests) || [],members:checked(members) || [],savings:checked(savings) || [],entitlements:checked(entitlements) || []};
 }
 async create(params: WorkspaceParams) {
  await this.requireUser();
  if (!params.groom_name.trim() || !params.bride_name.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(params.wedding_date) || ![params.target_budget,params.target_savings].every(n=>Number.isSafeInteger(n)&&n>=0)) throw new Error('Nama, tanggal, dan target anggaran harus valid.');
  const id = checked(await this.db.rpc('create_workspace',{p_title:`Pernikahan ${params.groom_name} & ${params.bride_name}`,p_wedding_date:params.wedding_date}));
  // RPC is atomic for workspace + owner. Metadata is a separate authorized update.
  checked(await this.db.from('workspaces').update(params).eq('id',id).select('id').single());
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
 async edit(table: 'budgets' | 'tasks', workspaceId: string, id: string, item: Record<string,unknown>, original: Record<string,unknown>, userId: string) {
  const user=await this.requireUser();
  if(user.id!==userId)throw new Error('Identitas berubah. Buka ulang editor.');
  const dirty=Object.fromEntries(Object.entries(clean(table,item)).filter(([key,value])=>value!==original[key]));
  if(!Object.keys(dirty).length)return;
  const compared={...dirty};
  if(table==='budgets' && ['allocated_amount','spent_amount','payment_status'].some(k=>k in dirty)) {
   for(const key of ['allocated_amount','spent_amount','payment_status'])compared[key]=original[key];
   const merged={...original,...dirty};
   const allocated=Number(merged.allocated_amount),spent=Number(merged.spent_amount);
   if(!Number.isSafeInteger(allocated)||!Number.isSafeInteger(spent)||allocated<0||spent<0 || (merged.payment_status==='unpaid' && spent!==0) || (merged.payment_status==='dp' && (spent<=0 || spent>=allocated)) || (merged.payment_status==='paid' && spent!==allocated))throw new Error('Jumlah dan status pembayaran tidak sesuai.');
  }
  let query=this.db.from(table).update(dirty).eq('workspace_id',workspaceId).eq('id',id);
  for(const key of Object.keys(compared))query=original[key]===null?query.is(key,null):query.eq(key,original[key]);
  const result=await query.select('*').single();
  if(result.error || !result.data)throw new Error('Data berubah atau penyimpanan gagal. Input tetap disimpan; muat ulang dan buka editor untuk membandingkan.');
  return result.data;
 }
 async remove(table: Table, workspaceId: string, id: string) {
  await this.requireUser();
  const rows = checked(await this.db.from(table).delete().eq('workspace_id',workspaceId).eq('id',id).select('id'));
  if (!rows?.length) throw new Error('Data tidak ditemukan atau akses telah berubah. Muat ulang workspace.');
 }
 async applyEditableStarter(workspaceId: string, userId?: string) {
  const user=await this.requireUser();
  if(userId && user.id!==userId)throw new Error('Identitas berubah. Buka ulang pratinjau.');
  const result=await this.db.rpc('apply_editable_starter_v1',{p_workspace_id:workspaceId,p_confirmation:'TAMBAH TEMPLATE'});
  if(result.error)throw new Error('Template belum tersedia atau belum dapat dikonfirmasi. Pastikan Anda owner dan layanan template sudah dipasang; muat ulang sebelum mencoba lagi.');
  return result.data;
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
