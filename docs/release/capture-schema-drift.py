"""Review-only catalog capture; never reads application rows or migration bodies."""
import hashlib
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = ROOT / 'docs/release/production-schema-drift-20261114'
QUERY = BASE.with_suffix('.select.sql')
SNAPSHOT = BASE.with_suffix('.json')
VALIDATION = BASE.with_suffix('.validation.json')
VERSIONS = ['202610140005', '202610140006', '202610150001', '202610150002']
PLANNER = {'budgets', 'tasks', 'guests', 'savings_accounts', 'savings_contributions', 'vendors', 'vendor_installments', 'vendor_payments'}


def validate(data):
    text = json.dumps(data, ensure_ascii=False)
    # Customer identifiers and credential-shaped literals must not reach artifacts.
    forbidden = [r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b',
                 r'eyJ[A-Za-z0-9_-]{16,}\.', r'-----BEGIN .*PRIVATE KEY',
                 r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
                 r'postgres(?:ql)?://', r'\[truncated\]']
    assert not any(re.search(p, text, re.I) for p in forbidden), 'Unsafe/truncated metadata: refused disk write'
    assert sorted(x['version'] for x in data['migration_ledger']) == VERSIONS
    tables = data['tables']
    assert len({(t['schema'], t['name']) for t in tables}) == len(tables)
    planner = [t for t in tables if t['schema'] == 'public' and t['name'] in PLANNER]
    assert len(planner) == 8
    for t in planner:
        assert t['rls']
        assert len(t['policies']) == 1
        p = t['policies'][0]
        assert p['cmd'] == 'ALL' and p['permissive'] == 'PERMISSIVE'
        assert p['qual'] == p['with_check'] == 'is_workspace_member(workspace_id)'
    for name in ['reset_planning_content', 'create_starter_workspace', 'use_starter_template']:
        f = next(f for f in data['functions'] if f['name'] == name)
        assert f['security_definer'] and f['authenticated_execute'] and not f['anon_execute']
        assert f['definition'].startswith('CREATE OR REPLACE FUNCTION')
    for t in tables:
        assert t['columns']
        assert isinstance(t['constraints'], list) and isinstance(t['indexes'], list)
        for key in ['acl', 'rls', 'force_rls', 'policies', 'triggers']:
            assert key in t
    return {'status': 'PASS', 'scope': 'structural metadata only; not deploy or native restore evidence',
            'tables': len(tables), 'columns': sum(len(t['columns']) for t in tables),
            'constraints': sum(len(t['constraints']) for t in tables),
            'indexes': sum(len(t['indexes']) for t in tables),
            'policies': sum(len(t['policies']) for t in tables),
            'triggers': sum(len(t['triggers']) for t in tables),
            'functions': len(data['functions']), 'dependencies': len(data['dependencies']),
            'ledger_versions': len(data['migration_ledger']), 'membership_only_planner_tables': len(planner),
            'sensitive_literal_scan': 'PASS (heuristic plus catalog-only query; no application-row query)'}


if '--validate-only' in sys.argv:
    data = json.loads(SNAPSHOT.read_text(encoding='utf-8'))
else:
    if SNAPSHOT.exists() or VALIDATION.exists():
        raise SystemExit('Refusing overwrite; use --validate-only for existing evidence')
    command = ['npx.cmd', 'supabase', 'db', 'query', '--linked', '--project-ref',
               'lkudkvjaxdjntjosudni', '--file', str(QUERY)]
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, encoding='utf-8', errors='strict')
    if result.returncode:
        raise SystemExit('Read-only catalog query failed; no snapshot written. Exit ' + str(result.returncode))
    start = result.stdout.index('{')
    envelope, _ = json.JSONDecoder().raw_decode(result.stdout[start:])
    data = envelope['rows'][0]['schema_snapshot']
    validate(data)
    SNAPSHOT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
summary = validate(data)
summary['snapshot_sha256'] = hashlib.sha256(SNAPSHOT.read_bytes()).hexdigest()
summary['query_sha256'] = hashlib.sha256(QUERY.read_bytes()).hexdigest()
if '--validate-only' not in sys.argv:
    VALIDATION.write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
else:
    assert summary == json.loads(VALIDATION.read_text(encoding='utf-8'))
print(json.dumps(summary, indent=2))
