import { PGlite } from '@electric-sql/pglite';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA public,auth TO anon,authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated; INSERT INTO auth.users SELECT ('00000000-0000-0000-0000-00000000000'||n)::uuid FROM generate_series(1,4) n;`);
for (const file of ['202610120001_secure_foundation.sql','202610140001_workspace_entitlements_savings.sql','202610140002_admin_manual_purchases.sql','202610140003_reset_planning_content.sql']) if(existsSync('supabase/migrations/'+file)) await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
await db.exec(readFileSync('supabase/activation/paid-enforcement.sql','utf8'));
await db.exec(readFileSync('supabase/activation/reset-execute.sql','utf8'));
const user = async n => db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000${n}',false)`);
await user(1);
const ws=(await db.query("select public.create_workspace('Identity preserved','2027-01-01') id")).rows[0].id;
const token=(await db.query('select public.create_partner_invitation($1) token',[ws])).rows[0].token;
await user(2);await db.query('select public.accept_partner_invitation($1)',[token]);
await user(4);const other=(await db.query("select public.create_workspace('Other tenant','2027-02-01') id")).rows[0].id;
await db.exec("RESET ROLE; INSERT INTO public.site_admins(user_id) VALUES('00000000-0000-0000-0000-000000000003')");
await db.query("INSERT INTO public.workspace_entitlements(workspace_id,feature,payment_reference,verified_by,expires_at) VALUES($1,'core','RESET-TEST','fixture',now()+interval '1 day')",[ws]);
await db.query("INSERT INTO public.verified_transactions(reference,workspace_id) VALUES('RESET-TEST',$1)",[ws]);
await db.query("INSERT INTO public.purchase_requests(workspace_id,requested_by,price_idr,duration_days,lynk_url) VALUES($1,'00000000-0000-0000-0000-000000000001',100,30,'https://lynk.id/fixture/product')",[ws]);
await db.query("INSERT INTO public.savings_accounts(workspace_id,account_name,current_balance) VALUES($1,'Legacy preserved',456)",[ws]);
const seed=async id=>{
 await db.exec('RESET ROLE');
 await db.query("INSERT INTO public.budgets(workspace_id,category,title,allocated_amount) VALUES($1,'Venue','Fixture',100)",[id]);
 await db.query("INSERT INTO public.tasks(workspace_id,title,phase) VALUES($1,'Fixture','H-3 Bulan')",[id]);
 await db.query("INSERT INTO public.guests(workspace_id,name) VALUES($1,'Fixture')",[id]);
 const member=(await db.query('select user_id from public.workspace_members where workspace_id=$1 and role=\'owner\'',[id])).rows[0].user_id;
 await db.query("INSERT INTO public.savings_contributions(workspace_id,contributor_id,amount,contributed_on) VALUES($1,$2,123,'2026-10-14')",[id,member]);
};
await seed(ws);await seed(other);
const planning=['budgets','tasks','guests','savings_contributions'];
const snapshot=async()=>{await db.exec('RESET ROLE');const result={};for(const t of ['workspaces','workspace_members','invitations','auth.users','workspace_entitlements','purchase_requests','verified_transactions','savings_accounts'])result[t]=(await db.query(`select * from ${t.includes('.')?t:'public.'+t} order by 1`)).rows;return result;};
await db.exec("RESET ROLE; INSERT INTO public.admin_audit(actor_id,action,details) VALUES('00000000-0000-0000-0000-000000000003','fixture.prior-audit','{\"keep\":true}')");
const priorAudit=(await db.query('select * from public.admin_audit order by id')).rows;
const before=await snapshot();
const reset=()=>db.query("select public.reset_planning_content($1,'RESET RENCANA') result",[ws]);
let passed=0;const test=async(name,fn)=>{await fn();console.log(`PASS ${++passed}: ${name}`);};
await test('owner atomically clears only four planning datasets with audit',async()=>{
 await user(1);const result=(await reset()).rows[0].result;
 assert.deepEqual(result,{budgets:1,tasks:1,guests:1,savings_contributions:1});
 assert.deepEqual(await snapshot(),before);
 for(const t of planning){assert.equal((await db.query(`select * from public.${t} where workspace_id=$1`,[ws])).rows.length,0);assert.equal((await db.query(`select * from public.${t} where workspace_id=$1`,[other])).rows.length,1);}
 assert.equal((await db.query("select * from public.admin_audit where action='planning.reset' and subject_id=$1",[ws])).rows.length,1);
 assert.deepEqual((await db.query("select * from public.admin_audit where action<>'planning.reset' order by id")).rows,priorAudit);
});
await seed(ws);
await test('partner outsider unrelated admin nonexistent workspace and anonymous denied',async()=>{
 for(const n of [2,3,4]){await user(n);await assert.rejects(reset(),/owner required/);}
 await user(1);await assert.rejects(db.query("select public.reset_planning_content('ffffffff-ffff-ffff-ffff-ffffffffffff','RESET RENCANA')"),/owner required/);
 await db.exec('RESET ROLE; SET ROLE anon');await assert.rejects(reset(),/permission denied/);
 await db.exec("RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','',false)");await assert.rejects(reset(),/authentication required/);
});
await test('exact explicit confirmation required',async()=>{
 await user(1);for(const text of [null,'','reset rencana','RESET']) await assert.rejects(db.query('select public.reset_planning_content($1,$2)',[ws,text]),/confirmation required/);
});
await test('late SQL failure rolls back every delete and audit',async()=>{
 await db.exec("RESET ROLE; CREATE FUNCTION public.fixture_fail_reset() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture blocked'; END $$; CREATE TRIGGER fixture_reset_failure BEFORE DELETE ON public.savings_contributions FOR EACH ROW EXECUTE FUNCTION public.fixture_fail_reset()");
 const auditBefore=(await db.query('select * from public.admin_audit order by id')).rows;
 await user(1);await assert.rejects(reset(),/fixture blocked/);
 await db.exec('RESET ROLE');for(const t of planning)assert.equal((await db.query(`select * from public.${t} where workspace_id=$1`,[ws])).rows.length,1);
 assert.deepEqual((await db.query('select * from public.admin_audit order by id')).rows,auditBefore);
 assert.deepEqual(await snapshot(),before);
 await db.exec('DROP TRIGGER fixture_reset_failure ON public.savings_contributions; DROP FUNCTION public.fixture_fail_reset()');
});
await test('expired entitlement does not prevent owner cleanup; repeat safely returns zeros',async()=>{
 await db.exec('RESET ROLE');await db.query("update public.workspace_entitlements set expires_at=now()-interval '1 day' where workspace_id=$1",[ws]);
 await user(1);assert.deepEqual((await reset()).rows[0].result,{budgets:1,tasks:1,guests:1,savings_contributions:1});
 assert.deepEqual((await reset()).rows[0].result,{budgets:0,tasks:0,guests:0,savings_contributions:0});
});
await db.close();console.log(`${passed} planning reset SQL tests passed (local PGlite only)`);
