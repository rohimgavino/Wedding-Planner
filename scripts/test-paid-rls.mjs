import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { installHostedPlannerFixture } from './fixtures/hosted-planner-schema.mjs';

// Real PostgreSQL SQL/RLS, disposable local database; no network or environment secrets.
const db = new PGlite();
const migration = 'supabase/migrations/202611140001_paid_access_rls.sql';
const mode = process.argv.includes('--baseline') ? 'baseline' : 'migration';
const uuid = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const user = async n => {
  await db.exec('RESET ROLE; SET ROLE authenticated');
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [uuid(n)]);
};
let passed = 0;
const test = async (name, fn) => { await fn(); console.log(`PASS ${++passed}: ${name}`); };
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;`);
for (let n=1;n<=6;n++) await db.query("INSERT INTO auth.users VALUES($1,'spoof@example.test','{\"role\":\"developer\"}')",[uuid(n)]);
for (const file of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort()) {
  if (file !== migration.split('/').at(-1)) await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
}
await installHostedPlannerFixture(db);
await user(1);
const ws=(await db.query("SELECT public.create_workspace('Existing paid couple','2027-01-01') id")).rows[0].id;
const token=(await db.query('SELECT public.create_partner_invitation($1) token',[ws])).rows[0].token;
await user(2); await db.query('SELECT public.accept_partner_invitation($1)',[token]);
const specs = [
  ['budgets','category,title',"'Other','Existing'",'title'],
  ['tasks','title,phase',"'Existing','Hari H'",'title'],
  ['guests','name',"'Existing'",'name'],
  ['savings_accounts','account_name',"'Existing'",'account_name'],
  ['savings_contributions','contributor_id,amount,contributed_on',`'${uuid(1)}',100,'2026-11-14'`,'notes'],
  ['vendors','name',"'Existing'",'name'],
  ['vendor_installments','vendor_id,title,amount,due_date',"(SELECT id FROM public.vendors WHERE workspace_id=$1 LIMIT 1),'Existing',100,'2027-01-01'",'title'],
  ['vendor_payments','installment_id,amount,paid_on',"(SELECT id FROM public.vendor_installments WHERE workspace_id=$1 LIMIT 1),100,'2026-11-14'",'notes'],
];
await db.exec('RESET ROLE');
await db.query("INSERT INTO public.workspace_entitlements(workspace_id,feature,payment_provider,payment_reference,verified_by,expires_at) VALUES($1,'core','doku','LOCAL-EXISTING-PAID','local-fixture',now()+interval '1 year')",[ws]);
const rows=[];
for(const [t,cols,values] of specs) rows.push((await db.query(`INSERT INTO public.${t}(workspace_id,${cols}) VALUES($1,${values}) RETURNING id`,[ws])).rows[0].id);
const snapshot=async()=> (await db.query(`SELECT jsonb_build_object(
 'entitlements',(SELECT jsonb_agg(to_jsonb(e)) FROM public.workspace_entitlements e),
 'release',(SELECT jsonb_agg(to_jsonb(r)) FROM public.release_controls r),
 'settings',(SELECT jsonb_agg(to_jsonb(s)) FROM public.site_settings s),
 'planner',(${specs.map(([t])=>`SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM public.${t} x`).map(q=>`(${q})`).join(' || ')}),
 'functions',(SELECT jsonb_agg(jsonb_build_array(p.oid,pg_get_functiondef(p.oid)) ORDER BY p.oid) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f')) data`)).rows[0].data;
const before=await snapshot();
if(mode==='baseline') {
  // Reproduce the existing five-table candidate: vendors are still exposed.
  await db.exec(readFileSync(migration,'utf8').replace(",'vendors','vendor_installments','vendor_payments'",''));
  await db.query("UPDATE public.workspace_entitlements SET feature='premium' WHERE workspace_id=$1",[ws]);
  await user(1);
  const exposed=[];
  for(const [t,cols,values,col] of specs.slice(5)) {
    const count=(await db.query(`SELECT id FROM public.${t} WHERE workspace_id=$1`,[ws])).rows.length;
    const id=(await db.query(`INSERT INTO public.${t}(workspace_id,${cols}) VALUES($1,${values}) RETURNING id`,[ws])).rows[0].id;
    const updated=(await db.query(`UPDATE public.${t} SET ${col}='Baseline exposure' WHERE id=$1 RETURNING id`,[id])).rows.length;
    const deleted=(await db.query(`DELETE FROM public.${t} WHERE id=$1 RETURNING id`,[id])).rows.length;
    exposed.push({table:t,select:count,insert:1,update:updated,delete:deleted});
  }
  console.log('BASELINE unpaid vendor CRUD exposure',JSON.stringify(exposed));
  assert.deepEqual(exposed.map(x=>x.select),[0,0,0],'all three vendor tables must deny unpaid CRUD');
}
if(mode!=='baseline') {
  assert.ok(existsSync(migration),'paid RLS migration must exist');
  const sql=readFileSync(migration,'utf8');
  assert.equal(readFileSync('supabase/activation/paid-enforcement.sql','utf8'),sql,'compatibility activation must match the canonical migration exactly');
  await db.exec(sql);
  await db.exec(readFileSync('supabase/activation/paid-enforcement.sql','utf8')); // repeatable; no policy duplicates
  assert.deepEqual(await snapshot(),before,'activation must not mutate rows/settings/functions');
}
const denyCrud=async(n,workspace)=>{
  await user(n);
  for(let i=0;i<specs.length;i++) {
    const [t,cols,values,col]=specs[i];
    assert.equal((await db.query(`SELECT id FROM public.${t} WHERE workspace_id=$1`,[workspace])).rows.length,0,`${t} SELECT denied`);
    await assert.rejects(db.query(`INSERT INTO public.${t}(workspace_id,${cols}) VALUES($1,${values})`,[workspace]),/row-level security/,`${t} INSERT denied`);
    assert.equal((await db.query(`UPDATE public.${t} SET ${col}='Blocked' WHERE workspace_id=$1 RETURNING id`,[workspace])).rows.length,0,`${t} UPDATE denied`);
    assert.equal((await db.query(`DELETE FROM public.${t} WHERE workspace_id=$1 RETURNING id`,[workspace])).rows.length,0,`${t} DELETE denied`);
  }
};
const allowCrud=async(n,workspace,contributor=1)=>{
  await user(n);
  for(const [t,cols,values,col] of specs) {
    assert.ok((await db.query(`SELECT id FROM public.${t} WHERE workspace_id=$1`,[workspace])).rows.length>0,`${t} existing row preserved`);
    const id=(await db.query(`INSERT INTO public.${t}(workspace_id,${cols}) VALUES($1,${values.replace(uuid(1),uuid(contributor))}) RETURNING id`,[workspace])).rows[0].id;
    assert.equal((await db.query(`UPDATE public.${t} SET ${col}='Shared' WHERE id=$1 RETURNING id`,[id])).rows.length,1);
    assert.equal((await db.query(`DELETE FROM public.${t} WHERE id=$1 RETURNING id`,[id])).rows.length,1);
  }
};
await test('no core: membership alone denies all eight tables CRUD',async()=>{
  await db.exec('RESET ROLE'); await db.query("UPDATE public.workspace_entitlements SET feature='premium' WHERE workspace_id=$1",[ws]);
  await denyCrud(1,ws);
  // Even locked members retain metadata, onboarding and pairing (no payment dependency).
  assert.equal((await db.query('SELECT id FROM public.workspaces WHERE id=$1',[ws])).rows.length,1);
  assert.equal((await db.query('SELECT * FROM public.workspace_members WHERE workspace_id=$1',[ws])).rows.length,2);
  assert.equal((await db.query('SELECT * FROM public.workspace_entitlements WHERE workspace_id=$1',[ws])).rows.length,1);
  const fresh=(await db.query("SELECT public.create_workspace('Unpaid onboarding','2027-01-01') id")).rows[0].id;
  const invite=(await db.query('SELECT public.create_partner_invitation($1) token',[fresh])).rows[0].token;
  await user(3); assert.equal((await db.query('SELECT public.accept_partner_invitation($1) id',[invite])).rows[0].id,fresh);
  await db.exec('RESET ROLE'); await db.query("UPDATE public.workspace_entitlements SET feature='core' WHERE workspace_id=$1",[ws]);
});
await test('existing paid DOKU owner and partner keep CRUD, no expiry rewrite',async()=>{
  await allowCrud(1,ws); await allowCrud(2,ws);
  await db.exec('RESET ROLE');assert.deepEqual((await snapshot()).entitlements,before.entitlements);
});
for(const [label,expiry,revoke] of [['expired',"now()-interval '1 second'",'NULL'],['exact expiry','now()','NULL'],['revoked',"now()+interval '1 year'",'now()']]) {
  await test(`${label}: all eight tables deny owner and partner CRUD`,async()=>{
    await db.exec('RESET ROLE');await db.query(`UPDATE public.workspace_entitlements SET expires_at=${expiry},revoked_at=${revoke} WHERE workspace_id=$1`,[ws]);
    await denyCrud(1,ws);await denyCrud(2,ws);
  });
}
await test('NULL expiry remains valid for legitimate owner and partner',async()=>{
  await db.exec('RESET ROLE');await db.query('UPDATE public.workspace_entitlements SET expires_at=NULL,revoked_at=NULL WHERE workspace_id=$1',[ws]);
  await allowCrud(1,ws);await allowCrud(2,ws);
});
await test('paid nonmember and unrelated operator/developer have no tenant bypass',async()=>{
  await db.exec('RESET ROLE');await db.query("INSERT INTO public.site_admins(user_id,role) VALUES($1,'developer'),($2,'operator')",[uuid(4),uuid(5)]);
  for(const n of [3,4,5]) await denyCrud(n,ws);
});
await test('WITH CHECK prevents paid rows moving into another owned but unpaid workspace',async()=>{
  await user(1);const unpaid=(await db.query("SELECT public.create_workspace('Unpaid destination','2027-01-01') id")).rows[0].id;
  for(let i=0;i<specs.length;i++) {
    const [t]=specs[i];
    await assert.rejects(db.query(`UPDATE public.${t} SET workspace_id=$1 WHERE id=$2`,[unpaid,rows[i]]),/row-level security|immutable workspace|immutable scope/);
  }
});
await test('restrictive AND survives an accidental permissive allow-all policy',async()=>{
  await db.exec('RESET ROLE');
  for(const [t] of specs) await db.exec(`CREATE POLICY accidental_allow_all ON public.${t} FOR ALL TO authenticated USING(true) WITH CHECK(true)`);
  await denyCrud(3,ws);
  await db.exec('RESET ROLE');await db.query('UPDATE public.workspace_entitlements SET revoked_at=now() WHERE workspace_id=$1',[ws]);
  await denyCrud(1,ws);
  await db.exec('RESET ROLE');for(const [t] of specs) await db.exec(`DROP POLICY accidental_allow_all ON public.${t}`);
});
await test('developer bypass uses server role + own owner + active grant, not metadata/partner',async()=>{
  await user(4);const own=(await db.query("SELECT public.create_workspace('Own developer','2027-01-01') id")).rows[0].id;
  const invite=(await db.query('SELECT public.create_partner_invitation($1) token',[own])).rows[0].token;
  await user(6);await db.query('SELECT public.accept_partner_invitation($1)',[invite]);
  await denyCrud(4,own);
  await user(4);await db.query("SELECT public.grant_developer_test_access($1,1,'local test only')",[own]);
  await db.exec('RESET ROLE');for(const [t,cols,values] of specs) await db.query(`INSERT INTO public.${t}(workspace_id,${cols}) VALUES($1,${values.replace(uuid(1),uuid(4))})`,[own]);
  // For this workspace contributions must refer to its own members.
  await user(4);for(const [t] of specs) assert.equal((await db.query(`SELECT id FROM public.${t} WHERE workspace_id=$1`,[own])).rows.length,1);
  await allowCrud(4,own,4);
  await denyCrud(6,own);
  await db.exec('RESET ROLE');await db.query("UPDATE public.developer_test_grants SET expires_at=now()-interval '1 second' WHERE workspace_id=$1",[own]);
  await denyCrud(4,own);
  await user(4);await db.query("SELECT public.grant_developer_test_access($1,1,'revoke test')",[own]);await db.query("SELECT public.revoke_developer_test_access($1,'finished')",[own]);
  await denyCrud(4,own);
  await user(4);await db.query("SELECT public.grant_developer_test_access($1,1,'demotion test')",[own]);
  await db.exec('RESET ROLE');await db.query("INSERT INTO public.site_admins(user_id,role) VALUES($1,'developer')",[uuid(3)]);await db.query("UPDATE public.site_admins SET role='operator' WHERE user_id=$1",[uuid(4)]);
  await denyCrud(4,own);
  await user(6);await assert.rejects(db.query("SELECT public.grant_developer_test_access($1,1,'self grant')",[own]),/developer required/);
});
await test('anonymous cannot query paid tables or grant self entitlement',async()=>{
  await db.exec('RESET ROLE; SET ROLE anon');for(const [t] of specs) await assert.rejects(db.query(`SELECT * FROM public.${t}`),/permission denied/);
  await user(1);await assert.rejects(db.query("INSERT INTO public.workspace_entitlements(workspace_id,feature,payment_reference,verified_by) VALUES($1,'core','FAKE','FAKE')",[ws]),/permission denied|row-level security/);
});
await test('catalog: exactly one restrictive membership AND core policy per table',async()=>{
  await db.exec('RESET ROLE');
  for(const [t] of specs) {
    const policies=(await db.query("SELECT * FROM pg_policies WHERE schemaname='public' AND tablename=$1 AND policyname='paid_core_access'",[t])).rows;
    assert.equal(policies.length,1);assert.equal(policies[0].permissive,'RESTRICTIVE');assert.equal(policies[0].cmd,'ALL');
    for(const expr of [policies[0].qual,policies[0].with_check]) {assert.match(expr,/is_workspace_member/);assert.match(expr,/has_workspace_entitlement/);}
  }
});
await test('rollback preserves every row and restores membership only; reapply closes again',async()=>{
  await db.exec('RESET ROLE');const pre=await snapshot();
  await db.exec(readFileSync('supabase/activation/paid-enforcement-rollback.sql','utf8'));
  assert.deepEqual(await snapshot(),pre);
  await allowCrud(1,ws);await denyCrud(3,ws);
  await db.exec('RESET ROLE');await db.exec(readFileSync(migration,'utf8'));
  await denyCrud(1,ws);
});
await test('vendor bulk and upsert: paid owner/partner allowed; unpaid/expired/revoked/outsider denied atomically',async()=>{
  await db.exec('RESET ROLE');await db.query('UPDATE public.workspace_entitlements SET expires_at=NULL,revoked_at=NULL WHERE workspace_id=$1',[ws]);
  for(const n of [1,2]) {
    await user(n);
    for(const [t,cols,values,col] of specs.slice(5)) {
      const made=(await db.query(`INSERT INTO public.${t}(workspace_id,${cols}) VALUES($1,${values}),($1,${values}) RETURNING id`,[ws])).rows;
      await db.query(`INSERT INTO public.${t}(id,workspace_id,${cols}) VALUES($2,$1,${values}) ON CONFLICT(id) DO UPDATE SET ${col}='Upsert' RETURNING id`,[ws,made[0].id]);
      await db.query(`DELETE FROM public.${t} WHERE id=ANY($1::uuid[])`,[made.map(x=>x.id)]);
    }
  }
  for(const state of ['unpaid','expired','revoked','outsider']) {
    await db.exec('RESET ROLE');
    await db.query(`UPDATE public.workspace_entitlements SET feature=$2,expires_at=${state==='expired'?"now()-interval '1 second'":'NULL'},revoked_at=${state==='revoked'?'now()':'NULL'} WHERE workspace_id=$1`,[ws,state==='unpaid'?'premium':'core']);
    // Use existing valid FK IDs: do not let hidden parent subqueries mask RLS.
    await user(state==='outsider'?3:1);
    for(let k=5;k<specs.length;k++) {
      const [t,cols,raw,col]=specs[k];
      const values=raw.replace('(SELECT id FROM public.vendors WHERE workspace_id=$1 LIMIT 1)',`'${rows[5]}'`).replace('(SELECT id FROM public.vendor_installments WHERE workspace_id=$1 LIMIT 1)',`'${rows[6]}'`);
      await assert.rejects(db.query(`INSERT INTO public.${t}(workspace_id,${cols}) VALUES($1,${values}),($1,${values})`,[ws]),/row-level security/);
      await assert.rejects(db.query(`INSERT INTO public.${t}(id,workspace_id,${cols}) VALUES($2,$1,${values}) ON CONFLICT(id) DO UPDATE SET ${col}='Blocked'`,[ws,rows[k]]),/row-level security/);
    }
  }
});
await test('free starter/settings/invitation; samples hidden until active; no entitlement creation',async()=>{
  await user(1);
  const request=uuid(900);
  const args=[request,'Local Groom','Local Bride','2027-01-01',1000000,500000];
  const fresh=(await db.query('SELECT public.create_starter_workspace($1,$2,$3,$4,$5,$6) id',args)).rows[0].id;
  assert.equal((await db.query('SELECT public.create_starter_workspace($1,$2,$3,$4,$5,$6) id',args)).rows[0].id,fresh);
  await db.query("UPDATE public.workspaces SET title='Free settings',wa_template='{}'::jsonb WHERE id=$1",[fresh]);
  const invite=(await db.query('SELECT public.create_partner_invitation($1) token',[fresh])).rows[0].token;
  await user(2);await db.query('SELECT public.accept_partner_invitation($1)',[invite]);
  await denyCrud(1,fresh);await denyCrud(2,fresh);
  await db.exec('RESET ROLE');
  assert.equal((await db.query('SELECT * FROM public.workspace_entitlements WHERE workspace_id=$1',[fresh])).rows.length,0);
  assert.equal(Number((await db.query('SELECT count(*) n FROM public.budgets WHERE workspace_id=$1',[fresh])).rows[0].n),8);
  await db.query("INSERT INTO public.workspace_entitlements(workspace_id,feature,payment_reference,verified_by) VALUES($1,'core','LOCAL-STARTER','local')",[fresh]);
  await user(2);assert.equal((await db.query('SELECT * FROM public.budgets WHERE workspace_id=$1',[fresh])).rows.length,8);
  await db.exec('RESET ROLE');
  for(const [t,cols,values] of specs) await db.query(`INSERT INTO public.${t}(workspace_id,${cols}) VALUES($1,${values})`,[fresh]);
  await db.query("UPDATE public.workspace_entitlements SET expires_at=now()-interval '1 second' WHERE workspace_id=$1",[fresh]);
  await user(2);await assert.rejects(db.query("SELECT public.reset_planning_content($1,'RESET RENCANA')",[fresh]),/owner required/);
  await user(3);await assert.rejects(db.query("SELECT public.reset_planning_content($1,'RESET RENCANA')",[fresh]),/owner required/);
  await user(1);await assert.rejects(db.query("SELECT public.reset_planning_content($1,'WRONG')",[fresh]),/confirmation required/);
  await db.query("SELECT public.reset_planning_content($1,'RESET RENCANA')",[fresh]);
  await db.query('SELECT public.use_starter_template($1)',[fresh]);
  await db.exec('RESET ROLE');for(const [t] of specs) assert.equal((await db.query(`SELECT * FROM public.${t} WHERE workspace_id=$1`,[fresh])).rows.length,t==='savings_accounts'?1:0,`${t} reset scope matches captured RPC (legacy savings account preserved)`);
  assert.equal((await db.query("SELECT * FROM public.admin_audit WHERE subject_id=$1 AND action='planning.reset'",[fresh])).rows.length,1);
  // Empty non-starter workspace template path is also free, and retry safe.
  await user(1);const empty=(await db.query("SELECT public.create_workspace('Empty','2027-01-01') id")).rows[0].id;
  await db.query('SELECT public.use_starter_template($1)',[empty]);await db.query('SELECT public.use_starter_template($1)',[empty]);
  await db.query("SELECT public.reset_planning_content($1,'RESET RENCANA')",[empty]);
  await db.exec('RESET ROLE');assert.equal((await db.query('SELECT * FROM public.workspace_entitlements WHERE workspace_id=$1',[empty])).rows.length,0);
});
await db.close();console.log(`${passed} paid-access RLS SQL tests passed (${mode})`);
