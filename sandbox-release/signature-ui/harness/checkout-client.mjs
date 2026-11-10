export const API_ORIGIN='https://pp-doku-sbx-disabled-20261102-bec84f2.taarufplanner12.workers.dev';
export function safeDiagnostic(value={},fallbackStatus){
 const stages=['preparation','status_read','claim','transport','response_verification','completion'];
 const codes=['DB_HTTP_ERROR','DB_RESULT_REJECTED','DB_BODY_INVALID','DB_UNAVAILABLE','PROVIDER_HTTP_REJECTED','PROVIDER_TIMEOUT','PROVIDER_NETWORK_ERROR','PROVIDER_BODY_INVALID','CHECKOUT_FAILED','API_HTTP_ERROR','API_TIMEOUT','API_UNAVAILABLE'];
 const result={stage:stages.includes(value?.stage)?value.stage:'transport',errorCode:codes.includes(value?.errorCode)?value.errorCode:'API_HTTP_ERROR',retryCheckout:false};
 const status=Number.isInteger(value?.httpStatus)&&value.httpStatus>=100&&value.httpStatus<=599?value.httpStatus:fallbackStatus;
 if(Number.isInteger(status)&&status>=100&&status<=599)result.httpStatus=status;
 if(Array.isArray(value?.messages)){
  const safeMsgs=value.messages.filter(m=>typeof m==='string').map(m=>m.slice(0,256)).slice(0,16);
  if(safeMsgs.length>0)result.messages=safeMsgs;
 }
 return result;
}
export function diagnosticText(value){const d=safeDiagnostic(value);const msgSuffix=d.messages?.length?` [${d.messages.join('; ')}]`:'';return `Diagnostik: ${d.stage} / ${d.errorCode}${d.httpStatus?' / HTTP '+d.httpStatus:''}${msgSuffix}. Hasil belum pasti; jangan ulangi pembayaran.`;}
async function boundedDiagnostic(response){
 const reader=response.body?.getReader();if(!reader)return {};let timer,size=0;const chunks=[];
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error()),1000);});
 try{for(;;){const {done,value}=await Promise.race([reader.read(),deadline]);if(done)break;size+=value.byteLength;if(size>4096)throw Error();chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
 finally{clearTimeout(timer);void reader.cancel().catch(()=>{});reader.releaseLock();}
}
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function safeCheckoutUrl(value){
 try{const u=new URL(value);if(u.protocol==='https:'&&u.hostname==='sandbox.doku.com'&&!u.port&&!u.username&&!u.password&&!u.search&&!u.hash&&/^\/checkout-link(?:-v2)?\/[A-Za-z0-9_-]+$/.test(u.pathname))return u.href;}catch{}
 throw Error('Checkout tidak valid. Periksa status, jangan ulangi pembayaran.');
}
// Memory only. Reserve is server-idempotent per unpaid workspace/package;
// an uncertain dispatch is NEVER resent by this client, including after reload.
export class SandboxCheckoutClient{
 constructor({getSession,fetch:transport=globalThis.fetch}){this.getSession=getSession;this.transport=(...args)=>transport(...args);this.reset();}
 reset(){this.generation=(this.generation||0)+1;this.records=new Map();this.current=null;this.pending=null;this.view={state:'idle',sandboxAccess:false,checkoutUrl:null};}
 async post(path,body){const captured=this.getSession(),generation=this.generation;if(!captured?.access_token)throw Error('Masuk kembali untuk memeriksa pembayaran.');const r=await this.transport(API_ORIGIN+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+captured.access_token},body:JSON.stringify(body),credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});if(captured!==this.getSession()||generation!==this.generation)throw Error('Sesi berubah.');if(!r.ok){let value={};try{value=await boundedDiagnostic(r);}catch{}if(captured!==this.getSession()||generation!==this.generation)throw Error('Sesi berubah.');throw Object.assign(Error('Permintaan belum berhasil.'),{diagnostic:safeDiagnostic(value,r.status)});}const value=await r.json();if(captured!==this.getSession()||generation!==this.generation)throw Error('Sesi berubah.');return value;}
 snapshot(o,w,p,v){if(o?.environment!=='sandbox'||o.workspaceId!==w||o.packageId!==p||o.packageVersion!==v||!Number.isSafeInteger(o.amount)||o.amount<=0||o.currency!=='IDR'||o.grantsAccess!==false||!/^[-A-Za-z0-9._]{1,30}$/.test(o.invoice))throw Error('Reservasi tidak valid.');return o;}
 start(w,p,v){if(this.pending)return this.pending;this.pending=this.run(w,p,v).finally(()=>{this.pending=null;});return this.pending;}
 async run(w,p,v){
 if(!uuid(w)||!['starter','premium','wedding_pro'].includes(p)||!/^\d+$/.test(v))throw Error('Pilih rencana dan paket yang valid.');
 this.view={state:'pending',sandboxAccess:false,checkoutUrl:null};
 try{
 const access=await this.post('/access',{workspaceId:w});if(typeof access?.sandboxAccess!=='boolean')throw Error('Status akses tidak valid.');if(access.sandboxAccess){this.view={state:'paid',sandboxAccess:true,checkoutUrl:null};return this.view;}
 const o=this.snapshot(await this.post('/reserve',{workspaceId:w,packageId:p,version:v}),w,p,v);const key=w+':'+p;let record=this.records.get(key);if(!record){record={invoice:o.invoice,dispatched:false};this.records.set(key,record);}if(record.invoice!==o.invoice)throw Error('Rekonsiliasi diperlukan.');this.current={w,p,v,record};
 // Local bookkeeping is not a dispatch. Once attempted, reconcile only.
 if(record.dispatched)return await this.check(w);
 const status=this.snapshot(await this.post('/status',{invoice:record.invoice}),w,p,v);
 if(status.invoice!==record.invoice)throw Error('Rekonsiliasi diperlukan.');
 if(status.state!=='not-started')return await this.check(w);
 record.dispatched=true;
 const result=await this.post('/checkout',{invoice:record.invoice});if(result?.grantsAccess!==false)throw Error('Status checkout tidak valid.');
 this.view={state:'ready',sandboxAccess:false,checkoutUrl:safeCheckoutUrl(result.checkoutUrl),amount:o.amount};return this.view;
 }catch(error){this.view={state:'uncertain',sandboxAccess:false,checkoutUrl:null,diagnostic:safeDiagnostic(error?.diagnostic??{errorCode:error?.name==='AbortError'||error?.name==='TimeoutError'?'API_TIMEOUT':'API_UNAVAILABLE'})};throw Error('Hasil belum pasti. Periksa status; jangan ulangi pembayaran.');}
 }
 async check(w){
 this.view={state:'pending',sandboxAccess:false,checkoutUrl:null};
 try{let state='pending',link=null;const c=this.current;if(c?.w===w){const o=await this.post('/status',{invoice:c.record.invoice});this.snapshot(o,w,c.p,c.v);if(!['not-started','ready','uncertain','paid'].includes(o.state))throw Error();state=o.state;if(state==='ready')link=safeCheckoutUrl(o.checkoutUrl);}
 const a=await this.post('/access',{workspaceId:w});if(typeof a?.sandboxAccess!=='boolean')throw Error();this.view={state,sandboxAccess:a.sandboxAccess,checkoutUrl:link};return this.view;
 }catch(error){this.view={state:'uncertain',sandboxAccess:false,checkoutUrl:null,diagnostic:safeDiagnostic(error?.diagnostic??{errorCode:error?.name==='AbortError'||error?.name==='TimeoutError'?'API_TIMEOUT':'API_UNAVAILABLE'})};throw Error('Status belum tersedia. Coba Periksa status lagi.');}
 }
}
