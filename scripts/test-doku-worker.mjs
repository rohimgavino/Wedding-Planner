import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {signRequest} from '../services/doku-sandbox/protocol.mjs';
const require=createRequire('D:/pocketwedding-local-tools/doku-runtime/package.json');
const {Miniflare:RealMiniflare}=require('miniflare');
// Direct Fetch execution verifies the same HTTP contract when workerd crashes on this host.
class DirectFetch {
 constructor(config){this.config=config;}
 async dispatchFetch(url,init){const {default:worker}=await import('../services/doku-sandbox/worker.mjs');const bindings=Object.fromEntries(Object.entries(this.config.serviceBindings??{}).map(([key,fetch])=>[key,{fetch:(url,init)=>fetch(new Request(url,init))}]));return worker.fetch(new Request(url,init),{...this.config.bindings,...bindings});}
 async dispose(){}
}
const Miniflare=process.argv.includes('--direct-fetch')?DirectFetch:RealMiniflare;
test((Miniflare===DirectFetch?'Node Fetch (NOT workerd)':'actual workerd')+' imports node-compatible protocol; fails closed by default',async()=>{
 const mf=new Miniflare({modules:true,scriptPath:'services/doku-sandbox/worker.mjs',compatibilityDate:'2025-07-18',compatibilityFlags:['nodejs_compat']});
 try{assert.equal((await mf.dispatchFetch('http://localhost/status/invoice1')).status,503);}finally{await mf.dispose();}
});
test('private Fetch HTTP contract persists signed bytes via service binding, authenticated reservation/status only',async()=>{
 const {PGlite}=await import('@electric-sql/pglite'); const db=new PGlite();
 const uid='11111111-1111-4111-8111-111111111111',wid='22222222-2222-4222-8222-222222222222';
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE TABLE public.workspaces(id uuid PRIMARY KEY); CREATE TABLE public.workspace_members(workspace_id uuid,user_id uuid,role text); CREATE TABLE public.package_price_versions(version bigint PRIMARY KEY,amount_idr bigint,UNIQUE(version,amount_idr)); CREATE TABLE public.package_price_current(id boolean,version bigint); INSERT INTO auth.users VALUES('${uid}'); INSERT INTO public.workspaces VALUES('${wid}'); INSERT INTO public.workspace_members VALUES('${wid}','${uid}','owner'); INSERT INTO public.package_price_versions VALUES(1,250000); INSERT INTO public.package_price_current VALUES(true,1);`);
 await db.exec(await readFile('services/doku-sandbox/durable.sql','utf8'));
 let outage=false;
 const mf=new Miniflare({modules:true,scriptPath:'services/doku-sandbox/worker.mjs',compatibilityDate:'2025-07-18',compatibilityFlags:['nodejs_compat'],bindings:{SANDBOX_ENABLED:'true',DOKU_CLIENT_ID:'merchant',DOKU_SECRET:'synthetic-only',ALLOWED_ORIGIN:'https://planner.invalid'},serviceBindings:{
 AUTH:async req=> new Response(JSON.stringify({userId:uid}),{status:req.headers.get('authorization')==='Bearer fixture'?200:401}),
 DATABASE:async req=>{if(outage)return new Response('',{status:503}); const {operation,args}=await req.json(); const f={reserve:'reserve',status:'status',snapshot:'snapshot',accept:'accept'}[operation]; if(!f)return new Response('',{status:400}); try{const r=await db.query(`SELECT doku_sandbox.${f}(${args.map((_,i)=>'$'+(i+1)).join(',')}) AS data`,args);return Response.json(r.rows[0].data);}catch{return new Response('',{status:403});}}
 }});
 try{
 const call=(path,init)=>mf.dispatchFetch('https://payments.invalid'+path,init);
 assert.equal((await call('/invoices',{method:'POST',body:'{}'})).status,403);
 const headers={authorization:'Bearer fixture',origin:'https://planner.invalid','content-type':'application/json'};
 const r=await call('/invoices',{method:'POST',headers,body:JSON.stringify({workspaceId:wid})});assert.equal(r.status,201);const order=await r.json();assert.equal(order.amount,250000);assert.equal(order.grantsAccess,false);
 assert.equal((await call('/invoices/'+order.invoice,{headers:{authorization:'Bearer fixture'}})).status,200);
 assert.equal((await call('/invoices/'+order.invoice)).status,401);
 const raw=Buffer.from(JSON.stringify({order:{invoice_number:order.invoice,amount:250000},transaction:{original_request_id:order.requestId,date:'2026-10-22T00:00:00Z',status:'SUCCESS'}}));
 const meta={clientId:'merchant',requestId:'event1',timestamp:'2026-10-22T00:00:00Z',target:'/doku/notifications'};
 const wh={'Client-Id':'merchant','Request-Id':'event1','Request-Timestamp':meta.timestamp,Signature:signRequest(meta,raw,'synthetic-only'),'Content-Type':'application/json'};
 assert.equal((await call(meta.target,{method:'POST',headers:wh,body:Buffer.concat([raw,Buffer.from(' ')])})).status,400);
 outage=true;assert.equal((await call(meta.target,{method:'POST',headers:wh,body:raw})).status,503);outage=false;
 assert.equal((await call(meta.target,{method:'POST',headers:wh,body:raw})).status,200);
 assert.equal((await call(meta.target,{method:'POST',headers:wh,body:raw})).status,200);
 assert.equal((await db.query('SELECT count(*)::int n FROM doku_sandbox.candidates')).rows[0].n,1);
 const status=await (await call('/invoices/'+order.invoice,{headers:{authorization:'Bearer fixture'}})).json();assert.equal(status.state,'sandbox-candidate');assert.equal(status.grantsAccess,false);
 assert.equal((await call('/checkout',{method:'POST',headers})).status,404);
 }finally{await mf.dispose();await db.close();}
});
