import type {SupabaseClient} from '@supabase/supabase-js';
export const tierIds=['starter','premium','wedding_pro'] as const;
export type TierId=typeof tierIds[number];
export interface TierConfig{amount_idr:string|null;promo:null|{amount_idr:string;title:string;starts_at:string;ends_at:string}}
export interface TierPrice{package_id:TierId;version:string;config:TierConfig;created_at:string;effective_amount_idr:string|null;promo_active:boolean;price_eligible:boolean;checkout_eligible:false}
export interface TierCatalog{server_now:string;packages:TierPrice[]}
function object(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
function exact(v:Record<string,unknown>,keys:string[]){if(Object.keys(v).sort().join('|')!==keys.sort().join('|'))throw new Error('Kunci konfigurasi tidak valid.');}
function price(v:unknown):asserts v is string{if(typeof v!=='string'||!/^[1-9][0-9]{0,15}$/.test(v)||BigInt(v)>BigInt('9007199254740991'))throw new Error('Harga wajib Rupiah bulat positif, maksimal 9007199254740991, tanpa pemisah.');}
function utc(v:unknown):asserts v is string{if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().replace('.000Z','Z')!==v)throw new Error('Jadwal wajib waktu UTC valid (YYYY-MM-DDTHH:mm:ssZ).');}
export function validateTierConfig(v:unknown):TierConfig{
 if(!object(v))throw new Error('Konfigurasi tidak valid.');exact(v,['amount_idr','promo']);
 if(v.amount_idr!==null)price(v.amount_idr);
 if(v.promo!==null){const p=v.promo;if(!object(p)||v.amount_idr===null)throw new Error('Promo memerlukan harga dasar.');exact(p,['amount_idr','title','starts_at','ends_at']);price(p.amount_idr);if(BigInt(p.amount_idr)>=BigInt(v.amount_idr as string))throw new Error('Harga promo harus lebih rendah dari harga dasar.');if(typeof p.title!=='string'||!p.title.trim()||Array.from(p.title.trim()).length>120)throw new Error('Judul promo wajib, maksimal 120 karakter.');utc(p.starts_at);utc(p.ends_at);if(Date.parse(p.starts_at)>=Date.parse(p.ends_at))throw new Error('Akhir promo harus setelah mulai.');}
 return v as unknown as TierConfig;
}
function snapshot(v:unknown):TierCatalog{
 if(!object(v)||typeof v.server_now!=='string'||!Number.isFinite(Date.parse(v.server_now))||!Array.isArray(v.packages)||v.packages.length!==3)throw new Error('Snapshot katalog tidak valid.');
 const seen=new Set();for(const p of v.packages){if(!object(p)||!tierIds.includes(p.package_id as TierId)||seen.has(p.package_id)||typeof p.version!=='string'||!/^[1-9][0-9]{0,17}$/.test(p.version)||typeof p.created_at!=='string'||!Number.isFinite(Date.parse(p.created_at))||p.checkout_eligible!==false||typeof p.price_eligible!=='boolean'||typeof p.promo_active!=='boolean')throw new Error('Snapshot paket tidak valid.');seen.add(p.package_id);const c=validateTierConfig(p.config);if(p.effective_amount_idr!==null)price(p.effective_amount_idr);const t=Date.parse(v.server_now);const active=!!(c.amount_idr&&c.promo&&t>=Date.parse(c.promo.starts_at)&&t<Date.parse(c.promo.ends_at));if(p.price_eligible!==(c.amount_idr!==null)||p.promo_active!==active||p.effective_amount_idr!==(active?c.promo!.amount_idr:c.amount_idr))throw new Error('Evaluasi harga server tidak cocok.');}
 return v as unknown as TierCatalog;
}
export async function readTierCatalog(client:SupabaseClient){const {data,error}=await client.rpc('admin_tier_catalog');if(error)throw new Error('Katalog tidak tersedia: periksa migrasi/otorisasi. Tidak ada harga perkiraan.');return snapshot(data);}
export async function updateTierPrice(client:SupabaseClient,id:TierId,version:string,config:TierConfig,reason:string,confirmed:boolean){
 validateTierConfig(config);if(!tierIds.includes(id)||!/^[1-9][0-9]{0,17}$/.test(version))throw new Error('Paket/versi tidak valid.');if(confirmed!==true)throw new Error('Konfirmasi wajib.');reason=reason.trim();if(!reason||Array.from(reason).length>500)throw new Error('Alasan wajib, maksimal 500 karakter.');
 const {data,error}=await client.rpc('admin_update_tier_price',{p_package_id:id,p_expected_version:version,p_config:config,p_reason:reason,p_confirmed:true});if(error)throw new Error(error.message);const result=snapshot(data);const saved=result.packages.find(p=>p.package_id===id)!;if(BigInt(saved.version)!==BigInt(version)+BigInt(1)||JSON.stringify(saved.config)!==JSON.stringify(config)){
 // JSONB key ordering is not a wire contract.
 if(BigInt(saved.version)!==BigInt(version)+BigInt(1)||saved.config.amount_idr!==config.amount_idr||JSON.stringify(saved.config.promo&&Object.entries(saved.config.promo).sort())!==JSON.stringify(config.promo&&Object.entries(config.promo).sort()))throw new Error('Hasil simpan belum dapat dipastikan. Muat ulang.');
 }return result;
}
