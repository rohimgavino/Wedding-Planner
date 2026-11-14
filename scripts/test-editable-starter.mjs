import { PGlite } from '@electric-sql/pglite';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { installHostedPlannerFixture } from './fixtures/hosted-planner-schema.mjs';
const db=new PGlite();
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA public,auth TO anon,authenticated; INSERT INTO auth.users SELECT ('00000000-0000-0000-0000-00000000000'||n)::uuid FROM generate_series(1,3) n;`);
for(const f of ['202610120001_secure_foundation.sql','202610140001_workspace_entitlements_savings.sql','202610140002_admin_manual_purchases.sql','202610140004_developer_operator_roles.sql'])await db.exec(readFileSync('supabase/migrations/'+f,'utf8'));
await installHostedPlannerFixture(db);
await db.exec(readFileSync('supabase/activation/paid-enforcement.sql','utf8'));
const candidate='supabase/candidates/202611140002_editable_starter.sql';
await db.exec('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon,authenticated,service_role');
if(existsSync(candidate))await db.exec(readFileSync(candidate,'utf8'));
for(const role of ['anon','service_role'])assert.equal((await db.query("select has_function_privilege($1,'public.apply_editable_starter_v1(uuid,text)','EXECUTE') allowed",[role])).rows[0].allowed,false,role+' must not execute');
assert.equal((await db.query("select has_function_privilege('authenticated','public.apply_editable_starter_v1(uuid,text)','EXECUTE') allowed")).rows[0].allowed,true);
assert.equal((await db.query("select has_function_privilege(current_user,'public.apply_editable_starter_v1(uuid,text)','EXECUTE') allowed")).rows[0].allowed,true); // owner/admin retains implicit object powers
console.log('PASS effective RPC ACL with hosted-style default grants: authenticated allowed, anon/service_role denied; owner retains powers');
const user=async n=>db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000${n}',false)`);
await user(1);const ws=(await db.query("select public.create_workspace('Local','2027-01-01') id")).rows[0].id;
const apply=()=>db.query("select public.apply_editable_starter_v1($1,'TAMBAH TEMPLATE') result",[ws]);
await apply();
await db.exec('RESET ROLE');
assert.equal((await db.query('select * from public.budgets')).rows.length,8);
assert.equal((await db.query('select * from public.tasks')).rows.length,8);
assert((await db.query('select * from public.budgets')).rows.every(r=>r.allocated_amount===0 && r.spent_amount===0 && r.payment_status==='unpaid'));
assert((await db.query('select * from public.tasks')).rows.every(r=>r.due_date===null && !r.is_completed));
for(const t of ['guests','savings_contributions','vendors','vendor_payments','vendor_installments'])assert.equal((await db.query('select * from public.'+t)).rows.length,0);
console.log('PASS zero-value editable preparation only (actual SQL body)');
const before={};
for(const t of ['budgets','tasks','workspaces','workspace_members'])before[t]=(await db.query('select * from public.'+t+' order by id')).rows;
await user(1);assert.equal((await apply()).rows[0].result.already_applied,true);
await db.exec('RESET ROLE');for(const t of Object.keys(before))assert.deepEqual((await db.query('select * from public.'+t+' order by id')).rows,before[t]);
console.log('PASS durable repeat receipt preserves rows');
await user(1);const token=(await db.query('select public.create_partner_invitation($1) token',[ws])).rows[0].token;
await user(2);await db.query('select public.accept_partner_invitation($1)',[token]);
for(const n of [2,3]){await user(n);await assert.rejects(apply(),/owner required/);}
await db.exec('RESET ROLE; SET ROLE anon');await assert.rejects(apply(),/permission denied/);
await db.exec("RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','',false)");await assert.rejects(apply(),/authentication required/);
await user(1);await assert.rejects(db.query("select public.apply_editable_starter_v1($1,'wrong')",[ws]),/confirmation required/);
assert.equal((await db.query('select * from public.budgets')).rows.length,0);
await assert.rejects(db.query("insert into public.tasks(workspace_id,title,phase) values($1,'Denied','H-3 Bulan')",[ws]),/row-level security/);
await assert.rejects(db.query('delete from editable_starter_private.receipts'),/permission denied/);
console.log('PASS partner/outsider/anon/confirmation guards; unpaid reads and CRUD remain locked');
await user(1);const ws2=(await db.query("select public.create_workspace('Existing','2027-01-01') id")).rows[0].id;
await db.exec('RESET ROLE');
await db.query("insert into public.budgets(workspace_id,category,title,allocated_amount) values($1,'Venue','My real plan',123)",[ws2]);
const existing=(await db.query('select * from public.budgets where workspace_id=$1',[ws2])).rows[0];
await db.exec("CREATE FUNCTION public.fixture_block() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture blocked'; END $$; CREATE TRIGGER fixture_block BEFORE INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.fixture_block()");
await user(1);await assert.rejects(db.query("select public.apply_editable_starter_v1($1,'TAMBAH TEMPLATE')",[ws2]),/fixture blocked/);
await db.exec('RESET ROLE');assert.deepEqual((await db.query('select * from public.budgets where workspace_id=$1',[ws2])).rows,[existing]);assert.equal((await db.query('select * from editable_starter_private.receipts where workspace_id=$1',[ws2])).rows.length,0);
await db.exec('DROP TRIGGER fixture_block ON public.tasks; DROP FUNCTION public.fixture_block()');
await user(1);await db.query("select public.apply_editable_starter_v1($1,'TAMBAH TEMPLATE')",[ws2]);
await db.exec('RESET ROLE');assert.deepEqual((await db.query('select * from public.budgets where id=$1',[existing.id])).rows,[existing]);
// Simulate owner reset deleting template rows: receipt deliberately survives.
await db.query('delete from public.tasks where workspace_id=$1',[ws2]);
await user(1);assert.equal((await db.query("select public.apply_editable_starter_v1($1,'TAMBAH TEMPLATE') result",[ws2])).rows[0].result.already_applied,true);
await db.exec('RESET ROLE');assert.equal((await db.query('select * from public.tasks where workspace_id=$1',[ws2])).rows.length,0);
console.log('PASS SQL failure atomic rollback, existing records unchanged, reset/delete never re-seeds');
// Private receipt is not a client API, including read/insert/update.
for (const role of ['authenticated','anon']) {
 await db.exec(`RESET ROLE; SET ROLE ${role}`);
 for (const sql of ['select * from editable_starter_private.receipts', `insert into editable_starter_private.receipts(workspace_id,applied_by) values('${ws}',null)`, 'update editable_starter_private.receipts set applied_by=null']) await assert.rejects(db.query(sql),/permission denied/);
}
await db.exec('RESET ROLE');
// Keep the workspace/receipt but remove its recorded applier (not its owner).
await db.query('update editable_starter_private.receipts set applied_by=$1 where workspace_id=$2',['00000000-0000-0000-0000-000000000003',ws2]);
await db.query('delete from auth.users where id=$1',['00000000-0000-0000-0000-000000000003']);
assert.equal((await db.query('select applied_by from editable_starter_private.receipts where workspace_id=$1',[ws2])).rows[0].applied_by,null);
await user(1);assert.equal((await db.query("select public.apply_editable_starter_v1($1,'TAMBAH TEMPLATE') result",[ws2])).rows[0].result.already_applied,true);
await db.exec('RESET ROLE');assert.equal((await db.query('select * from public.tasks where workspace_id=$1',[ws2])).rows.length,0);
console.log('PASS receipt applier deletion retains nullable receipt/no reseed; authenticated/anon SELECT INSERT UPDATE denied');
await db.close();
