import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function plan(rows,approval={}) {
 if(!Array.isArray(rows)||!approval.operator?.trim())throw Error('invalid operator or rows');
 const seen=new Set();
 const entries=rows.map(row=>{
  for(const key of ['invoice','workspace_id','status','amount_idr','paid_at','expires_at','duration_days','benefits','evidence'])if(row[key]===undefined||row[key]===null||row[key]==='')throw Error('missing '+key);
  if(seen.has(row.invoice))throw Error('duplicate invoice');seen.add(row.invoice);
  if(row.status!=='paid'||!Number.isSafeInteger(row.amount_idr)||row.amount_idr<=0||!Number.isInteger(row.duration_days)||row.duration_days<=0||!Array.isArray(row.benefits)||!row.benefits.length||row.benefits.some(x=>typeof x!=='string'||!x.trim())||typeof row.evidence!=='string'||!row.evidence.trim())throw Error('invalid historical evidence');
  const paid=Date.parse(row.paid_at),expires=Date.parse(row.expires_at);
  if(!Number.isFinite(paid)||!Number.isFinite(expires)||expires<=paid)throw Error('invalid historical expiry');
  if(row.revoked_at && !Number.isFinite(Date.parse(row.revoked_at)))throw Error('invalid revocation');
  return {invoice:row.invoice,workspace_id:row.workspace_id,amount_idr:row.amount_idr,paid_at:row.paid_at,expires_at:row.expires_at,duration_days:row.duration_days,benefits:[...row.benefits],revoked_at:row.revoked_at??null,evidence:row.evidence,action:'review-existing-rights-only'};
 }).sort((a,b)=>a.invoice.localeCompare(b.invoice,'en'));
 const payload={version:1,mode:'offline-plan-only',executable:false,operator:approval.operator,operator_approved:approval.approved===true,entries};
 return {...payload,sha256:createHash('sha256').update(JSON.stringify(payload)).digest('hex')};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.length!==4)throw Error('usage: node history-plan.mjs input-export.json operator');
 console.log(JSON.stringify(plan(JSON.parse(readFileSync(process.argv[2],'utf8')),{operator:process.argv[3]}),null,2));
}
