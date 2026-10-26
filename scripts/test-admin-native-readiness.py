"""Disposable native PG17 rehearsal. No hosted connections/env credentials.
Run: python scripts/test-admin-native-readiness.py --pg-bin D:/pocketwedding-local-tools/pg17/pgsql/bin
Requires psycopg[binary]. Creates unique loopback cluster; always stops it.
"""
import argparse, concurrent.futures, json, pathlib, re, socket, subprocess, time, uuid
import psycopg
P=pathlib.Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--pg-bin',required=True);args=a.parse_args();bin=pathlib.Path(args.pg_bin)
run=P/'docs/admin-evidence'/('native-'+uuid.uuid4().hex[:10]);run.mkdir(parents=True)
data=run/'cluster'; out=[]
def cmd(name,*argv):
 # pg_ctl start may pass stdout handles to postgres on Windows: never PIPE.
 with (run/(name+'.log')).open('w',encoding='utf8') as log:
  r=subprocess.run([str(bin/(name+'.exe')),*map(str,argv)],stdout=log,stderr=log,timeout=90)
 r.check_returncode();return r
s=socket.socket();s.bind(('127.0.0.1',0));port=s.getsockname()[1];s.close()
cmd('initdb','-D',data,'-U','pw_local_owner','-A','trust','--no-locale','-E','UTF8')
# Loopback only, unique disposable cluster; not a shared database role/password.
cmd('pg_ctl','-D',data,'-l',run/'server.log','-o',f'-h 127.0.0.1 -p {port}','-w','start')
conn=dict(host='127.0.0.1',port=port,user='pw_local_owner',dbname='postgres',autocommit=True)
def connect(db='postgres'):return psycopg.connect(**{**conn,'dbname':db})
def record(name,**kw):out.append(dict(test=name,**kw));print(json.dumps(out[-1]),flush=True)
def uid(n):return f'00000000-0000-0000-0000-{n:012d}'
def actor(c,n):c.execute('SET ROLE authenticated');c.execute("SELECT set_config('request.jwt.claim.sub',%s,false)",(uid(n),))
def body(p):return re.sub(r'(?im)^\s*(BEGIN|COMMIT);\s*$','',p.read_text(encoding='utf8'))
try:
 with connect() as c:
  c.execute('CREATE ROLE anon');c.execute('CREATE ROLE authenticated');c.execute('CREATE DATABASE pw_rehearsal');c.execute('CREATE DATABASE pw_restore')
 with connect('pw_rehearsal') as c:
  c.execute("CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;")
  for n in range(1,5):c.execute('INSERT INTO auth.users VALUES(%s)',(uid(n),))
  for name in ['202610120001_secure_foundation.sql','202610140001_workspace_entitlements_savings.sql','202610140002_admin_manual_purchases.sql','202610140004_developer_operator_roles.sql']:
   c.execute((P/'supabase/migrations'/name).read_text(encoding='utf8'))
  c.execute("INSERT INTO public.site_admins(user_id,role) VALUES(%s,'developer'),(%s,'developer'),(%s,'operator')",(uid(1),uid(2),uid(3)))
  actor(c,1);ws=c.execute("SELECT public.create_workspace('Synthetic local only','2027-01-01')").fetchone()[0];c.execute('RESET ROLE')
  overview=P/'supabase/migrations/202610210001_admin_workspace_overview.sql'
  try:
   with c.transaction():
    c.execute(body(overview));c.execute("DO $$BEGIN RAISE EXCEPTION 'injected late failure';END$$")
  except psycopg.errors.RaiseException:pass
  assert c.execute("SELECT to_regprocedure('public.admin_workspace_overview(integer,integer)')").fetchone()[0] is None
  record('overview late-failure atomic rollback',passed=True)
  c.execute(overview.read_text(encoding='utf8'));actor(c,3)
  assert len(c.execute('SELECT * FROM public.admin_workspace_overview(50,0)').fetchall())==1
  assert len(c.execute('SELECT * FROM public.workspaces').fetchall())==0
  c.execute('RESET ROLE');record('native overview operator metadata without tenant bypass',passed=True)
  dump=run/'synthetic-backup.sql';cmd('pg_dump','-h','127.0.0.1','-p',port,'-U','pw_local_owner','-d','pw_rehearsal','-f',dump)
  cmd('psql','-h','127.0.0.1','-p',port,'-U','pw_local_owner','-d','pw_restore','-v','ON_ERROR_STOP=1','-f',dump)
  with connect('pw_restore') as restored:
   assert restored.execute('SELECT count(*) FROM public.site_admins').fetchone()[0]==3
   actor(restored,3);assert len(restored.execute('SELECT * FROM public.admin_workspace_overview(50,0)').fetchall())==1
   restored.execute('RESET ROLE;SET ROLE anon')
   try:restored.execute('SELECT * FROM public.admin_workspace_overview(50,0)');raise AssertionError('anon allowed')
   except psycopg.errors.InsufficientPrivilege:pass
  record('synthetic pg_dump restore roles overview ACL',passed=True)
 # Hold workspace lock, start grant (checks role BEFORE waiting), revoke role on separate connection.
 with connect('pw_rehearsal') as hold, connect('pw_rehearsal') as revoke, concurrent.futures.ThreadPoolExecutor() as pool:
  hold.execute('BEGIN');hold.execute('SELECT 1 FROM public.workspaces WHERE id=%s FOR UPDATE',(ws,))
  worker=connect('pw_rehearsal');actor(worker,1);pid=worker.info.backend_pid
  f=pool.submit(worker.execute,'SELECT public.grant_developer_test_access(%s,1,%s)',(ws,'synthetic race probe'))
  waiting=False
  for _ in range(100):
   state=revoke.execute('SELECT wait_event_type FROM pg_stat_activity WHERE pid=%s',(pid,)).fetchone()
   if state and state[0]=='Lock':waiting=True;break
   time.sleep(.03)
  assert waiting,'grant did not reach lock wait'
  actor(revoke,2);revoke.execute("SELECT public.set_site_admin(%s,'operator','synthetic concurrent demotion')",(uid(1),))
  hold.execute('COMMIT')
  try:f.result(timeout=10);committed=True
  except psycopg.Error:committed=False
  worker.close();revoke.execute('RESET ROLE')
  effective=revoke.execute('SELECT count(*) FROM public.developer_test_grants WHERE user_id=%s',(uid(1),)).fetchone()[0]
  record('revocation while grant waiting on workspace',grant_committed_after_demotion=committed,persisted_grants=effective,release_blocker=committed)
 # Rehearse exact live read-only captured grant definition, not a guessed patch.
 snapshot=P/'docs/admin-evidence/readiness-function-readonly.log'
 if snapshot.exists():
  raw=snapshot.read_text(encoding='utf8'); live=json.JSONDecoder().raw_decode(raw[raw.index('{'):])[0]['rows'][0]['definitions']['grant_definition']
  assert 'LOCK TABLE public.site_admins IN SHARE ROW EXCLUSIVE MODE' in live
  with connect('pw_rehearsal') as c:
   c.execute(live);c.execute("UPDATE public.site_admins SET role='developer' WHERE user_id=%s",(uid(1),))
  with connect('pw_rehearsal') as hold, connect('pw_rehearsal') as observer, concurrent.futures.ThreadPoolExecutor() as pool:
   hold.execute('BEGIN');hold.execute('SELECT 1 FROM public.workspaces WHERE id=%s FOR UPDATE',(ws,))
   g=connect('pw_rehearsal');actor(g,1);r=connect('pw_rehearsal');actor(r,2)
   gf=pool.submit(g.execute,'SELECT public.grant_developer_test_access(%s,1,%s)',(ws,'live definition local rehearsal'))
   def wait_lock(pid):
    for _ in range(100):
     row=observer.execute('SELECT wait_event_type FROM pg_stat_activity WHERE pid=%s',(pid,)).fetchone()
     if row and row[0]=='Lock':return
     time.sleep(.03)
    raise AssertionError('expected lock wait')
   wait_lock(g.info.backend_pid)
   rf=pool.submit(r.execute,"SELECT public.set_site_admin(%s,'operator','live lock local rehearsal')",(uid(1),))
   wait_lock(r.info.backend_pid);assert not rf.done()
   hold.execute('COMMIT');gf.result(timeout=10);rf.result(timeout=10)
   try:g.execute("SELECT public.grant_developer_test_access(%s,1,'after revocation')",(ws,));raise AssertionError('revoked developer allowed')
   except psycopg.errors.RaiseException as e:assert 'developer required' in str(e)
   g.close();r.close()
   record('captured live grant definition serializes in-flight grant before demotion; subsequent denied',passed=True,scope='local synthetic replay, not hosted race')
 # Concurrent self-demotions: exactly one may remove developer, other must fail.
 with connect('pw_rehearsal') as c:
  c.execute("UPDATE public.site_admins SET role='developer' WHERE user_id=%s",(uid(1),))
 def demote(n):
  with connect('pw_rehearsal') as c:
   actor(c,n)
   try:c.execute("SELECT public.set_site_admin(%s,'operator','synthetic last-developer race')",(uid(n),));return 'committed'
   except psycopg.Error as e:return str(e).splitlines()[0]
 with concurrent.futures.ThreadPoolExecutor() as pool:results=list(pool.map(demote,[1,2]))
 with connect('pw_rehearsal') as c:remaining=c.execute("SELECT count(*) FROM public.site_admins WHERE role='developer'").fetchone()[0]
 assert remaining==1 and results.count('committed')==1
 record('concurrent last developer demotion',passed=True,results=results,remaining=remaining)
finally:
 cmd('pg_ctl','-D',data,'-m','fast','-w','stop')
 (run/'results.json').write_text(json.dumps(out,indent=2),encoding='utf8')
 print('EVIDENCE '+str(run),flush=True)
