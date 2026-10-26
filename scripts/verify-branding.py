from pathlib import Path
import os,subprocess,shutil,json
root=Path(__file__).resolve().parent.parent;os.chdir(root)
e=root/'docs/branding-evidence';e.mkdir(exist_ok=True)
env=os.environ.copy()
for k in list(env):
 if 'SUPABASE' in k:env.pop(k)
hidden=[];results=[]
try:
 for p in root.glob('.env*'):
  if p.is_file() and p.name!='.env.example':
   dest=p.with_name(p.name+'.branding-hidden');assert not dest.exists();p.rename(dest);hidden.append((p,dest))
 for name,args in [('regression',['node.exe','scripts/test-branding.cjs']),('lint',['node.exe','node_modules/eslint/bin/eslint.js','src','--ext','.ts,.tsx','--max-warnings','0']),('tsc',['node.exe','node_modules/typescript/bin/tsc','--noEmit']),('build',['node.exe','node_modules/next/dist/bin/next','build'])]:
  with (e/(name+'.log')).open('w') as log:r=subprocess.run(args,stdout=log,stderr=subprocess.STDOUT,env=env)
  results.append({'test':name,'exit':r.returncode});print(name,r.returncode)
finally:
 for p,dest in hidden:dest.rename(p)
 (e/'results.json').write_text(json.dumps(results,indent=2))
assert all(x['exit']==0 for x in results)
