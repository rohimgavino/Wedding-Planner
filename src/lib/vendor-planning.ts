import type {TaskItem,Vendor,VendorInstallment,VendorPayment} from '@/types';
// Date-only deadlines use Asia/Jakarta (WIB), independent of device timezone.
export function indonesiaDate(now=new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
// Keep integer arithmetic exact even when individually safe rows exceed 2^53 in aggregate.
function compact(value:bigint):number|bigint { return value<=BigInt(Number.MAX_SAFE_INTEGER)&&value>=BigInt(Number.MIN_SAFE_INTEGER)?Number(value):value; }
function sum(values:(number|bigint)[]) { return compact(values.reduce<bigint>((total,value)=>total+BigInt(value),BigInt(0))); }
export function installmentPaid(id:string,payments:VendorPayment[]) { return sum(payments.filter(p=>p.installment_id===id).map(p=>p.amount)); }
export function installmentRemaining(amount:number,paid:number|bigint) { const remainder=BigInt(amount)-BigInt(paid);return compact(remainder>BigInt(0)?remainder:BigInt(0)); }
export function vendorTotals(vendor:Vendor,installments:VendorInstallment[],payments:VendorPayment[]) {
 const own=installments.filter(i=>i.vendor_id===vendor.id);
 const paid=sum(own.map(i=>installmentPaid(i.id,payments)));
 return {contract:vendor.contract_total,scheduled:sum(own.map(i=>i.amount)),paid,remaining:compact(BigInt(vendor.contract_total)-BigInt(paid))};
}
function validDate(value:unknown):value is string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1900-01-01')return false;
 const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function weeklyPriorities(tasks:TaskItem[],installments:VendorInstallment[],payments:VendorPayment[],today=indonesiaDate()) {
 if(!validDate(today))return [];
 const end=new Date(today+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+7);const limit=end.toISOString().slice(0,10);
 return [...tasks.filter(t=>!t.is_completed && t.due_date).map(t=>({id:t.id,title:t.title,date:t.due_date!,source:'Tugas',action:'tasks' as const})),
 ...installments.filter(i=>installmentPaid(i.id,payments)<i.amount).map(i=>({id:i.id,title:i.title,date:i.due_date,source:'Termin vendor',action:'vendors' as const}))]
 .filter(p=>validDate(p.date)&&p.date<=limit).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)).slice(0,5).map(p=>({...p,overdue:p.date<today}));
}
