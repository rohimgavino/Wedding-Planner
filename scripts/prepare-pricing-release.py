"""Build a new isolated pricing slice from the published transparent baseline; never deploy."""
from pathlib import Path
import shutil,hashlib,json,uuid
P=Path(__file__).resolve().parents[1]
B=Path('D:/pocketwedding-releases/pocket-planner-transparent-20261022')
R=B.parent/('pocket-planner-pricing-local-'+uuid.uuid4().hex[:10]);R.mkdir()
for name in ['src','public','scripts']:shutil.copytree(B/name,R/name)
for name in ['package.json','package-lock.json','next.config.mjs','postcss.config.mjs','tailwind.config.ts','tsconfig.json','next-env.d.ts','.eslintrc.json']:shutil.copy2(B/name,R/name)
# Permanent pre-edit backup outside TS source include tree.
backup=P/'backups'/('pricing-release-'+R.name);backup.mkdir(parents=True)
shutil.copy2(R/'src/components/admin-release-panel.tsx',backup/'admin-release-panel.tsx')
for name in ['src/components/admin-pricing.tsx','src/lib/admin-pricing.ts','supabase/migrations/202610220001_admin_package_pricing.sql']:
 dest=R/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(P/name,dest)
f=R/'src/components/admin-release-panel.tsx';text=f.read_text()
text=text.replace("import {AdminShell}","import {AdminPricing} from '@/components/admin-pricing';\nimport {AdminShell}")
text=text.replace("'Paket & Harga':'Katalog harga server berversi belum dirilis. Tidak ada harga perkiraan atau perubahan harga. Tahun kalender tidak dikonversi otomatis menjadi 365 hari.',",'')
text=text.replace('Tahap UI baca-saja. Pembayaran, penjualan baru, perubahan harga, role dan aktivasi akses tidak tersedia di rilis ini. DOKU belum terintegrasi.','Paket & Harga memerlukan migrasi katalog server. Panel lain tetap baca-saja atau belum tersedia. Pembayaran, penjualan baru, role dan aktivasi akses tidak tersedia. DOKU belum terintegrasi.')
text=text.replace("{unavailable[menu]&&", "{menu==='Paket & Harga'&&<AdminPricing/>}\n {unavailable[menu]&&")
f.write_text(text)
# Every source/public file other than three allowlisted UI files must match baseline exactly.
allowed={'src/components/admin-release-panel.tsx','src/components/admin-pricing.tsx','src/lib/admin-pricing.ts'}
manifest={}
for tree in ['src','public']:
 for file in (R/tree).rglob('*'):
  if not file.is_file():continue
  rel=file.relative_to(R).as_posix();digest=hashlib.sha256(file.read_bytes()).hexdigest();manifest[rel]=digest
  if rel not in allowed:assert (B/rel).is_file() and hashlib.sha256((B/rel).read_bytes()).hexdigest()==digest,rel
(R/'SOURCE-MANIFEST.json').write_text(json.dumps({'baseline':str(B),'historical_version':'d26a9cea-f923-406f-b49c-9283fd970c3c','allowlisted_ui':sorted(allowed),'sha256':manifest,'status':'LOCAL ONLY; NOT DEPLOYED'},indent=2))
print(R)
