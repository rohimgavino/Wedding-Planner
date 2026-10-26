import { PGlite } from '@electric-sql/pglite';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; GRANT USAGE ON SCHEMA public,auth TO anon,authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated; INSERT INTO auth.users SELECT ('00000000-0000-0000-0000-00000000000'||n)::uuid FROM generate_series(1,3) n;`);
for(const p of ['202610120001_secure_foundation.sql','202610140001_workspace_entitlements_savings.sql','202610140002_admin_manual_purchases.sql']) if(existsSync('supabase/migrations/'+p)) await db.exec(readFileSync('supabase/migrations/'+p,'utf8'));
await db.exec("UPDATE public.release_controls SET sales_activation=true");
await db.exec(readFileSync('supabase/activation/paid-enforcement.sql','utf8'));
const user=async n=>db.exec(`RESET ROLE; SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000${n}',false)`);
let passed=0; const test=async(name,fn)=>{await fn();console.log(`PASS ${++passed}: ${name}`)};
await user(1);
await test('ordinary authenticated identity is not admin',async()=>assert.equal((await db.query('select public.is_site_admin() allowed')).rows[0].allowed,false));
await test('no self provision even with widened table grants',async()=>{
 await assert.rejects(db.query('insert into public.site_admins values(auth.uid(),now())'),/permission denied/);
 await db.exec('RESET ROLE; GRANT ALL ON public.site_admins TO authenticated');await user(1);
 await assert.rejects(db.query('insert into public.site_admins values(auth.uid(),now())'),/row-level security/);
 await db.exec("RESET ROLE; INSERT INTO public.site_admins(user_id) VALUES('00000000-0000-0000-0000-000000000003')");await user(3);
 assert.equal((await db.query('select public.is_site_admin() allowed')).rows[0].allowed,true);
});
await test('settings start unconfigured, nonadmin write denied',async()=>{
 await user(1);assert.equal((await db.query('select price_idr from public.site_settings')).rows[0].price_idr,null);
 await assert.rejects(db.query("select public.save_site_settings('help@example.com',100,30,'https://lynk.id/shop/product',true)"),/admin required/);
});
let ws,request;
await test('purchase is tenant bound and unavailable sales fail closed',async()=>{
 await user(1);ws=(await db.query("select public.create_workspace('Purchase','2027-01-01') id")).rows[0].id;
 await assert.rejects(db.query('select public.request_core_purchase($1)',[ws]),/sales unavailable/);
 await user(3);await db.query("select public.save_site_settings('help@example.com',100,30,'https://lynk.id/shop/product',true)");
 await user(2);await assert.rejects(db.query('select public.request_core_purchase($1)',[ws]),/membership required/);
 await user(1);request=(await db.query('select public.request_core_purchase($1) id',[ws])).rows[0].id;
 assert.equal((await db.query('select public.request_core_purchase($1) id',[ws])).rows[0].id,request);
 await assert.rejects(db.query("select public.verify_core_purchase($1,'TX-ONE',100,true,'Cocok dashboard')",[request]),/admin required/);
});
await test('manual verification atomic activation and retry does not extend expiry',async()=>{
 await user(3);
 await assert.rejects(db.query("select public.verify_core_purchase($1,'TX-ONE',100,false,'Cocok')",[request]),/dashboard confirmation required/);
 await assert.rejects(db.query("select public.verify_core_purchase($1,'TX-ONE',99,true,'Cocok')",[request]),/amount mismatch/);
 await db.query("select public.verify_core_purchase($1,' tx-one ',100,true,'Cocok dashboard produk dan workspace')",[request]);
 await user(1);assert.equal((await db.query("select public.has_workspace_entitlement($1,'core') allowed",[ws])).rows[0].allowed,true);
 const expiry=(await db.query('select expires_at from public.workspace_entitlements where workspace_id=$1',[ws])).rows[0].expires_at;
 await user(3);await db.query("select public.verify_core_purchase($1,'TX-ONE',100,true,'Retry')",[request]);
 await user(1);assert.deepEqual((await db.query('select expires_at from public.workspace_entitlements where workspace_id=$1',[ws])).rows[0].expires_at,expiry);
});
await test('same transaction cannot activate another workspace; rollback leaves pending',async()=>{
 await user(2);const other=(await db.query("select public.create_workspace('Other','2027-01-01') id")).rows[0].id;
 const second=(await db.query('select public.request_core_purchase($1) id',[other])).rows[0].id;
 await user(3);await assert.rejects(db.query("select public.verify_core_purchase($1,'tx-one',100,true,'Dashboard')",[second]),/unique constraint/);
 assert.equal((await db.query('select status from public.purchase_requests where id=$1',[second])).rows[0].status,'pending');
 await user(2);assert.equal((await db.query("select public.has_workspace_entitlement($1,'core') allowed",[other])).rows[0].allowed,false);
 assert.equal((await db.query('select * from public.purchase_requests where id=$1',[request])).rows.length,0);
});
await test('admin rejection terminal and auditable without activation',async()=>{
 await user(2);const id=(await db.query("select id from public.purchase_requests where status='pending'")).rows[0].id;
 await assert.rejects(db.query("select public.reject_core_purchase($1,'Tidak ditemukan di dashboard')",[id]),/admin required/);
 await user(3);await db.query("select public.reject_core_purchase($1,'Tidak ditemukan di dashboard')",[id]);
 assert.equal((await db.query('select status from public.purchase_requests where id=$1',[id])).rows[0].status,'rejected');
 await assert.rejects(db.query("select public.verify_core_purchase($1,'TX-TWO',100,true,'Dashboard')",[id]),/already reviewed/);
 assert.equal((await db.query("select * from public.admin_audit where subject_id=$1 and action='purchase.rejected'",[id])).rows.length,1);
});
await test('legacy references remain reserved after renewal',async()=>{
 await db.exec('RESET ROLE');await db.query("INSERT INTO public.verified_transactions(reference,workspace_id) VALUES('LEGACY-ONE',$1)",[ws]);
 await user(1);const next=(await db.query('select public.request_core_purchase($1) id',[ws])).rows[0].id;
 await user(3);await assert.rejects(db.query("select public.verify_core_purchase($1,'legacy-one',100,true,'Dashboard')",[next]),/unique constraint/);
});
await test('settings validates email money duration and official HTTPS product paths',async()=>{
 await user(3);
 for(const url of ['http://lynk.id/shop/product','https://lynk.id.evil/shop/product','https://evil@lynk.id/shop/product','https://lynk.id/shop','https://lynk.id/shop/product?next=evil']) await assert.rejects(db.query("select public.save_site_settings('help@example.com',100,30,$1,true)",[url]),/check constraint/);
 for(const [email,price,days] of [['bad email',100,30],['a@example.com',0,30],['a@example.com',100,0],['a@example.com',9007199254740992,30]]) await assert.rejects(db.query("select public.save_site_settings($1,$2,$3,'https://lynk.id/shop/product',true)",[email,price,days]),/check constraint/);
 await assert.rejects(db.query("select public.save_site_settings(null,null,null,null,true)"),/check constraint/);
});
await test('direct settings purchase audit mutations denied even with widened grants',async()=>{
 await db.exec('RESET ROLE; GRANT ALL ON public.site_settings,public.purchase_requests,public.admin_audit TO authenticated');await user(1);
 assert.equal((await db.query('update public.site_settings set sales_enabled=false returning id')).rows.length,0);
 assert.equal((await db.query("update public.purchase_requests set status='verified' returning id")).rows.length,0);
 await assert.rejects(db.query("insert into public.admin_audit(actor_id,action) values(auth.uid(),'fake')"),/row-level security/);
 assert.equal((await db.query('select * from public.admin_audit')).rows.length,0);
 await db.exec('RESET ROLE');await assert.rejects(db.query("update public.admin_audit set action='tampered'"),/append-only audit/);
 await assert.rejects(db.query('delete from public.admin_audit'),/append-only audit/);
 await db.exec('SET ROLE anon');for(const sql of ['select public.is_site_admin()','select public.request_core_purchase($1)','select * from public.purchase_requests','select * from public.admin_audit']) await assert.rejects(db.query(sql,sql.includes('$1')?[ws]:[]),/permission denied/);
});
await db.close();console.log(`${passed} admin SQL tests passed`);
