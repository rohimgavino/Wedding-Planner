"""Native independent-connection pricing and actual Supabase runner rehearsal; local only."""
from pathlib import Path
import concurrent.futures as cf, hashlib, json, os, shutil, socket, subprocess, tempfile, time, uuid
import psycopg
P=Path(__file__).resolve().parents[1]
B=Path('D:/pocketwedding-local-tools/pg17/pgsql/bin')
R=P/'docs/pricing-evidence'/('tier-native-'+uuid.uuid4().hex[:10]);R.mkdir(parents=True)
T=Path(tempfile.mkdtemp(prefix='tier-owned-',dir=os.environ['TMPDIR']));D=T/'cluster'
env={k:v for k,v in os.environ.items() if not k.startswith(('PG','SUPABASE_'))};env['PGPASSFILE']='NUL'
s=socket.socket();s.bind(('127.0.0.1',0));port=s.getsockname()[1];s.close()
def cmd(exe,args,cwd=None):
 r=subprocess.run([str(exe),*map(str,args)],cwd=cwd,env=env,capture_output=True,text=True,timeout=120);return r
def pg(name,*args):
 r=cmd(B/(name+'.exe'),args);r.check_returncode();return r
# pg_ctl server must not inherit captured pipes.
started=False
results=[]
def record(name):results.append(name);print('PASS '+name,flush=True)
def conn():return psycopg.connect(host='127.0.0.1',port=port,user='postgres',dbname='postgres',autocommit=True)
def actor(c,n=2):c.execute("SET ROLE authenticated");c.execute("SELECT set_config('request.jwt.claim.sub',%s,false)",(f'00000000-0000-0000-0000-{n:012d}',))
def save(c,amount,version):return c.execute("SELECT public.admin_update_tier_price('starter',%s,jsonb_build_object('amount_idr',%s::text,'promo',null),'native synthetic',true)",(str(version),str(amount))).fetchone()[0]['packages'][0]
def wait(c,pid):
 for _ in range(200):
  row=c.execute('SELECT wait_event_type FROM pg_stat_activity WHERE pid=%s',(pid,)).fetchone()
  if row and row[0]=='Lock':return
  time.sleep(.025)
 raise AssertionError('no proven lock wait')
def failure(call,expected):
 try:call()
 except psycopg.Error as e:assert expected in str(e),str(e);return
 raise AssertionError('expected '+expected)
