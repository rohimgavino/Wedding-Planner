import type { SupabaseClient } from '@supabase/supabase-js';
export interface SiteSettings { support_email: string | null; price_idr: number | null; duration_days: number | null; lynk_url: string | null; sales_enabled: boolean }
export interface PurchaseRequest { id: string; workspace_id: string; requested_by: string; price_idr: number; duration_days: number; lynk_url: string; status: 'pending' | 'verified' | 'rejected'; transaction_reference: string | null; review_note: string | null; created_at: string }
export interface AuditEntry { id: string; actor_id: string; action: string; subject_id: string | null; details: Record<string,unknown>; created_at: string }
export function validLynkURL(value: string) {return /^https:\/\/lynk\.id\/[A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+$/.test(value);}
function integer(value: string, max: number) {if(!/^[0-9]+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value)<1 || Number(value)>max) throw new Error('Nominal/durasi harus bilangan bulat positif dalam batas aman.');return Number(value);}
export function parsePackage(email: string, price: string, days: string, url: string, enabled: boolean) {
 email=email.trim();url=url.trim();
 if(email && (email.length>254 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9]+([.-][A-Za-z0-9]+)*\.[A-Za-z]{2,}$/.test(email)))throw new Error('Email dukungan tidak valid.');
 if(url && !validLynkURL(url))throw new Error('Gunakan URL produk HTTPS resmi lynk.id, tanpa query atau fragment.');
 const result={email:email || null,price:price ? integer(price,Number.MAX_SAFE_INTEGER) : null,days:days ? integer(days,3650) : null,url:url || null,enabled};
 if(enabled && (!result.email || !result.price || !result.days || !result.url))throw new Error('Lengkapi email, harga, durasi dan URL produk sebelum membuka penjualan.');
 return result;
}
function checked<T>(data: T, error: {message: string} | null) {if(error)throw new Error(error.message);return data;}
export class Commerce {
 constructor(private client: SupabaseClient) {}
 async role(): Promise<'developer' | 'operator' | null> {const {data,error}=await this.client.rpc('site_role');const role=checked(data,error);if(role!==null && role!=='developer' && role!=='operator')throw new Error('Role tidak dapat divalidasi.');return role;}
 async admins(): Promise<{user_id:string;role:'developer'|'operator';created_at:string}[]> {const {data,error}=await this.client.rpc('list_site_admins');return checked(data || [],error);}
 async setAdmin(id:string,role:'developer'|'operator'|null,reason:string) {if(!reason.trim())throw new Error('Alasan wajib.');const {data,error}=await this.client.rpc('set_site_admin',{p_user_id:id,p_role:role,p_reason:reason.trim()});return checked(data,error);}
 async testAccess(workspace:string,days:string,reason:string) {if(!reason.trim())throw new Error('Alasan wajib.');const {data,error}=await this.client.rpc('grant_developer_test_access',{p_workspace_id:workspace,p_days:integer(days,30),p_reason:reason.trim()});return checked(data,error);}
 async revokeTestAccess(workspace:string,reason:string) {if(!reason.trim())throw new Error('Alasan wajib.');const {data,error}=await this.client.rpc('revoke_developer_test_access',{p_workspace_id:workspace,p_reason:reason.trim()});return checked(data,error);}
 async overview(offset=0): Promise<{workspace_id:string;member_count:number;access_status:string;expires_at:string|null}[]> {const {data,error}=await this.client.rpc('admin_workspace_overview',{p_limit:50,p_offset:offset});return checked(data || [],error);}
 async admin() {const {data,error}=await this.client.rpc('is_site_admin');return checked(data,error)===true;}
 async settings(): Promise<SiteSettings> {const {data,error}=await this.client.from('site_settings').select('support_email,price_idr,duration_days,lynk_url,sales_enabled').single();const result=checked(data,error);if(!result)throw new Error('Pengaturan belum tersedia.');return result;}
 async purchases(workspace?: string): Promise<PurchaseRequest[]> {let q=this.client.from('purchase_requests').select('*').order('created_at',{ascending:false});if(workspace)q=q.eq('workspace_id',workspace);const {data,error}=await q;return checked(data || [],error);}
 async audit(): Promise<AuditEntry[]> {const {data,error}=await this.client.from('admin_audit').select('*').order('created_at',{ascending:false}).limit(100);return checked(data || [],error);}
 async save(email: string,price: string,days: string,url: string,enabled: boolean) {if(enabled)throw new Error('DOKU belum terintegrasi; penjualan tetap ditutup.');const args=parsePackage(email,price,days,url,enabled);const {data,error}=await this.client.rpc('save_site_settings',args);return checked(data,error);}
 async request(workspace: string): Promise<string> {const {data,error}=await this.client.rpc('request_core_purchase',{ws_id:workspace});return checked(data,error);}
 async verify(id: string,reference: string,amount: string,confirmed: boolean,note: string) {
 void [id,reference,amount,confirmed,note];
 throw new Error('DOKU belum terintegrasi; verifikasi pembayaran tidak tersedia.');
 }
 async reject(id: string,note: string) {if(!note.trim() || note.trim().length>500)throw new Error('Isi alasan penolakan maksimal 500 karakter.');const {data,error}=await this.client.rpc('reject_core_purchase',{request_id:id,note:note.trim()});return checked(data,error);}
}
