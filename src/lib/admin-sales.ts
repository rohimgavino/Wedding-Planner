import type { SupabaseClient } from '@supabase/supabase-js';
export interface SalesReport {
 gross_idr: string; sale_count: number; excluded_verified: number; generated_at: string;
 rows: {id:string;workspace_id:string;price_idr:string;transaction_reference:string;verified_at:string}[];
}
export interface SalesFilters {from:string;to:string;search:string}
export function formatSalesRupiah(amount:string) {
 if(!/^\d+$/.test(amount))throw new Error('Nominal laporan tidak valid.');
 return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(BigInt(amount));
}
export async function readSales(client:SupabaseClient,filters:SalesFilters):Promise<SalesReport> {
 if(filters.from && filters.to && filters.from>filters.to)throw new Error('Tanggal awal harus sebelum atau sama dengan tanggal akhir.');
 const {data,error}=await client.rpc('admin_sales_report',{p_from:filters.from||null,p_to:filters.to||null,p_search:filters.search.trim()});
 if(error)throw new Error(error.message);
 if(!data || !/^\d+$/.test(data.gross_idr) || !Array.isArray(data.rows))throw new Error('Laporan tidak tersedia.');
 return data;
}
