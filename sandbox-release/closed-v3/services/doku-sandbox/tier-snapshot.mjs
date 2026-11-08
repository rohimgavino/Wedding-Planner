// Validate immutable private SQL snapshot, never a browser price input.
const amount=v=>typeof v==='string'&&/^[1-9][0-9]{0,15}$/.test(v)&&Number.isSafeInteger(Number(v));
const utc=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v.replace('Z','.000Z');
export function validateTierSnapshot(o){
 const fail=()=>{throw Error('invalid reviewed tier snapshot');};
 if(!['starter','premium','wedding_pro'].includes(o.packageId)||typeof o.packageVersion!=='string'||!/^[1-9][0-9]{0,17}$/.test(o.packageVersion)||o.currency!=='IDR'||o.grantsAccess!==false||!amount(o.packageAmountIdr)||o.amount!==Number(o.packageAmountIdr))fail();
 const c=o.priceConfig,t=Date.parse(o.reservedAt);
 if(typeof o.reservedAt!=='string'||!Number.isFinite(t)||!c||Object.keys(c).sort().join(',')!=='amount_idr,promo'||!amount(c.amount_idr))fail();
 let effective=c.amount_idr,active=false;
 if(c.promo!==null){const p=c.promo;if(!p||Object.keys(p).sort().join(',')!=='amount_idr,ends_at,starts_at,title'||!amount(p.amount_idr)||Number(p.amount_idr)>=Number(c.amount_idr)||typeof p.title!=='string'||p.title.trim().length<1||p.title.trim().length>120||!utc(p.starts_at)||!utc(p.ends_at)||Date.parse(p.starts_at)>=Date.parse(p.ends_at))fail();active=t>=Date.parse(p.starts_at)&&t<Date.parse(p.ends_at);if(active)effective=p.amount_idr;}
 if(o.packageAmountIdr!==effective||o.promoApplied!==active)fail();
}
