// Cloudflare nodejs_compat supports crypto/Buffer; no pg/TCP or Node listener.
import {createHostedHandler} from '../doku-hosted-sandbox/handler.mjs';
import {createJwksTransport} from '../doku-hosted-sandbox/jwks.mjs';
export {SandboxIngressGate} from './ingress-gate.mjs';
import {createHash} from 'node:crypto';
import {isIP} from 'node:net';
import {leaseRpcRequest} from './lease-bridge.local.mjs';
const project='https://timrseunzsdqdrbyvyfn.supabase.co';
const rpc=project+'/rest/v1/rpc/pp_doku_sandbox_rpc';
const timeout=()=>AbortSignal.timeout(10000);
// One pinned cache per isolate, storing parsed public keys only, never credentials.
const jwksTransport=createJwksTransport((_url,init)=>fetch(project+'/auth/v1/.well-known/jwks.json',{...init,redirect:'manual'}));
const routes=new Set(['/reserve','/status','/checkout','/access','/planner/read','/planner/write','/planner/v2/read','/planner/v2/write','/doku/notifications']);
function clientKey(request,lane){
 // Only CF edge metadata and its overwritten header are accepted. Do not deploy
 // behind a proxy that preserves caller CF-Connecting-IP or untrusted Workers.
 // X-Forwarded-For/X-Real-IP and browser-supplied client identifiers are ignored.
 const ip=request.headers.get('CF-Connecting-IP');
 if(!request.cf||request.headers.has('CF-Worker')||typeof ip!=='string'||ip.length>45||!isIP(ip))throw Error('trusted edge IP required');
 const canonical=isIP(ip)===6?new URL('https://['+ip+']/').hostname:ip;
 return lane+':'+createHash('sha256').update(canonical).digest('hex');
}
let active=0;
async function limited(binding,key){
 if(typeof binding?.limit!=='function')throw Error();
 let timer;
 try{
  const result=await Promise.race([binding.limit({key}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error()),1000);})]);
  if(typeof result?.success!=='boolean')throw Error();return result.success;
 }finally{clearTimeout(timer);}
}
export default {async fetch(request,env){
 const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 let entered=false;
 try{
 // Legacy IP mode requires genuine WAF blocking of all Worker subrequests.
 // durable-sandbox-v1 is a separate reviewed fixed-lane application budget;
 // it does not rely on edge-IP custody or claim provider-origin DoS protection.
 const durable=env.EDGE_CUSTODY==='durable-sandbox-v1';
 // Absolute version-bound lease; never reset or extend it per request.
 const registration=env.NOTIFICATION_REGISTRATION==='true';
 const canonical=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
 // Sales has its own immutable absolute lease, never registration timestamps.
 if(!registration&&env.SANDBOX_ENABLED==='true'){
  const start=Date.parse(env.SALES_START),end=Date.parse(env.SALES_EXPIRES),now=Date.now();
  const notification=new URL(request.url).pathname==='/doku/notifications';
  const reconcile=Date.parse(env.RECONCILIATION_EXPIRES);
  const late=notification&&canonical(env.RECONCILIATION_EXPIRES)&&reconcile>end&&reconcile-end<=86400000&&now<reconcile;
  if(!canonical(env.SALES_START)||!canonical(env.SALES_EXPIRES)||end<=start||end-start>900000||!Number.isFinite(now)||now<start||(now>=end&&!late))return new Response(null,{status:503,headers});
 }
 if(registration){
  const start=Date.parse(env.REGISTRATION_START),end=Date.parse(env.REGISTRATION_EXPIRES),now=Date.now();
  if(env.SANDBOX_ENABLED!=='false'||!durable||!canonical(env.REGISTRATION_START)||!canonical(env.REGISTRATION_EXPIRES)||end<=start||end-start>900000||!Number.isFinite(now)||now<start||now>=end)return new Response(null,{status:503,headers});
 }
 if((!registration&&env.SANDBOX_ENABLED!=='true')||(!durable&&env.EDGE_CUSTODY!=='direct-edge-waf-reviewed')||!env.RPC_CAPABILITY||!/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(env.SUPABASE_PUBLISHABLE_KEY??'')||!env.DOKU_CLIENT_ID||!env.DOKU_SECRET)return new Response(null,{status:503,headers});
 // Only modern publishable apikey translation is supported. Never accept a
 // secret/service_role key or reinterpret a legacy JWT as a public gateway key.
 const origin=new URL(env.ALLOWED_ORIGIN);if(origin.protocol!=='https:'||origin.origin!==env.ALLOWED_ORIGIN)throw Error();
 const url=new URL(request.url),notification=url.pathname==='/doku/notifications';
 if(url.search||!routes.has(url.pathname))return new Response(null,{status:404,headers});
 if(!['POST','OPTIONS'].includes(request.method)||(notification&&request.method!=='POST'))return new Response(null,{status:405,headers});
 if(!notification){
 if(request.headers.get('origin')!==env.ALLOWED_ORIGIN)return new Response(null,{status:403,headers});
 headers['Access-Control-Allow-Origin']=env.ALLOWED_ORIGIN;
 if(request.method==='OPTIONS'){
 const requested=(request.headers.get('access-control-request-headers')??'').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
 if(request.headers.get('access-control-request-method')!=='POST'||requested.some(h=>!['authorization','content-type'].includes(h)))throw Error();
 return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Authorization, Content-Type'}});
 }
 }
 // Preflight is metadata only; registration never dispatches customer handlers.
 if(registration&&!notification)return new Response(null,{status:503,headers});
 // Separate per-client and aggregate lane budgets. A depleted client cannot
 // consume the aggregate lane. Native counters have no application key map.
 let allowed;try{
 const lane=notification?'notification':'customer';
 if(durable){
  // No body/JWT/signature forwarded. One global durable object; no IP bypass.
  const gate=env.SANDBOX_GATE.get(env.SANDBOX_GATE.idFromName('sandbox-v1'));
  const result=await gate.fetch('https://gate.invalid/'+lane,{method:'POST',signal:AbortSignal.timeout(2000)});
  if(![204,429].includes(result.status))throw Error();allowed=result.status===204;
 }else{
  allowed=await limited(env.INGRESS_LIMITER,clientKey(request,lane));
  if(allowed)allowed=await limited(env.GLOBAL_LIMITER,lane);
 }
 }catch{return new Response(null,{status:503,headers});}
 if(!allowed||active>=16)return new Response(null,{status:429,headers});
 const length=request.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>65536))return new Response(null,{status:413,headers});
 active++;entered=true;
 const db={async fetch(_url,init){
 // Registration verifies notification signatures but cannot touch the ledger,
 // even if an operator accidentally changes the separately disabled DB identity.
 if(registration)return new Response(null,{status:403});
 const {operation,args,contract}=JSON.parse(init.body);
 // Explicit opt-in; any partial/unknown successor configuration fails closed.
 const leaseConfigured=env.SALES_PROTOCOL!==undefined||env.SALES_LEASE_ID!==undefined;
 if(leaseConfigured&&env.SALES_PROTOCOL!=='successor-lease-v1')throw Error('lease protocol rejected');
 if(leaseConfigured&&contract!=='bounded-v2')return fetch(leaseRpcRequest(env,operation,args));
 // No browser JWT or service_role at this boundary. Capability protected by DB hash.
 return fetch(contract==='bounded-v2'?project+'/rest/v1/rpc/pp_doku_planner_v2_rpc':(env.RECONCILIATION_EXPIRES?project+'/rest/v1/rpc/pp_doku_sandbox_windowed_rpc':rpc),{method:'POST',headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_capability:env.RPC_CAPABILITY,p_operation:operation,p_args:args}),redirect:'manual',signal:timeout()});
 }};
 const handler=createHostedHandler({db,config:{enabled:true,environment:'sandbox',plannerTransport:env.PLANNER_TRANSPORT_VERSION,clientId:env.DOKU_CLIENT_ID,secret:env.DOKU_SECRET,notificationPath:'/doku/notifications'},jwksTransport,checkoutTransport:{fetch:(url,init)=>{
 if(url!=='https://api-sandbox.doku.com/checkout/v1/payment')throw Error();
 return fetch(url,{...init,redirect:'manual',signal:timeout()});
 }}});
 const response=await handler.fetch(request);
 for(const [k,v] of Object.entries(headers))response.headers.set(k,v);
 return response;
 }catch{return new Response(null,{status:403,headers});}
 finally{if(entered)active--;}
}};
