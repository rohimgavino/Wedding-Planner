import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA public,auth TO anon,authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated; INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'),('00000000-0000-0000-0000-000000000003');`);
const apply=async p=>db.exec(readFileSync('supabase/migrations/'+p,'utf8'));
const user=async n=>{await db.exec('RESET ROLE; SET ROLE authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[`00000000-0000-0000-0000-00000000000${n}`]);};
await apply('202610120001_secure_foundation.sql');
const spaces=[];for(const n of [1,2]){await user(n);const w=(await db.query("select public.create_workspace('Existing','2027-01-01') id")).rows[0].id;spaces.push(w);await db.query("insert into public.tasks(workspace_id,title,phase,pic) values($1,'Preserved','H-6 Bulan','both')",[w]);}
await db.exec('RESET ROLE');for(const p of ['202610140001_workspace_entitlements_savings.sql','202610140002_admin_manual_purchases.sql','202610140003_reset_planning_content.sql','202610140004_developer_operator_roles.sql'])await apply(p);
for(const n of [1,2]){await user(n);assert.equal((await db.query('select * from public.tasks')).rows.length,1,'expand upgrade must preserve existing unentitled planner');await db.query("insert into public.tasks(workspace_id,title,phase,pic) values($1,'Still writable','H-6 Bulan','both')",[spaces[n-1]]);}
console.log('PASS existing two workspace upgrade without locks');
await db.exec('RESET ROLE');await db.exec("insert into public.site_admins(user_id,role) values('00000000-0000-0000-0000-000000000001','developer'),('00000000-0000-0000-0000-000000000002','operator')");
await user(2);await assert.rejects(db.query("select public.set_site_admin(auth.uid(),'developer','escalate')"),/developer required/);await assert.rejects(db.query('select * from public.list_site_admins()'),/developer required/);assert.equal((await db.query('select * from public.tasks')).rows.length,2);
await assert.rejects(db.query("select public.save_site_settings('help@example.com',100,30,'https://lynk.id/shop/item',true)"),/sales activation required/);
await assert.rejects(db.query("select public.verify_core_purchase('00000000-0000-0000-0000-000000000003','REAL',100,true,'blocked')"),/sales activation required/);
await assert.rejects(db.query("select public.reset_planning_content($1,'RESET RENCANA')",[spaces[1]]),/permission denied/);
await user(3);await assert.rejects(db.query("select public.set_site_admin(auth.uid(),'developer','self')"),/developer required/);assert.equal((await db.query('select * from public.tasks')).rows.length,0);
await db.exec('RESET ROLE; GRANT ALL ON public.site_admins TO authenticated');await user(3);await assert.rejects(db.query('insert into public.site_admins(user_id) values(auth.uid())'),/row-level security/);
await user(1);await assert.rejects(db.query("select public.set_site_admin(auth.uid(),null,'last')"),/last developer/);await db.query("select public.grant_developer_test_access($1,7,'own local test')",[spaces[0]]);
console.log('PASS operator restrictions, no escalation, last developer, own nonpayment grant, SQL sales/reset gates');
await db.exec('RESET ROLE');await db.exec(readFileSync('supabase/activation/paid-enforcement.sql','utf8'));await user(2);assert.equal((await db.query('select * from public.tasks')).rows.length,0);await user(1);assert.equal((await db.query('select * from public.tasks')).rows.length,2);
console.log('PASS deliberate paid activation denies operator unentitled, preserves developer own grant');await db.close();
