"""Disposable native PostgreSQL concurrency rehearsal. No hosted/env-file reads."""
from pathlib import Path
import os, subprocess, tempfile, shutil, concurrent.futures
root=Path(__file__).resolve().parents[1]
bin=Path('D:/pocketwedding-local-tools/pg17/pgsql/bin')
base=Path(tempfile.mkdtemp(prefix='doku-native-',dir=os.environ['TMPDIR']))
data=base/'data'
env={k:v for k,v in os.environ.items() if not k.startswith('PG')}
env['PGPASSFILE']='NUL'
port='55973'
def run(name,*args,**kw):
 return subprocess.run([str(bin/(name+'.exe')),*args],env=env,check=True,**kw)
def sql(text):
 return run('psql','-X','-h','127.0.0.1','-p',port,'-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At','-c',text,capture_output=True,text=True).stdout.strip()
started=False
try:
 run('initdb','-D',str(data),'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8',stdout=subprocess.DEVNULL)
 run('pg_ctl','-D',str(data),'-o',f'-h 127.0.0.1 -p {port}','-w','start',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);started=True
 sql("CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE TABLE public.workspaces(id uuid PRIMARY KEY); CREATE TABLE public.workspace_members(workspace_id uuid,user_id uuid,role text); CREATE TABLE public.package_price_versions(version bigint PRIMARY KEY,amount_idr bigint,UNIQUE(version,amount_idr)); CREATE TABLE public.package_price_current(id boolean,version bigint); INSERT INTO auth.users VALUES('11111111-1111-4111-8111-111111111111'); INSERT INTO public.workspaces VALUES('22222222-2222-4222-8222-222222222222'); INSERT INTO public.workspace_members VALUES('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','owner'); INSERT INTO public.package_price_versions VALUES(1,250000); INSERT INTO public.package_price_current VALUES(true,1);")
 sql((root/'services/doku-sandbox/durable.sql').read_text())
 sql("SELECT doku_sandbox.reserve('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','merchant','native1','original1')")
 def event(n):
  return sql("SELECT doku_sandbox.accept('merchant','event%d','%s','native1','original1',250000,'sandbox-payment-candidate','2024-02-29T05:00:00Z')"%(n,'a'*64))
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: outcomes=list(pool.map(event,range(8)))
 assert outcomes.count('record-candidate')==1,outcomes
 assert outcomes.count('duplicate-payment')==7,outcomes
 with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: retries=list(pool.map(event,[0]*8))
 assert retries==['duplicate-event']*8,retries
 assert sql('SELECT count(*) FROM doku_sandbox.candidates')=='1'
 assert sql('SELECT count(*) FROM doku_sandbox.inbox')=='8'
 print('PASS native PG: 8 independent connections, 1 candidate, 7 duplicate-payment; 8 replay duplicates; 8 permanent events')
finally:
 if started:run('pg_ctl','-D',str(data),'-m','fast','-w','stop',stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 shutil.rmtree(base)
 print('Disposable cluster stopped and removed')
