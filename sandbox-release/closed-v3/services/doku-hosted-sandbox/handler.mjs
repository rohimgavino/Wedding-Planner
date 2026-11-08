import {randomUUID,createHash,timingSafeEqual} from 'node:crypto';
import {checkoutInvoice,CheckoutDiagnosticError} from '../doku-sandbox/checkout-adapter.mjs';
import {boundedBody as bounded} from './bounded-body.mjs';
import {createJwtVerifier} from '../doku-sandbox/auth.mjs';
import {inspectNotification,signRequest} from '../doku-sandbox/protocol.mjs';
export const issuer='https://timrseunzsdqdrbyvyfn.supabase.co/auth/v1';
// Private DB service binding is never exposed as a public route.
export function createHostedHandler({db,config,jwksTransport,checkoutTransport}){
 const verify=createJwtVerifier({issuer,audience:'authenticated',transport:jwksTransport});
 if(config?.environment!=='sandbox'||config.enabled!==true)throw Error('sandbox required');
 async function call(operation,args,contract){const response=await db.fetch('https://private.invalid',{method:'POST',body:JSON.stringify({operation,args,...(contract?{contract}:{})})});if(!response.ok){void response.body?.cancel().catch(()=>{});throw Error('database unavailable');}const result=JSON.parse((await bounded(response)).toString('utf8'));if(result&&typeof result==='object'&&'error' in result)throw Error('database rejected');return result;}
 return {async fetch(request){
  try{
   const url=new URL(request.url);if(url.search)throw Error('query rejected');
   if(request.method!=='POST')return new Response(null,{status:405});
   const raw=await bounded(request);
   if(url.pathname===config.notificationPath){
    // Authenticate raw bytes before any database lookup (including unknown invoices).
    const received=request.headers.get('signature');
    if(request.headers.get('client-id')!==config.clientId||!/^HMACSHA256=[A-Za-z0-9+/]{43}=$/.test(received??''))throw Error('notification rejected');
    const signature=signRequest({clientId:config.clientId,requestId:request.headers.get('request-id'),timestamp:request.headers.get('request-timestamp'),target:url.pathname},raw,config.secret);
    if(!timingSafeEqual(Buffer.from(received),Buffer.from(signature)))throw Error('notification rejected');
    const invoice=JSON.parse(raw.toString('utf8'))?.order?.invoice_number;
    if(typeof invoice!=='string'||!/^[A-Za-z0-9._-]{1,30}$/.test(invoice))throw Error();
    const order=await call('snapshot',[invoice]);
    const event=inspectNotification(config,{method:'POST',path:url.pathname,rawBody:raw,headers:Object.fromEntries(request.headers)},order);
    const result=await call('accept',[config.clientId,request.headers.get('Request-Id'),event.payloadHash,invoice,order.requestId,order.amount,event.action]);
    return Response.json({result},{headers:{'Cache-Control':'no-store'}});
   }
   const auth=request.headers.get('authorization');if(!/^Bearer [^\s,]{1,8192}$/.test(auth??''))return new Response(null,{status:401});
   const {userId}=await verify(auth.slice(7));
   const body=JSON.parse(raw.toString('utf8'));
   if(!body||Array.isArray(body)||typeof body!=='object')return new Response(null,{status:400});
   if(['/status','/checkout'].includes(url.pathname)&&Object.keys(body).join(',')==='invoice'){
    const order=await call('status',[userId,body.invoice]);
    if(url.pathname==='/status')return Response.json(order,{headers:{'Cache-Control':'no-store'}});
    if(order.state==='ready')return Response.json({checkoutUrl:order.checkoutUrl,grantsAccess:false},{headers:{'Cache-Control':'no-store'}});
    if(order.state!=='not-started'||!checkoutTransport)throw Error('reconciliation required');
    let hash;
    const result=await checkoutInvoice(config,{
     authorized:async()=>order,
     claim:r=>{hash=createHash('sha256').update(r.rawBody).digest('hex');return call('claim_checkout',[userId,order.invoice,r.rawBody.toString('base64'),r.headers]);},
     complete:r=>call('complete',[order.invoice,hash,r.checkoutUrl])
    },new Date().toISOString().replace(/\.\d{3}Z$/,'Z'),async r=>{
     const response=await checkoutTransport.fetch(r.url,{method:r.method,headers:r.headers,body:r.rawBody,redirect:'manual'});
     return {status:response.status,headers:Object.fromEntries(response.headers),rawBody:await bounded(response)};
    });
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
   }
   // v1 returns an unbounded post-mutation snapshot. Never execute it under a
   // bounded transport: callers receive an explicit unavailable contract instead.
   if(['/planner/read','/planner/write'].includes(url.pathname))return Response.json({error:'planner_transport_unavailable',requiredContract:'bounded-v2'},{status:503,headers:{'Cache-Control':'no-store'}});
   if(url.pathname.startsWith('/planner/v2/')){
    if(config.plannerTransport!=='bounded-v2')return Response.json({error:'planner_v2_deployment_gate_closed'},{status:503,headers:{'Cache-Control':'no-store'}});
    const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    if(!uuid(body.workspaceId))return new Response(null,{status:400});
    let result;
    if(url.pathname==='/planner/v2/read'&&Object.keys(body).sort().join(',')==='cursor,limit,workspaceId'&&(body.cursor===null||uuid(body.cursor))&&Number.isInteger(body.limit)&&body.limit>=1&&body.limit<=32){
     result=await call('read',[userId,body.workspaceId,body.cursor,body.limit],'bounded-v2');
    }else if(url.pathname==='/planner/v2/write'&&Object.keys(body).sort().join(',')==='id,isCompleted,mutationId,title,workspaceId'&&uuid(body.mutationId)&&(body.id===null||uuid(body.id))&&typeof body.title==='string'&&[...body.title.trim()].length>=1&&[...body.title].length<=255&&typeof body.isCompleted==='boolean'){
     try{
      result=await call('write',[userId,body.workspaceId,body.mutationId,body.id,body.title,body.isCompleted],'bounded-v2');
      if(result?.version!=='bounded-v2')throw Error('planner contract mismatch');
     }catch{
      return Response.json({error:'planner_mutation_outcome_unknown',mutationId:body.mutationId,retrySameMutation:true},{status:503,headers:{'Cache-Control':'no-store'}});
     }
    }else return new Response(null,{status:400});
    if(result?.version!=='bounded-v2')throw Error('planner contract mismatch');
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
   }
   if(url.pathname==='/reserve'&&Object.keys(body).sort().join(',')==='packageId,version,workspaceId'){
    const id=randomUUID().replaceAll('-','').slice(0,24);
    return Response.json(await call('reserve',[userId,body.workspaceId,config.clientId,'sb-'+id,randomUUID(),body.packageId,body.version]),{headers:{'Cache-Control':'no-store'}});
   }
   if(url.pathname==='/access'&&Object.keys(body).join(',')==='workspaceId')return Response.json({sandboxAccess:await call('has_access',[userId,body.workspaceId])},{headers:{'Cache-Control':'no-store'}});
   return new Response(null,{status:400});
  }catch(error){
  if(error instanceof CheckoutDiagnosticError)return Response.json({error:error.outcome==='not_dispatched'?'checkout_not_dispatched':'checkout_outcome_unknown',stage:error.stage,outcome:error.outcome,retryCheckout:false},{status:503,headers:{'Cache-Control':'no-store'}});
  return new Response(null,{status:403,headers:{'Cache-Control':'no-store'}});
 }
 }};
}
