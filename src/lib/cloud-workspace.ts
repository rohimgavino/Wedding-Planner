import type { SupabaseClient } from '@supabase/supabase-js';
import type { Workspace, BudgetItem, TaskItem, GuestItem, WorkspaceMember, SavingsContribution, WorkspaceEntitlement, WeddingInvitation, InvitationWish, RundownEvent, MoodboardItem, ColorPalette, HoneymoonTrip, HoneymoonExpense, HoneymoonItinerary } from '@/types';
type Table = 'budgets' | 'tasks' | 'guests' | 'savings_contributions';
export interface WorkspaceParams { groom_name: string; bride_name: string; wedding_date: string; target_budget: number; target_savings: number }
export interface CloudSnapshot { workspace: Workspace | null; budgets: BudgetItem[]; tasks: TaskItem[]; guests: GuestItem[]; members: WorkspaceMember[]; savings: SavingsContribution[]; entitlements: WorkspaceEntitlement[]; invitation: WeddingInvitation | null; wishes: InvitationWish[]; rundowns: RundownEvent[]; palette: ColorPalette | null; moodboards: MoodboardItem[]; honeymoonTrip: HoneymoonTrip | null; honeymoonExpenses: HoneymoonExpense[]; honeymoonItineraries: HoneymoonItinerary[]; developerTestAccess: boolean }
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
  if (!workspace) return {workspace:null,budgets:[],tasks:[],guests:[],members:[],savings:[],entitlements:[],invitation:null,wishes:[],rundowns:[],palette:null,moodboards:[],honeymoonTrip:null,honeymoonExpenses:[],honeymoonItineraries:[],developerTestAccess:false};
  const [budgets,tasks,guests,members,savings,entitlements,invitationsRes,rundownsRes,paletteRes,moodboardsRes,honeymoonTripRes,honeymoonExpRes,honeymoonItinRes] = await Promise.all([
    ...['budgets','tasks','guests','workspace_members','savings_contributions','workspace_entitlements'].map(table=>this.db.from(table).select('*').eq('workspace_id',workspace.id).order(table==='workspace_entitlements'?'verified_at':'created_at',{ascending:true})),
    this.db.from('wedding_invitations').select('*').eq('workspace_id',workspace.id).maybeSingle(),
    this.db.from('wedding_rundown_events').select('*').eq('workspace_id',workspace.id).order('sort_order',{ascending:true}).order('time_start',{ascending:true}),
    this.db.from('wedding_color_palettes').select('*').eq('workspace_id',workspace.id).maybeSingle(),
    this.db.from('wedding_moodboard_items').select('*').eq('workspace_id',workspace.id).order('sort_order',{ascending:true}),
    this.db.from('wedding_honeymoon_trips').select('*').eq('workspace_id',workspace.id).maybeSingle(),
    this.db.from('wedding_honeymoon_expenses').select('*').eq('workspace_id',workspace.id).order('created_at',{ascending:true}),
    this.db.from('wedding_honeymoon_itineraries').select('*').eq('workspace_id',workspace.id).order('day_number',{ascending:true}).order('sort_order',{ascending:true})
  ]);
  const testAccess=checked(await this.db.rpc('has_developer_test_access',{p_workspace_id:workspace.id}));
  const invitation = (invitationsRes?.data || null) as WeddingInvitation | null;
  let wishes: InvitationWish[] = [];
  if (invitation?.id) {
    const wishesRes = await this.db.from('wedding_invitation_wishes').select('*').eq('invitation_id', invitation.id).order('created_at', {ascending: false});
    wishes = (wishesRes?.data || []) as InvitationWish[];
  }
  return {developerTestAccess:testAccess===true,workspace,budgets:checked(budgets) || [],tasks:checked(tasks) || [],guests:checked(guests) || [],members:checked(members) || [],savings:checked(savings) || [],entitlements:checked(entitlements) || [],invitation,wishes,rundowns:checked(rundownsRes) || [],palette:(paletteRes?.data || null) as ColorPalette | null,moodboards:checked(moodboardsRes) || [],honeymoonTrip:(honeymoonTripRes?.data || null) as HoneymoonTrip | null,honeymoonExpenses:checked(honeymoonExpRes) || [],honeymoonItineraries:checked(honeymoonItinRes) || []};
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
 async saveInvitation(workspaceId: string, item: Partial<WeddingInvitation>) {
  await this.requireUser();
  const existing = await this.db.from('wedding_invitations').select('id').eq('workspace_id', workspaceId).maybeSingle();
  if (existing.data?.id) {
    const res = await this.db.from('wedding_invitations').update({ ...item, updated_at: new Date().toISOString() }).eq('id', existing.data.id).select('*').single();
    if (res.error) throw new Error('Gagal memperbarui undangan digital: ' + res.error.message);
    return res.data as WeddingInvitation;
  } else {
    const res = await this.db.from('wedding_invitations').insert({ ...item, workspace_id: workspaceId }).select('*').single();
    if (res.error) throw new Error('Gagal membuat undangan digital: ' + res.error.message);
    return res.data as WeddingInvitation;
  }
 }
 async deleteWish(wishId: string) {
  await this.requireUser();
  const res = await this.db.from('wedding_invitation_wishes').delete().eq('id', wishId);
  if (res.error) throw new Error('Gagal menghapus ucapan: ' + res.error.message);
 }
 async createRundownEvent(workspaceId: string, item: Partial<RundownEvent>) {
  await this.requireUser();
  const res = await this.db.from('wedding_rundown_events').insert({ ...item, workspace_id: workspaceId }).select('*').single();
  if (res.error) throw new Error('Gagal menambah agenda rundown: ' + res.error.message);
  return res.data as RundownEvent;
 }
 async updateRundownEvent(workspaceId: string, id: string, item: Partial<RundownEvent>) {
  await this.requireUser();
  const res = await this.db.from('wedding_rundown_events').update({ ...item, updated_at: new Date().toISOString() }).eq('workspace_id', workspaceId).eq('id', id).select('*').single();
  if (res.error) throw new Error('Gagal memperbarui agenda rundown: ' + res.error.message);
  return res.data as RundownEvent;
 }
 async deleteRundownEvent(workspaceId: string, id: string) {
  await this.requireUser();
  const res = await this.db.from('wedding_rundown_events').delete().eq('workspace_id', workspaceId).eq('id', id);
  if (res.error) throw new Error('Gagal menghapus agenda rundown: ' + res.error.message);
 }
 async insertRundownBatch(workspaceId: string, items: Partial<RundownEvent>[]) {
  await this.requireUser();
  const payload = items.map(item => ({ ...item, workspace_id: workspaceId }));
  const res = await this.db.from('wedding_rundown_events').insert(payload).select('*');
  if (res.error) throw new Error('Gagal menerapkan template rundown: ' + res.error.message);
  return (res.data || []) as RundownEvent[];
 }
 async savePalette(workspaceId: string, item: Partial<ColorPalette>) {
  await this.requireUser();
  const existing = await this.db.from('wedding_color_palettes').select('id').eq('workspace_id', workspaceId).maybeSingle();
  if (existing.data?.id) {
    const res = await this.db.from('wedding_color_palettes').update({ ...item, updated_at: new Date().toISOString() }).eq('id', existing.data.id).select('*').single();
    if (res.error) throw new Error('Gagal memperbarui palet warna: ' + res.error.message);
    return res.data as ColorPalette;
  } else {
    const res = await this.db.from('wedding_color_palettes').insert({ ...item, workspace_id: workspaceId }).select('*').single();
    if (res.error) throw new Error('Gagal menyimpan palet warna: ' + res.error.message);
    return res.data as ColorPalette;
  }
 }
 async createMoodboardItem(workspaceId: string, item: Partial<MoodboardItem>) {
  await this.requireUser();
  const res = await this.db.from('wedding_moodboard_items').insert({ ...item, workspace_id: workspaceId }).select('*').single();
  if (res.error) throw new Error('Gagal menambah item moodboard: ' + res.error.message);
  return res.data as MoodboardItem;
 }
 async updateMoodboardItem(workspaceId: string, id: string, item: Partial<MoodboardItem>) {
  await this.requireUser();
  const res = await this.db.from('wedding_moodboard_items').update({ ...item, updated_at: new Date().toISOString() }).eq('workspace_id', workspaceId).eq('id', id).select('*').single();
  if (res.error) throw new Error('Gagal memperbarui item moodboard: ' + res.error.message);
  return res.data as MoodboardItem;
 }
 async deleteMoodboardItem(workspaceId: string, id: string) {
  await this.requireUser();
  const res = await this.db.from('wedding_moodboard_items').delete().eq('workspace_id', workspaceId).eq('id', id);
  if (res.error) throw new Error('Gagal menghapus item moodboard: ' + res.error.message);
 }
 async insertMoodboardBatch(workspaceId: string, items: Partial<MoodboardItem>[]) {
  await this.requireUser();
  const payload = items.map(item => ({ ...item, workspace_id: workspaceId }));
  const res = await this.db.from('wedding_moodboard_items').insert(payload).select('*');
  if (res.error) throw new Error('Gagal memuat inspirasi moodboard: ' + res.error.message);
  return (res.data || []) as MoodboardItem[];
 }
 async saveHoneymoonTrip(workspaceId: string, item: Partial<HoneymoonTrip>) {
  await this.requireUser();
  const existing = await this.db.from('wedding_honeymoon_trips').select('id').eq('workspace_id', workspaceId).maybeSingle();
  if (existing.data?.id) {
    const res = await this.db.from('wedding_honeymoon_trips').update({ ...item, updated_at: new Date().toISOString() }).eq('id', existing.data.id).select('*').single();
    if (res.error) throw new Error('Gagal memperbarui info bulan madu: ' + res.error.message);
    return res.data as HoneymoonTrip;
  } else {
    const res = await this.db.from('wedding_honeymoon_trips').insert({ ...item, workspace_id: workspaceId }).select('*').single();
    if (res.error) throw new Error('Gagal menyimpan info bulan madu: ' + res.error.message);
    return res.data as HoneymoonTrip;
  }
 }
 async createHoneymoonExpense(workspaceId: string, item: Partial<HoneymoonExpense>) {
  await this.requireUser();
  const res = await this.db.from('wedding_honeymoon_expenses').insert({ ...item, workspace_id: workspaceId }).select('*').single();
  if (res.error) throw new Error('Gagal menambah pos anggaran honeymoon: ' + res.error.message);
  return res.data as HoneymoonExpense;
 }
 async updateHoneymoonExpense(workspaceId: string, id: string, item: Partial<HoneymoonExpense>) {
  await this.requireUser();
  const res = await this.db.from('wedding_honeymoon_expenses').update({ ...item, updated_at: new Date().toISOString() }).eq('workspace_id', workspaceId).eq('id', id).select('*').single();
  if (res.error) throw new Error('Gagal memperbarui pos anggaran honeymoon: ' + res.error.message);
  return res.data as HoneymoonExpense;
 }
 async deleteHoneymoonExpense(workspaceId: string, id: string) {
  await this.requireUser();
  const res = await this.db.from('wedding_honeymoon_expenses').delete().eq('workspace_id', workspaceId).eq('id', id);
  if (res.error) throw new Error('Gagal menghapus pos anggaran honeymoon: ' + res.error.message);
 }
 async createHoneymoonItinerary(workspaceId: string, item: Partial<HoneymoonItinerary>) {
  await this.requireUser();
  const res = await this.db.from('wedding_honeymoon_itineraries').insert({ ...item, workspace_id: workspaceId }).select('*').single();
  if (res.error) throw new Error('Gagal menambah jadwal itinerary: ' + res.error.message);
  return res.data as HoneymoonItinerary;
 }
 async updateHoneymoonItinerary(workspaceId: string, id: string, item: Partial<HoneymoonItinerary>) {
  await this.requireUser();
  const res = await this.db.from('wedding_honeymoon_itineraries').update({ ...item, updated_at: new Date().toISOString() }).eq('workspace_id', workspaceId).eq('id', id).select('*').single();
  if (res.error) throw new Error('Gagal memperbarui jadwal itinerary: ' + res.error.message);
  return res.data as HoneymoonItinerary;
 }
 async deleteHoneymoonItinerary(workspaceId: string, id: string) {
  await this.requireUser();
  const res = await this.db.from('wedding_honeymoon_itineraries').delete().eq('workspace_id', workspaceId).eq('id', id);
  if (res.error) throw new Error('Gagal menghapus jadwal itinerary: ' + res.error.message);
 }
 async applyHoneymoonPreset(workspaceId: string, preset: { destination: string; target_budget: number; hotel_name: string; notes: string; expenses: Partial<HoneymoonExpense>[]; itineraries: Partial<HoneymoonItinerary>[] }) {
  await this.requireUser();
  await this.saveHoneymoonTrip(workspaceId, {
    destination: preset.destination,
    target_budget: preset.target_budget,
    hotel_name: preset.hotel_name,
    notes: preset.notes,
  });
  if (preset.expenses?.length) {
    await this.db.from('wedding_honeymoon_expenses').insert(preset.expenses.map(e => ({ ...e, workspace_id: workspaceId })));
  }
  if (preset.itineraries?.length) {
    await this.db.from('wedding_honeymoon_itineraries').insert(preset.itineraries.map(i => ({ ...i, workspace_id: workspaceId })));
  }
 }
}
