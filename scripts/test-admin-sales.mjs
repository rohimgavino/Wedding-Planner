import {PGlite} from '@electric-sql/pglite';
import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;INSERT INTO auth.users SELECT ('00000000-0000-0000-0000-00000000000'||n)::uuid FROM generate_series(1,3)n;`);
for(const p of ['202610120001_secure_foundation.sql','202610140001_workspace_entitlements_savings.sql','202610140002_admin_manual_purchases.sql','202610140004_developer_operator_roles.sql'])await db.exec(readFileSync('supabase/migrations/'+p,'utf8'));
const user=async n=>db.exec(`RESET ROLE;SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000${n}',false)`);
await user(1);const ws=(await db.query("select public.create_workspace('Private couple','2027-01-01') id")).rows[0].id;
await db.exec("RESET ROLE;INSERT INTO public.site_admins(user_id,role)VALUES('00000000-0000-0000-0000-000000000002','operator'),('00000000-0000-0000-0000-000000000003','developer')");
const file='supabase/migrations/202610210002_admin_sales_report.sql';if(existsSync(file))await db.exec(readFileSync(file,'utf8'));
await user(2);
const report=async(a=null,b=null,s='')=>(await db.query('select public.admin_sales_report($1::date,$2::date,$3::text) r',[a,b,s])).rows[0].r;
assert.equal((await report()).gross_idr,'0');
await db.exec('RESET ROLE');
// 62 verified registry-backed records exceed detail cap; pending and malformed verified never count.
for(let i=0;i<64;i++){
 const id=(await db.query(`insert into public.purchase_requests(workspace_id,requested_by,price_idr,duration_days,lynk_url,status,transaction_reference,verified_by,verified_at) values($1,'00000000-0000-0000-0000-000000000001',9007199254740991,365,'legacy',$2,$3,$4,'2026-10-20T18:00:00Z') returning id`,[ws,i===63?'pending':'verified',i<62?'REF-'+i:null,i<62?'00000000-0000-0000-0000-000000000002':null])).rows[0].id;
 if(i<62)await db.query('insert into public.verified_transactions(reference,workspace_id,request_id) values($1,$2,$3)',['REF-'+i,ws,id]);
}
await user(2);let r=await report();assert.equal(r.gross_idr,(9007199254740991n*62n).toString());assert.equal(r.sale_count,62);assert.equal(r.rows.length,50);assert.equal(r.excluded_verified,1);assert.equal((await report('2026-10-21','2026-10-21')).sale_count,62);assert.equal((await report(null,'2026-10-20')).sale_count,0);assert.equal((await report(null,null,'not-found')).sale_count,0);assert.equal((await db.query('select * from public.workspaces')).rows.length,0);assert.deepEqual(Object.keys(r.rows[0]).sort(),['id','price_idr','transaction_reference','verified_at','workspace_id']);
await assert.rejects(report('2026-10-22','2026-10-21'),/invalid filters/);
await user(3);assert.equal((await report()).sale_count,62);
await user(1);await assert.rejects(report(),/admin required/);
await db.exec('RESET ROLE;SET ROLE anon');await assert.rejects(report(),/permission denied/);
await db.exec("RESET ROLE;DELETE FROM public.site_admins WHERE role='operator'");await user(2);await assert.rejects(report(),/admin required/);
await db.close();console.log('PASS sales SQL exact full aggregate >50, verified registry only, date WIB/search/invalid filters, operator+developer, ordinary+anon+revoked denied, no planner leak');
