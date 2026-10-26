"""Isolate fixture build without reading env; restore env and remove fixture export in finally."""
from pathlib import Path
import os,subprocess,shutil,json
root=Path(__file__).resolve().parents[1];os.chdir(root)
evidence=root/'docs/admin-evidence';evidence.mkdir(parents=True,exist_ok=True)
moved=[]
def run(name,args,env=None):
 result=subprocess.run(args,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace');(evidence/('sales-'+name+'.log')).write_text(result.stdout,encoding='utf-8');print(name,result.returncode,flush=True);return result.returncode
try:
 for p in root.glob('.env*'):
  if p.is_file() and not p.name.endswith('.example'):
   dest=p.with_name(p.name+'.pocketwedding-build-hold');assert not dest.exists();p.rename(dest);moved.append((p,dest))
 env=os.environ.copy();env.update(NEXT_PUBLIC_SUPABASE_URL='https://fixture.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY='sb_publishable_fixture')
 assert run('fixture-build',['node','node_modules/next/dist/bin/next','build'],env)==0
 result=run('browser',['python','scripts/test-admin-sales-browser.py'])
finally:
 for p,dest in moved:dest.rename(p)
 if (root/'out').exists():shutil.rmtree(root/'out')
 real=run('real-build',['node','node_modules/next/dist/bin/next','build'])
 print('Env filenames restored; fixture out removed; default build status',real,flush=True)
if result or real:raise SystemExit(1)