try:
 pg('initdb','-D',D,'-U','postgres','-A','trust','--no-locale','-E','UTF8')
 subprocess.run([str(B/'pg_ctl.exe'),'-D',str(D),'-l',str(T/'server.log'),'-o',f'-h 127.0.0.1 -p {port}','-w','start'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True);started=True
 with conn() as c:
  c.execute("CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;")
  for n in range(1,4):c.execute('INSERT INTO auth.users VALUES(%s)',(f'00000000-0000-0000-0000-{n:012d}',))
  for name in ['202610120001_secure_foundation.sql','202610140001_workspace_entitlements_savings.sql','202610140002_admin_manual_purchases.sql','202610140004_developer_operator_roles.sql','202610220001_admin_package_pricing.sql']:c.execute((P/'supabase/migrations'/name).read_text())
  c.execute("INSERT INTO public.site_admins(user_id,role) VALUES('00000000-0000-0000-0000-000000000002','operator'),('00000000-0000-0000-0000-000000000003','developer')")
  actor(c,1);ws=c.execute("SELECT public.create_workspace('Synthetic','2027-01-01')").fetchone()[0];c.execute('RESET ROLE')
  definitions=c.execute("SELECT oid::regprocedure::text,md5(pg_get_functiondef(oid)) FROM pg_proc WHERE pronamespace='public'::regnamespace ORDER BY 1").fetchall()
  # Exact installed runner with isolated config and only one migration.
  W=T/'runner';(W/'supabase/migrations').mkdir(parents=True)
  (W/'supabase/config.toml').write_text('project_id = "pricing-local-only"\n')
  sql=(P/'supabase/migrations/202610220002_tier_pricing.sql').read_text()
  migration=W/'supabase/migrations/202610220002_tier_pricing.sql'
  migration.write_text(sql.replace('COMMIT;',"DO $$BEGIN RAISE EXCEPTION 'injected late runner failure';END$$;\nCOMMIT;"))
  cli=shutil.which('supabase');assert cli
  args=['db','push','--db-url',f'postgresql://postgres@127.0.0.1:{port}/postgres?sslmode=disable','--skip-vault','--yes','--workdir',str(W)]
  r=cmd(cli,args,W);(R/'runner-failure.log').write_text(r.stdout+r.stderr)
  assert 'injected late runner failure' in r.stdout+r.stderr,(r.stdout+r.stderr)
  assert c.execute("SELECT to_regclass('public.tier_price_current')").fetchone()[0] is None
  assert c.execute('SELECT count(*) FROM supabase_migrations.schema_migrations').fetchone()[0]==0
  assert definitions==c.execute("SELECT oid::regprocedure::text,md5(pg_get_functiondef(oid)) FROM pg_proc WHERE pronamespace='public'::regnamespace ORDER BY 1").fetchall()
  record('actual Supabase 2.120.0 late error rolls back pricing DDL/history and preserves every existing public function')
  migration.write_text(sql)
  for label in ['retry','idempotent']:
   r=cmd(cli,args,W);(R/('runner-'+label+'.log')).write_text(r.stdout+r.stderr);assert r.returncode==0,r.stdout+r.stderr
   assert c.execute("SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='202610220002'").fetchone()[0]==1
  record('actual runner retry and second push exactly one history row')
 def simultaneous(n):
  with conn() as c:
   actor(c)
   try:return save(c,300000+n,1)['version']
   except psycopg.Error as e:return str(e).splitlines()[0]
 with cf.ThreadPoolExecutor(8) as pool:out=list(pool.map(simultaneous,range(8)))
 assert out.count('2')==1 and sum('version conflict' in x for x in out)==7,out
 record('8 independent CAS writers exactly one committed version and seven conflicts')
 with conn() as c:
  assert c.execute("SELECT count(*) FROM public.admin_audit WHERE details->>'kind'='package.tier_price'").fetchone()[0]==1
  # Mutation serialized before revoke may finish; revoke must wait until commit.
  with conn() as h,conn() as m,conn() as r,cf.ThreadPoolExecutor(2) as pool:
   h.execute('BEGIN');h.execute('SELECT * FROM public.tier_price_current FOR UPDATE');actor(m)
   f=pool.submit(save,m,400000,2);wait(c,m.info.backend_pid)
   rf=pool.submit(r.execute,"DELETE FROM public.site_admins WHERE user_id='00000000-0000-0000-0000-000000000002'");wait(c,r.info.backend_pid);assert not rf.done()
   h.execute('COMMIT');assert f.result(10)['version']=='3';rf.result(10)
   failure(lambda:save(m,450000,3),'admin required')
  record('inflight price completes before waiting role revocation; post-revocation mutation denied')
  c.execute("INSERT INTO public.site_admins(user_id,role) VALUES('00000000-0000-0000-0000-000000000002','operator')")
  with conn() as r,conn() as m,cf.ThreadPoolExecutor(1) as pool:
   r.execute('BEGIN');r.execute("DELETE FROM public.site_admins WHERE user_id='00000000-0000-0000-0000-000000000002'");actor(m)
   f=pool.submit(save,m,450000,3);wait(c,m.info.backend_pid);r.execute('COMMIT');failure(lambda:f.result(10),'admin required')
  record('revocation holding role lock first causes waiting price mutation denial')
  c.execute("INSERT INTO public.site_admins(user_id,role) VALUES('00000000-0000-0000-0000-000000000002','operator')")
  def reserve(q,name):return q.execute("SELECT public.reserve_tier_invoice(%s,%s,'starter')",(name,ws)).fetchone()[0]
  with conn() as i,conn() as m,cf.ThreadPoolExecutor(1) as pool:
   i.execute('BEGIN');old=reserve(i,'OLD');actor(m);f=pool.submit(save,m,500000,3);wait(c,m.info.backend_pid);i.execute('COMMIT');assert f.result(10)['version']=='4'
  with conn() as i,conn() as m,cf.ThreadPoolExecutor(1) as pool:
   m.execute('BEGIN');actor(m);save(m,600000,4);f=pool.submit(reserve,i,'NEW');wait(c,i.info.backend_pid);m.execute('COMMIT');new=f.result(10)
  assert old['version']=='3' and old['amount_idr']=='400000'
  assert new['version']=='5' and new['amount_idr']=='600000'
  assert reserve(c,'OLD')==old
  failure(lambda:c.execute("UPDATE public.tier_invoice_snapshots SET amount_idr=1 WHERE invoice='OLD'"),'append-only')
  record('tier invoice/update both native lock orders and immutable historical snapshot')
  baseline=c.execute("SELECT (SELECT count(*) FROM public.tier_price_versions),(SELECT version FROM public.tier_price_current WHERE package_id='starter'),(SELECT count(*) FROM public.admin_audit)").fetchone()
  c.execute("CREATE FUNCTION public.pricing_fail() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'late audit failure';END$$;CREATE TRIGGER pricing_fail BEFORE INSERT ON public.admin_audit FOR EACH ROW EXECUTE FUNCTION public.pricing_fail()")
  with conn() as m:
   actor(m);failure(lambda:save(m,700000,5),'late audit failure')
  assert baseline==c.execute("SELECT (SELECT count(*) FROM public.tier_price_versions),(SELECT version FROM public.tier_price_current WHERE package_id='starter'),(SELECT count(*) FROM public.admin_audit)").fetchone()
  record('native late audit failure atomically rolls back version pointer catalog and audit')
finally:
 if started:subprocess.run([str(B/'pg_ctl.exe'),'-D',str(D),'-m','fast','-w','stop'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
 shutil.rmtree(T)
 (R/'results.json').write_text(json.dumps({'passed':results,'cluster_removed':not T.exists()},indent=2))
 print('EVIDENCE '+str(R),flush=True)
