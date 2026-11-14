import pathlib,json,re
root=pathlib.Path(__file__).resolve().parents[2]
d=json.loads((root/'docs/release/production-schema-drift-20261114.json').read_text())
source='\n'.join(p.read_text() for p in sorted((root/'supabase/migrations').glob('*.sql')))
names=['is_workspace_member','has_workspace_entitlement','has_developer_test_access','site_role']
norm=lambda s:re.sub(r'\s+','',s).lower()
result={}
for name in names:
    pattern=r'CREATE(?: OR REPLACE)? FUNCTION public\.'+name+r'\s*\([\s\S]*?AS\s+(\$[A-Za-z_0-9]*\$)([\s\S]*?)\1'
    matches=list(re.finditer(pattern,source,re.I))
    f=next(f for f in d['functions'] if f['name']==name)
    live=re.search(r'AS (\$[A-Za-z_0-9]*\$)([\s\S]*?)\1',f['definition'])
    assert live is not None
    result[name]=bool(matches and norm(matches[-1][2])==norm(live[2]))
print(json.dumps(result))
assert all(result.values())
