import { PGlite } from '@electric-sql/pglite';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003');`);
await db.exec(readFileSync('supabase/migrations/202610120001_secure_foundation.sql','utf8'));
const migration='supabase/migrations/202610140001_workspace_entitlements_savings.sql';
if(existsSync(migration)) await db.exec(readFileSync(migration,'utf8'));
await db.exec(readFileSync('supabase/activation/paid-enforcement.sql','utf8'));
const user=async n=>db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000${n}',false)`);
let passed=0;
const test=async(name,fn)=>{await fn();console.log(`PASS ${++passed}: ${name}`)};
await user(1);
const ws=(await db.query("SELECT public.create_workspace('Paid','2027-01-01') id")).rows[0].id;
await test('unentitled workspace cannot write paid core',async()=>{
 for(const [table,columns,values] of [['tasks','title,phase',"'Denied','Hari H'"],['budgets','category,title',"'Other','Denied'"],['guests','name',"'Denied'"],['savings_accounts','account_name',"'Denied'"]]) {
  await assert.rejects(db.query(`INSERT INTO public.${table}(workspace_id,${columns}) VALUES($1,${values})`,[ws]),/row-level security/);
 }
});
await test('member cannot grant own entitlement, even with widened grants',async()=>{
 await db.exec('RESET ROLE; GRANT ALL ON public.workspace_entitlements TO authenticated');await user(1);
 await assert.rejects(db.query("INSERT INTO public.workspace_entitlements(workspace_id,feature,verified_by,payment_reference) VALUES($1,'core','fake','fake')",[ws]),/row-level security/);
 await db.exec('RESET ROLE; REVOKE ALL ON public.workspace_entitlements FROM authenticated; GRANT SELECT ON public.workspace_entitlements TO authenticated');
});
await db.exec('RESET ROLE');
await db.query("INSERT INTO public.workspace_entitlements(workspace_id,feature,verified_by,payment_reference) VALUES($1,'core','local-test-admin','LOCAL-ONLY')",[ws]);
await user(1);
const token=(await db.query('SELECT public.create_partner_invitation($1) token',[ws])).rows[0].token;
await user(2);await db.query('SELECT public.accept_partner_invitation($1)',[token]);
await test('paid core shared by both members, add-ons do not follow core',async()=>{
 assert.equal((await db.query("SELECT public.has_workspace_entitlement($1,'core') allowed",[ws])).rows[0].allowed,true);
 assert.equal((await db.query("SELECT public.has_workspace_entitlement($1,'lamaran') allowed",[ws])).rows[0].allowed,false);
 await db.query("INSERT INTO public.tasks(workspace_id,title,phase) VALUES($1,'Allowed','Hari H')",[ws]);
});
let row;
await test('partners record and edit contributions with shared total',async()=>{
 await user(1); row=(await db.query("INSERT INTO public.savings_contributions(workspace_id,contributor_id,amount,contributed_on,notes) VALUES($1,auth.uid(),100,'2026-10-14','First') RETURNING id",[ws])).rows[0].id;
 await user(2);await db.query("INSERT INTO public.savings_contributions(workspace_id,contributor_id,amount,contributed_on) VALUES($1,auth.uid(),200,'2026-10-14')",[ws]);
 await db.query('UPDATE public.savings_contributions SET amount=150 WHERE id=$1',[row]);
 assert.equal(Number((await db.query('SELECT sum(amount) total FROM public.savings_contributions WHERE workspace_id=$1',[ws])).rows[0].total),350);
});
await test('invalid money and nonmember attribution rejected by SQL',async()=>{
 for(const amount of [-1,0,9007199254740992]) await assert.rejects(db.query("INSERT INTO public.savings_contributions(workspace_id,contributor_id,amount,contributed_on) VALUES($1,auth.uid(),$2,'2026-10-14')",[ws,amount]),/check constraint/);
 await assert.rejects(db.query("INSERT INTO public.savings_contributions(workspace_id,contributor_id,amount,contributed_on) VALUES($1,'00000000-0000-0000-0000-000000000003',1,'2026-10-14')",[ws]),/foreign key/);
});
await test('outsider cannot read entitlements or ledger or mutate paid data',async()=>{
 await user(3);
 for(const table of ['workspace_entitlements','savings_contributions','tasks']) assert.equal((await db.query(`SELECT * FROM public.${table} WHERE workspace_id=$1`,[ws])).rows.length,0);
 assert.equal((await db.query("SELECT public.has_workspace_entitlement($1,'core') allowed",[ws])).rows[0].allowed,false);
 await assert.rejects(db.query("INSERT INTO public.savings_contributions(workspace_id,contributor_id,amount,contributed_on) VALUES($1,auth.uid(),1,'2026-10-14')",[ws]),/row-level security/);
 assert.equal((await db.query('DELETE FROM public.savings_contributions WHERE id=$1 RETURNING id',[row])).rows.length,0);
});
await test('ledger tenant moves blocked even for dual member; partner delete works',async()=>{
 await user(1);const other=(await db.query("SELECT public.create_workspace('Other','2027-01-01') id")).rows[0].id;
 await db.exec('RESET ROLE');await db.query("INSERT INTO public.workspace_entitlements(workspace_id,feature,verified_by,payment_reference) VALUES($1,'core','local-test-admin','LOCAL-OTHER')",[other]);await user(1);
 await assert.rejects(db.query('UPDATE public.savings_contributions SET workspace_id=$1 WHERE id=$2',[other,row]),/immutable workspace/);
 await user(2);assert.equal((await db.query('DELETE FROM public.savings_contributions WHERE id=$1 RETURNING id',[row])).rows.length,1);
});
await test('revocation and expiry immediately deny core; metadata remains accessible',async()=>{
 await db.exec('RESET ROLE');await db.query("UPDATE public.workspace_entitlements SET revoked_at=now() WHERE workspace_id=$1",[ws]);await user(1);
 assert.equal((await db.query('SELECT * FROM public.savings_contributions WHERE workspace_id=$1',[ws])).rows.length,0);
 assert.equal((await db.query('SELECT * FROM public.workspaces WHERE id=$1',[ws])).rows.length,1);
 for(const [table,columns,values] of [['tasks','title,phase',"'Denied','Hari H'"],['budgets','category,title',"'Other','Denied'"],['guests','name',"'Denied'"],['savings_accounts','account_name',"'Denied'"]]) {
  await assert.rejects(db.query(`INSERT INTO public.${table}(workspace_id,${columns}) VALUES($1,${values})`,[ws]),/row-level security/);
 }
 await db.exec('RESET ROLE');await db.query("UPDATE public.workspace_entitlements SET revoked_at=null,expires_at=now()-interval '1 second' WHERE workspace_id=$1",[ws]);await user(1);
 assert.equal((await db.query("SELECT public.has_workspace_entitlement($1,'core') allowed",[ws])).rows[0].allowed,false);
});
await test('anonymous ledger and entitlement access denied',async()=>{
 await db.exec('RESET ROLE; SET ROLE anon');
 for(const table of ['workspace_entitlements','savings_contributions']) await assert.rejects(db.query(`SELECT * FROM public.${table}`),/permission denied/);
 await assert.rejects(db.query("SELECT public.has_workspace_entitlement($1,'core')",[ws]),/permission denied/);
});
await db.close();console.log(`${passed} paid-stage SQL tests passed`);
