import test from 'node:test';
import assert from 'node:assert/strict';
import {sendSandboxCheckout,inspectNotification,signRequest} from '../services/doku-sandbox/protocol.mjs';
const config={enabled:true,environment:'sandbox',clientId:'synthetic',secret:'not-a-credential',notificationPath:'/notification'};
const order={environment:'sandbox',workspaceId:'test',invoice:'INV1',requestId:'REQ1',amount:300000,currency:'IDR',packageVersion:'2',packageAmountIdr:'300000',durationUnit:'calendar_year',durationCount:1,workspaceCount:1};
test('new trusted server snapshot accepts changed price while historical amount remains valid',async()=>{
 for(const o of [order,{...order,amount:250000,packageVersion:'1',packageAmountIdr:'250000'}])await sendSandboxCheckout(config,o,'2026-10-22T00:00:00Z',async r=>{assert.equal(JSON.parse(r.rawBody).order.amount,o.amount);return{status:200};});
});
test('notification matches historical persisted invoice, not latest catalog amount',()=>{
 const old={...order,amount:250000,packageAmountIdr:'250000',packageVersion:'1'};
 const rawBody=Buffer.from(JSON.stringify({order:{invoice_number:old.invoice,amount:'250000',currency:'IDR'},transaction:{status:'SUCCESS',original_request_id:old.requestId,date:'2026-10-22T00:00:00Z'}}));
 const meta={clientId:config.clientId,requestId:'event',timestamp:'2026-10-22T00:00:00Z',target:config.notificationPath};
 const req={method:'POST',path:meta.target,rawBody,headers:{'Client-Id':meta.clientId,'Request-Id':meta.requestId,'Request-Timestamp':meta.timestamp,Signature:signRequest(meta,rawBody,config.secret)}};
 assert.equal(inspectNotification(config,req,old).grantsAccess,false);assert.throws(()=>inspectNotification(config,req,order),/amount mismatch/);
});
for(const patch of [{amount:0},{amount:1.5},{amount:'300000'},{amount:300001},{packageVersion:undefined},{packageAmountIdr:'0300000'},{durationUnit:'days'},{durationCount:365},{workspaceCount:2}])test('reject unsafe or mismatched server terms '+JSON.stringify(patch),async()=>{let calls=0;await assert.rejects(sendSandboxCheckout(config,{...order,...patch},'2026-10-22T00:00:00Z',()=>{calls++;}));assert.equal(calls,0);});
