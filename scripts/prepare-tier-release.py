"""Extend only the independently published-baseline pricing slice; no canonical future UI."""
from pathlib import Path
import shutil,json,hashlib,uuid
P=Path(__file__).resolve().parents[1]
B=Path('D:/pocketwedding-releases/pocket-planner-pricing-local-5e0575e45c')
R=B.parent/('pocket-planner-tiers-local-'+uuid.uuid4().hex[:10]);R.mkdir()
for tree in ['src','public','scripts']:shutil.copytree(B/tree,R/tree)
for name in ['package.json','package-lock.json','next.config.mjs','postcss.config.mjs','tailwind.config.ts','tsconfig.json','next-env.d.ts','.eslintrc.json']:shutil.copy2(B/name,R/name)
backup=B.parent/'backups'/R.name;backup.mkdir(parents=True)
shutil.copy2(R/'src/components/admin-pricing.tsx',backup/'admin-pricing.tsx')
allowed={'src/components/admin-pricing.tsx','src/components/admin-tier-pricing.tsx','src/lib/tier-pricing.ts'}
for name in allowed|{'supabase/migrations/202610220001_admin_package_pricing.sql','supabase/migrations/202610220002_tier_pricing.sql','scripts/test-tier-browser.py','scripts/test-admin-pricing-browser.py','scripts/verify-tier-pricing.py','scripts/test-tier-client.cjs'}:
 dest=R/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(P/name,dest)
manifest={};changed=[]
for tree in ['src','public']:
 old={f.relative_to(B).as_posix() for f in (B/tree).rglob('*') if f.is_file()};new={f.relative_to(R).as_posix() for f in (R/tree).rglob('*') if f.is_file()}
 assert not old-new
 for rel in new:
  h=hashlib.sha256((R/rel).read_bytes()).hexdigest();manifest[rel]=h
  if not (B/rel).exists() or hashlib.sha256((B/rel).read_bytes()).hexdigest()!=h:changed.append(rel);assert rel in allowed,rel
assert set(changed)==allowed
(R/'SOURCE-MANIFEST.json').write_text(json.dumps({'baseline':str(B),'transparent_ancestor':'D:/pocketwedding-releases/pocket-planner-transparent-20261022','allowlist':sorted(allowed),'changed':sorted(changed),'sha256':manifest,'status':'LOCAL ONLY; no deployment; checkout closed'},indent=2))
(R/'docs/pricing-evidence').mkdir(parents=True)
print(R)
