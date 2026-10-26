"""Local-only allowlisted transfer into a clean 2de765a worktree; never deploys."""
import hashlib,json,subprocess,sys
from pathlib import Path
source=Path(__file__).resolve().parents[1]
target=Path(sys.argv[1]).resolve()
assert target!=source
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=target,text=True).strip()=='2de765a48bb9b3a6535e466755f53442eef1ae8c'
assert not subprocess.check_output(['git','status','--porcelain'],cwd=target,text=True).strip(),'target must be clean'
files=['src/app/admin/page.tsx','src/lib/commerce.ts']+['supabase/migrations/'+name for name in ['202610140001_workspace_entitlements_savings.sql','202610140002_admin_manual_purchases.sql','202610140004_developer_operator_roles.sql']]
manifest={}
for name in files:
 data=(source/name).read_bytes()
 if name=='src/app/admin/page.tsx':
  text=data.decode().replace('checked={enabled} onChange={e=>setEnabled(e.target.checked)}','checked={false} disabled').replace('Buka penjualan paket inti','Penjualan dinonaktifkan pada tahap admin').replace('c.save(email,price,days,url,enabled)','c.save(email,price,days,url,false)')
  text=text.replace(",[enabled,setEnabled]=useState(false)",'').replace('setEnabled(s.sales_enabled);','')
  data=text.encode()
 dest=target/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
 manifest[name]=hashlib.sha256(data).hexdigest()
(target/'admin-release-manifest.json').write_text(json.dumps({'baseline':'2de765a48bb9b3a6535e466755f53442eef1ae8c','files':manifest,'excluded':['paid-enforcement','reset RPC/UI','purchase route','dashboard/context/cloud pending changes','secrets']},indent=2))
print('Prepared',len(files),'allowlisted files; baseline planner untouched; no activation/reset packaged')
