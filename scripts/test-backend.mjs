import { PGlite } from '@electric-sql/pglite';
// PostgreSQL built-ins only; no extension substitutes or mocked SQL.
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const db = new PGlite();
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;`);
const migration = 'supabase/migrations/202610120001_secure_foundation.sql';
await db.exec(readFileSync(existsSync(migration) ? migration : 'supabase/schema.sql', 'utf8'));
await db.exec(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000001','owner@example.test',now()), ('00000000-0000-0000-0000-000000000002','partner@example.test',now()), ('00000000-0000-0000-0000-000000000003','stranger@example.test',now());
INSERT INTO public.workspaces(id,title,wedding_date) VALUES ('10000000-0000-0000-0000-000000000001','Private','2027-01-01');`);
const user = async n => db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000${n}',false);`);
let passed = 0;
const test = async (name, fn) => { await fn(); console.log(`PASS ${++passed}: ${name}`); };
await test('stranger cannot self-enroll in a known workspace', async () => {
 await user(3);
 await assert.rejects(db.query(`INSERT INTO public.workspace_members(workspace_id,user_id,role) VALUES ('10000000-0000-0000-0000-000000000001',auth.uid(),'owner')`), /row-level security|permission denied/);
});
let ws;
await test('create_workspace atomically creates caller as sole owner', async () => {
 await user(1);
 ws = (await db.query(`SELECT public.create_workspace('Our wedding','2027-01-01') AS id`)).rows[0].id;
 const members = (await db.query('SELECT user_id,role FROM public.workspace_members WHERE workspace_id=$1',[ws])).rows;
 assert.deepEqual(members,[{user_id:'00000000-0000-0000-0000-000000000001',role:'owner'}]);
});
await test('anonymous workspace creation is rejected without partial rows', async () => {
 await db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','',false)`);
 await assert.rejects(db.query(`SELECT public.create_workspace('No','2027-01-01')`), /authentication required/);
});
let token;
await test('owner invitation returns an opaque token stored only as sha256', async () => {
 await user(1);
 token=(await db.query('SELECT public.create_partner_invitation($1) AS token',[ws])).rows[0].token;
 assert.match(token,/^[a-f0-9]{64}$/);
 await db.exec('RESET ROLE');
 const row=(await db.query('SELECT token_hash,status FROM public.invitations WHERE workspace_id=$1',[ws])).rows[0];
 assert.equal(row.token_hash, (await import('node:crypto')).createHash('sha256').update(token).digest('hex'));
 assert.equal(row.status,'pending');
 assert.equal((await db.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND table_name='invitations' AND column_name='token'")).rows[0].n,0);
});
await test('non-owner cannot create invitations', async () => {
 await user(3); await assert.rejects(db.query('SELECT public.create_partner_invitation($1)',[ws]),/owner required/);
});
await test('invitation acceptance atomically adds partner and consumes token', async () => {
 await user(2);
 assert.equal((await db.query('SELECT public.accept_partner_invitation($1) AS id',[token])).rows[0].id,ws);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM public.workspace_members WHERE workspace_id=$1',[ws])).rows[0].n,2);
});
await test('single-use token cannot be replayed by another user', async () => {
 await user(3); await assert.rejects(db.query('SELECT public.accept_partner_invitation($1)',[token]),/invalid or expired invitation/);
});
await test('full workspace cannot issue another invitation', async () => {
 await user(1); await assert.rejects(db.query('SELECT public.create_partner_invitation($1)',[ws]),/workspace full/);
});
await test('capacity invariant rejects even privileged third membership inserts', async () => {
 await db.exec('RESET ROLE');
 await assert.rejects(db.query("INSERT INTO public.workspace_members(workspace_id,user_id,role) VALUES ($1,'00000000-0000-0000-0000-000000000003','partner')",[ws]),/workspace full/);
});
await test('expiry rejects acceptance and leaves membership unchanged', async () => {
 await user(1);
 const other=(await db.query(`SELECT public.create_workspace('Expiry','2027-02-01') AS id`)).rows[0].id;
 const expired=(await db.query('SELECT public.create_partner_invitation($1) AS token',[other])).rows[0].token;
 await db.exec('RESET ROLE');
 await db.query("UPDATE public.invitations SET expires_at=clock_timestamp()-interval '1 second' WHERE workspace_id=$1",[other]);
 await user(2); await assert.rejects(db.query('SELECT public.accept_partner_invitation($1)',[expired]),/invalid or expired invitation/);
 await user(1);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM public.workspace_members WHERE workspace_id=$1',[other])).rows[0].n,1);
});
await test('reissuing revokes previous token and owners cannot accept their own invite', async () => {
 await user(1);
 const other=(await db.query(`SELECT public.create_workspace('Rotation','2027-03-01') AS id`)).rows[0].id;
 const first=(await db.query('SELECT public.create_partner_invitation($1) AS token',[other])).rows[0].token;
 const second=(await db.query('SELECT public.create_partner_invitation($1) AS token',[other])).rows[0].token;
 await assert.rejects(db.query('SELECT public.accept_partner_invitation($1)',[second]),/already a member/);
 await user(2); await assert.rejects(db.query('SELECT public.accept_partner_invitation($1)',[first]),/invalid or expired invitation/);
 assert.equal((await db.query('SELECT public.accept_partner_invitation($1) AS id',[second])).rows[0].id,other);
});
await test('malformed, missing and unauthenticated tokens fail closed', async () => {
 await user(3);
 for(const bad of [null,'not-a-token','f'.repeat(64)]) await assert.rejects(db.query('SELECT public.accept_partner_invitation($1)',[bad]),/invalid or expired invitation/);
 await db.exec(`SELECT set_config('request.jwt.claim.sub','',false)`);
 await assert.rejects(db.query('SELECT public.accept_partner_invitation($1)',[token]),/authentication required/);
});
const tables={budgets:"category,title",tasks:"title,phase",guests:"name",savings_accounts:"account_name"};
for(const [table,cols] of Object.entries(tables)) {
 await test(`${table}: member CRUD permitted; stranger reads and all writes isolated`, async () => {
  await user(1);
  const values=cols.split(',').map(()=>"'Private'").join(',');
  const id=(await db.query(`INSERT INTO public.${table}(workspace_id,${cols}) VALUES($1,${values}) RETURNING id`,[ws])).rows[0].id;
  await user(2);
  assert.equal((await db.query(`SELECT id FROM public.${table} WHERE id=$1`,[id])).rows.length,1);
  await db.query(`UPDATE public.${table} SET ${cols.split(',')[0]}='Shared' WHERE id=$1`,[id]);
  await user(3);
  assert.equal((await db.query(`SELECT id FROM public.${table} WHERE id=$1`,[id])).rows.length,0);
  await assert.rejects(db.query(`INSERT INTO public.${table}(workspace_id,${cols}) VALUES($1,${values})`,[ws]),/row-level security/);
  assert.equal((await db.query(`UPDATE public.${table} SET ${cols.split(',')[0]}='Attack' WHERE id=$1 RETURNING id`,[id])).rows.length,0);
  assert.equal((await db.query(`DELETE FROM public.${table} WHERE id=$1 RETURNING id`,[id])).rows.length,0);
  const outsider=(await db.query(`SELECT public.create_workspace('Outsider','2027-04-01') AS id`)).rows[0].id;
  await user(1);
  await assert.rejects(db.query(`UPDATE public.${table} SET workspace_id=$1 WHERE id=$2`,[outsider,id]),/row-level security/);
  assert.equal((await db.query(`DELETE FROM public.${table} WHERE id=$1 RETURNING id`,[id])).rows.length,1);
 });
}
await test('workspace and membership metadata remain tenant-isolated', async () => {
 await user(3);
 assert.equal((await db.query('SELECT id FROM public.workspaces WHERE id=$1',[ws])).rows.length,0);
 assert.equal((await db.query('SELECT id FROM public.workspace_members WHERE workspace_id=$1',[ws])).rows.length,0);
 assert.equal((await db.query("UPDATE public.workspaces SET title='Attack' WHERE id=$1 RETURNING id",[ws])).rows.length,0);
 await assert.rejects(db.query(`INSERT INTO public.workspaces(title,wedding_date) VALUES ('Bypass','2027-01-01')`),/row-level security/);
 assert.equal((await db.query("UPDATE public.workspace_members SET role='owner' WHERE workspace_id=$1 RETURNING id",[ws])).rows.length,0);
});
await test('all private tables have RLS and definer functions pin empty search_path', async () => {
 await db.exec('RESET ROLE');
 const rows=(await db.query("SELECT relname,relrowsecurity FROM pg_class JOIN pg_namespace n ON n.oid=relnamespace WHERE n.nspname='public' AND relkind='r'")).rows;
 assert.equal(rows.length,7); assert.ok(rows.every(r=>r.relrowsecurity));
 const defs=(await db.query("SELECT proname,proconfig FROM pg_proc JOIN pg_namespace n ON n.oid=pronamespace WHERE n.nspname='public' AND prosecdef")).rows;
 assert.equal(defs.length,5); assert.ok(defs.every(r=>r.proconfig.includes('search_path=\"\"')));
});
await test('invitations are unreadable/unwritable even when table grants are accidentally widened', async () => {
 await user(1);
 assert.equal((await db.query('SELECT * FROM public.invitations')).rows.length,0);
 await assert.rejects(db.query("INSERT INTO public.invitations(workspace_id,token_hash,expires_at) VALUES($1,'hash',now())",[ws]),/row-level security/);
});
await test('real migration grants restrict anon and authenticated control-plane access', async () => {
 await db.exec('RESET ROLE');
 // Undo the deliberate overly-broad grants used above to independently exercise RLS.
 await db.exec('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated');
 const sql=readFileSync(migration,'utf8');
 const start=sql.indexOf('REVOKE ALL ON public.workspaces');
 const end=sql.indexOf('CREATE POLICY workspace_read',start);
 await db.exec(sql.slice(start,end));
 await user(1);
 await assert.rejects(db.query('SELECT * FROM public.invitations'),/permission denied/);
 await assert.rejects(db.query("INSERT INTO public.workspace_members(workspace_id,user_id) VALUES($1,auth.uid())",[ws]),/permission denied/);
 await assert.rejects(db.query('DELETE FROM public.workspaces WHERE id=$1',[ws]),/permission denied/);
 await db.exec('RESET ROLE; SET ROLE anon');
 for(const t of ['workspaces','workspace_members','invitations',...Object.keys(tables)]) await assert.rejects(db.query(`SELECT * FROM public.${t}`),/permission denied/);
 for(const [fn,args] of [['create_workspace',"'No','2027-01-01'"],['create_partner_invitation',`'${ws}'::uuid`],['accept_partner_invitation',"'invalid'"],['is_workspace_member',`'${ws}'::uuid`]]) await assert.rejects(db.query(`SELECT public.${fn}(${args})`),/permission denied/);
});
await db.close();
console.log(`${passed} backend SQL tests passed`);
