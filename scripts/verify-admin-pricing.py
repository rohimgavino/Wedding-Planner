"""No env contents read: rename env, fixture build/test, fail-closed build, restore names."""
from pathlib import Path
import os,subprocess,shutil
root=Path(__file__).resolve().parents[1];os.chdir(root)
evidence=root/'docs/pricing-evidence';evidence.mkdir(parents=True,exist_ok=True)
moved=[]
def run(name,args,env):
 result=subprocess.run(args,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace');(evidence/(name+'.log')).write_text(result.stdout,encoding='utf-8');print(name,result.returncode,flush=True);return result.returncode
code=1
clean=1
env={k:v for k,v in os.environ.items() if not k.startswith(('NEXT_PUBLIC_SUPABASE_','SUPABASE_'))}
try:
 for p in root.glob('.env*'):
  if p.is_file() and not p.name.endswith('.example'):
   dest=p.with_name(p.name+'.pricing-build-hold');assert not dest.exists();p.rename(dest);moved.append((p,dest))
 env={k:v for k,v in os.environ.items() if not k.startswith(('NEXT_PUBLIC_SUPABASE_','SUPABASE_'))}
 fixture=env.copy();fixture.update(NEXT_PUBLIC_SUPABASE_URL='https://fixture.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY='sb_publishable_fixture')
 if run('fixture-build',['node.exe','node_modules/next/dist/bin/next','build'],fixture)==0:
  code=run('browser',['python','scripts/test-admin-pricing-browser.py'],fixture)
finally:
 try:
  if (root/'out').exists():shutil.rmtree(root/'out')
  clean=run('unconfigured-build',['node.exe','node_modules/next/dist/bin/next','build'],env)
 finally:
  for p,dest in moved:dest.rename(p)
 print('Env filenames restored; no env contents consumed. Fail-closed build:',clean,flush=True)
if code or clean:raise SystemExit(1)
