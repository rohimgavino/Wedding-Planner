import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
const uid='11111111-1111-4111-8111-111111111111', wid='22222222-2222-4222-8222-222222222222';
export async function setup(path) {
 const db=new PGlite(path);
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE TABLE public.workspaces(id uuid PRIMARY KEY); CREATE TABLE public.workspace_members(workspace_id uuid,user_id uuid,role text); CREATE TABLE public.package_price_versions(version bigint PRIMARY KEY,amount_idr bigint,UNIQUE(version,amount_idr)); CREATE TABLE public.package_price_current(id boolean,version bigint); INSERT INTO auth.users VALUES('${uid}'); INSERT INTO public.workspaces VALUES('${wid}'); INSERT INTO public.workspace_members VALUES('${wid}','${uid}','owner'); INSERT INTO public.package_price_versions VALUES(1,250000); INSERT INTO public.package_price_current VALUES(true,1);`);
 await db.exec(await readFile(new URL('../services/doku-sandbox/durable.sql',import.meta.url),'utf8'));
 return db;
}
export {uid,wid};
test('durable inbox atomically deduplicates event and invoice; ignored/out of order cannot revoke',async()=>{
 const db=await setup();
 try {
 await db.query('SELECT doku_sandbox.reserve($1,$2,$3,$4,$5)',[uid,wid,'merchant','invoice1','request1']);
 const accept=(id,hash='a'.repeat(64),action='sandbox-payment-candidate',amount=250000)=>db.query('SELECT doku_sandbox.accept($1,$2,$3,$4,$5,$6,$7,$8) AS data',['merchant',id,hash,'invoice1','request1',amount,action,'2024-02-29T17:30:00Z']);
 assert.equal((await accept('e1')).rows[0].data,'record-candidate');
 assert.equal((await accept('e1')).rows[0].data,'duplicate-event');
 assert.equal((await accept('e1','b'.repeat(64))).rows[0].data,'conflict');
 assert.equal((await accept('e2')).rows[0].data,'duplicate-payment');
 assert.equal((await accept('e3','c'.repeat(64),'ignore')).rows[0].data,'record-ignored');
 await assert.rejects(accept('e4','d'.repeat(64),'sandbox-payment-candidate',1),/order mismatch/);
 await assert.rejects(accept('e4','d'.repeat(64),'sandbox-payment-candidate',null),/order mismatch/);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM doku_sandbox.inbox')).rows[0].n,3);
 const c=(await db.query('SELECT proposed_end FROM doku_sandbox.candidates')).rows[0];
 assert.equal(new Date(c.proposed_end).toISOString(),'2025-02-28T17:30:00.000Z');
 assert.equal((await db.query('SELECT count(*)::int AS n FROM doku_sandbox.candidates')).rows[0].n,1);
 await assert.rejects(db.exec("UPDATE doku_sandbox.invoices SET amount_idr=1"),/immutable/);
 await db.exec("CREATE FUNCTION public.fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'late fail'; END $$; CREATE TRIGGER fail_audit BEFORE INSERT ON doku_sandbox.audit FOR EACH ROW EXECUTE FUNCTION public.fail_audit();");
 await assert.rejects(accept('e5'),/late fail/);
 assert.equal((await db.query("SELECT count(*)::int AS n FROM doku_sandbox.inbox WHERE event_id='e5'")).rows[0].n,0);
 } finally {await db.close();}
});

test('API roles denied even with accidental table grants by deny-default RLS',async()=>{
 const db=await setup(); try {
 await db.exec('GRANT USAGE ON SCHEMA doku_sandbox TO authenticated; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA doku_sandbox TO authenticated; SET ROLE authenticated;');
 assert.equal((await db.query('SELECT * FROM doku_sandbox.invoices')).rows.length,0);
 await assert.rejects(db.query('SELECT doku_sandbox.reserve($1,$2,$3,$4,$5)',[uid,wid,'merchant','bad','bad']),/permission denied/);
 } finally {await db.close();}
});

test('calendar-year candidate proposal clamps local leap day and preserves WIB wall time',async()=>{
 const db=await setup(); try {
 for(const [date,expected] of [['2024-02-29T05:00:00Z','2025-02-28T05:00:00.000Z'],['2023-12-31T18:00:00Z','2024-12-31T18:00:00.000Z'],['2024-02-29T17:30:00Z','2025-02-28T17:30:00.000Z']]) {
 const r=await db.query('SELECT doku_sandbox.calendar_year($1) AS expiry',[date]); assert.equal(new Date(r.rows[0].expiry).toISOString(),expected);
 }
 } finally {await db.close();}
});
// WIB midnight March 1 in the last case is March 1 next year, UTC February 28.

test('reserve persists authorized current price and cannot be altered by next price',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pw-doku-')); let db;
 try {
 db=await setup(dir);
 const q=await db.query('SELECT doku_sandbox.reserve($1,$2,$3,$4,$5) AS data',[uid,wid,'merchant','invoice1','request1']);
 assert.equal(q.rows[0].data.amount,250000);
 await db.exec('INSERT INTO public.package_price_versions VALUES(2,300000); UPDATE public.package_price_current SET version=2;');
 await db.close(); db=new PGlite(dir);
 const s=(await db.query('SELECT doku_sandbox.status($1,$2) AS data',[uid,'invoice1'])).rows[0].data;
 assert.equal(s.packageVersion,'1'); assert.equal(s.amount,250000); assert.equal(s.grantsAccess,false);
 await assert.rejects(db.query('SELECT doku_sandbox.status($1,$2)',[wid,'invoice1']),/not authorized/);
 await assert.rejects(db.query('SELECT doku_sandbox.reserve($1,$2,$3,$4,$5)',[wid,wid,'merchant','invoice2','request2']),/not authorized/);
 } finally {if(db) await db.close(); await rm(dir,{recursive:true,force:true});}
});
