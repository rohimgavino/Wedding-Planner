// Separate private Worker. Requires nodejs_compat; never imported by Next.
import { Buffer } from 'node:buffer';
import { timingSafeEqual, randomUUID } from 'node:crypto';
import { inspectNotification, signRequest } from './protocol.mjs';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const invoicePattern=/^[A-Za-z0-9._-]{1,30}$/;
const reply=(status,data={error:'request rejected'})=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
async function bounded(request,max){
 if(request.headers.has('content-encoding') || !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')??''))throw 400;
 const reader=request.body?.getReader(); if(!reader)throw 400;
 const chunks=[];let size=0;
 try {for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw 413;}chunks.push(Buffer.from(value));}} finally{reader.releaseLock();}
 if(size===0)throw 400; return Buffer.concat(chunks);
}
async function rpc(env,operation,args){
 const r=await env.DATABASE.fetch('https://database.internal/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation,args})});
 if(r.status===403)throw 403;if(!r.ok)throw 503;return r.json();
}
async function identity(request,env){
 const bearer=request.headers.get('authorization');if(!/^Bearer [^\s,]{1,8192}$/.test(bearer??''))throw 401;
 const r=await env.AUTH.fetch('https://auth.internal/verify',{headers:{Authorization:bearer}});
 if(!r.ok)throw r.status===401?401:503;
 const user=await r.json();if(!uuid.test(user?.userId??''))throw 401;return user.userId;
}
export default {
 async fetch(request,env){
  if(env.SANDBOX_ENABLED!=='true'||!env.DOKU_CLIENT_ID||!env.DOKU_SECRET||!env.AUTH||!env.DATABASE||!env.ALLOWED_ORIGIN)return reply(503);
  const config={enabled:true,environment:'sandbox',clientId:env.DOKU_CLIENT_ID,secret:env.DOKU_SECRET,notificationPath:'/doku/notifications'};
  try{
   const url=new URL(request.url);if(url.search)throw 400;
   if(url.pathname===config.notificationPath){
    if(request.method!=='POST')throw 405;
    const rawBody=await bounded(request,65536);
    // Fetch Headers folds duplicate fields with commas. Metadata/sig validators reject folded values.
    const headers=Object.fromEntries(request.headers);
    let event,invoice;
    try {
     const expected=signRequest({clientId:headers['client-id'],requestId:headers['request-id'],timestamp:headers['request-timestamp'],target:config.notificationPath},rawBody,config.secret);
     const received=headers.signature;
     if(headers['client-id']!==config.clientId||typeof received!=='string'||!/^HMACSHA256=[A-Za-z0-9+/]{43}=$/.test(received)||!timingSafeEqual(Buffer.from(received),Buffer.from(expected)))throw Error();
     const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(rawBody));
     invoice=payload?.order?.invoice_number;if(!invoicePattern.test(invoice??''))throw Error();
    }catch{throw 400;}
    const order=await rpc(env,'snapshot',[invoice]);if(!order)throw 409;
    try{event=inspectNotification(config,{method:'POST',path:config.notificationPath,headers,rawBody},order);}catch{throw 400;}
    // Provider transaction timestamp is NOT activation start. Proposal uses server receipt time.
    const outcome=await rpc(env,'accept',[config.clientId,headers['request-id'],event.payloadHash,invoice,order.requestId,order.amount,event.action,new Date().toISOString()]);
    if(outcome==='conflict')throw 409;
    return reply(200,{received:true,grantsAccess:false});
   }
   if(url.pathname==='/invoices'&&request.method==='POST'){
    if(request.headers.get('origin')!==env.ALLOWED_ORIGIN)throw 403;
    const user=await identity(request,env);
    let body;try{body=JSON.parse((await bounded(request,1024)).toString('utf8'));}catch(e){throw typeof e==='number'?e:400;}
    if(!body||Object.keys(body).join(',')!=='workspaceId'||!uuid.test(body.workspaceId))throw 400;
    const invoice='S'+randomUUID().replaceAll('-','').slice(0,29);
    return reply(201,await rpc(env,'reserve',[user,body.workspaceId,config.clientId,invoice,randomUUID()]));
   }
   if(url.pathname.startsWith('/invoices/')&&request.method==='GET'){
    const invoice=url.pathname.slice(10);if(!invoicePattern.test(invoice))throw 400;
    return reply(200,await rpc(env,'status',[await identity(request,env),invoice]));
   }
   return reply(404);
  }catch(error){return reply([400,401,403,405,409,413,503].includes(error)?error:503);}
 }
};
