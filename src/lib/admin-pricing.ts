import type {SupabaseClient} from '@supabase/supabase-js';
export interface PackagePricing {version:string;amount_idr:string;currency:'IDR';duration_unit:'calendar_year';duration_count:1;workspace_count:1;created_at:string}
export function validatePrice(value:string):string {
 if(typeof value!=='string'|| !/^[1-9][0-9]{0,15}$/.test(value)||BigInt(value)>BigInt('9007199254740991'))throw new Error('Harga harus Rupiah bulat 1–9.007.199.254.740.991, tanpa titik, spasi atau nol awal.');
 return value;
}
function snapshot(value:unknown):PackagePricing {
 const v=value as PackagePricing|null;
 if(!v || typeof v.version!=='string'||!/^[1-9][0-9]{0,17}$/.test(v.version)||v.currency!=='IDR'||v.duration_unit!=='calendar_year'||v.duration_count!==1||v.workspace_count!==1||typeof v.created_at!=='string'||!Number.isFinite(Date.parse(v.created_at)))throw new Error('Snapshot harga server tidak valid. Muat ulang; perubahan ditutup.');
 validatePrice(v.amount_idr);return v;
}
export async function readPricing(client:SupabaseClient):Promise<PackagePricing> {
 const {data,error}=await client.rpc('admin_package_pricing');
 if(error)throw new Error('Harga tidak tersedia: periksa migration/otorisasi. Tidak ada harga perkiraan atau simpan lokal.');
 return snapshot(data);
}
export async function updatePricing(client:SupabaseClient,amount:string,version:string,reason:string,confirmed:boolean):Promise<PackagePricing> {
 validatePrice(amount);
 if(!/^[1-9][0-9]{0,17}$/.test(version))throw new Error('Versi tidak valid. Muat ulang.');
 if(!confirmed)throw new Error('Konfirmasi perubahan wajib.');
 reason=reason.trim();if(!reason||reason.length>500)throw new Error('Alasan wajib, maksimal 500 karakter.');
 const {data,error}=await client.rpc('admin_update_package_price',{p_amount_idr:amount,p_expected_version:version,p_reason:reason,p_confirmed:true});
 if(error)throw new Error(error.message);
 const result=snapshot(data);
 if(result.amount_idr!==amount||BigInt(result.version)!==BigInt(version)+BigInt(1))throw new Error('Snapshot hasil tidak cocok. Status simpan belum dapat dipastikan; muat ulang.');
 return result;
}
export function formatPackagePrice(amount:string){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(BigInt(validatePrice(amount)));}
