"""Narrow one-shot authorized paid RLS cutover. Never auto rollback or retry DDL."""
import ast
import copy
import hashlib
import json
import pathlib
import re
import subprocess
import sys

ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/release'
REF='lkudkvjaxdjntjosudni'
PIN='15180763a40c3d1189d46bbd2b0ce18f3b93f15dd56be79e7769c3873a729dff'
STATE=OUT/'production-paid-cutover-20261114.json'
TABLES=['budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments']
source=(OUT/'run-production-paid-preflight.py').read_text()
tree=ast.parse(source)
ns={'re':re,'json':json}
for node in tree.body:
    if isinstance(node,ast.FunctionDef) and node.name in ('safe','strip_outer'):
        exec(compile(ast.Module(body=[node],type_ignores=[]),'<reviewed_helpers>','exec'),ns)
cohort_sql=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='cohort_sql' for t in n.targets))
safe=ns['safe']; strip_outer=ns['strip_outer']

def digest(value):
    b=value if isinstance(value,bytes) else json.dumps(value,sort_keys=True,separators=(',',':')).encode()
    return hashlib.sha256(b).hexdigest()

def save(state):
    STATE.write_text(json.dumps(safe(state),indent=2)+'\n',encoding='utf-8')

def cli(args):
    return subprocess.run(['npx.cmd','--no-install','supabase']+args,cwd=ROOT,capture_output=True,text=True,encoding='utf-8',timeout=100)

def query_file(path):
    result=cli(['db','query','--linked','--project-ref',REF,'--file',str(path)])
    if result.returncode: raise RuntimeError('QUERY_FAILED_EXIT_'+str(result.returncode))
    try:
        raw,_=json.JSONDecoder().raw_decode(result.stdout[result.stdout.index('{'):])
        return raw['rows']
    except Exception: raise RuntimeError('QUERY_OUTPUT_UNRECOGNIZED') from None

def query(name,sql):
    path=OUT/name
    path.write_text(sql,encoding='utf-8')
    return query_file(path)

def bounded(sql):
    return sql.replace('BEGIN TRANSACTION READ ONLY;','BEGIN TRANSACTION READ ONLY;\nSET LOCAL lock_timeout=\'3s\';\nSET LOCAL statement_timeout=\'30s\';\nSET LOCAL idle_in_transaction_session_timeout=\'30s\';',1)

snapshot_sql=bounded((OUT/'production-schema-drift-20261114.select.sql').read_text())
# Data never leaves PostgreSQL: return only table counts and SHA256 of sorted row hashes.
data_sql="""BEGIN TRANSACTION READ ONLY;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
SET LOCAL idle_in_transaction_session_timeout='30s';
DO $aggregate$
DECLARE t record; n bigint; fingerprint text; items jsonb:='[]'::jsonb;
BEGIN
 FOR t IN SELECT n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname IN ('public','starter_private') ORDER BY n.nspname,c.relname LOOP
  EXECUTE format('SELECT count(*),encode(sha256(convert_to(COALESCE(string_agg(h, '''' ORDER BY h),''''),''UTF8'')),''hex'') FROM (SELECT encode(sha256(convert_to(to_jsonb(x)::text,''UTF8'')),''hex'') h FROM %I.%I x) q',t.nspname,t.relname) INTO n,fingerprint;
  items:=items||jsonb_build_array(jsonb_build_object('schema',t.nspname,'table',t.relname,'rows',n,'sha256_sorted_row_hashes',fingerprint));
 END LOOP;
 PERFORM set_config('paid_cutover.aggregate',items::text,true);
END
$aggregate$;
SELECT current_setting('paid_cutover.aggregate')::jsonb AS aggregates;
ROLLBACK;
"""

def invariants(snapshot):
    result=copy.deepcopy(snapshot)
    for t in result['tables']:
        t['policies']=[p for p in t['policies'] if p['policyname']!='paid_core_access']
    result['dependencies']=[d for d in result['dependencies'] if not d['dependent'].startswith('policy paid_core_access on table ')]
    return result

def validate_policies(snapshot):
    found=[p for t in snapshot['tables'] for p in t['policies'] if p['policyname']=='paid_core_access']
    expected=json.loads((OUT/'production-paid-preflight-20261114.json').read_text())['native_rehearsal']['policies']
    assert sorted(found,key=lambda x:x['tablename'])==sorted(expected,key=lambda x:x['tablename']), 'EXACT_POLICY_MISMATCH'
    assert len(found)==8 and sorted(p['tablename'] for p in found)==sorted(TABLES)
    return found

def main(phase):
    candidate=(ROOT/'supabase/migrations/202611140001_paid_access_rls.sql').read_bytes()
    assert digest(candidate)==PIN and candidate==(ROOT/'supabase/activation/paid-enforcement.sql').read_bytes()
    body=strip_outer(candidate.decode())
    assert body.count('DROP POLICY IF EXISTS paid_core_access')==1 and body.count('CREATE POLICY paid_core_access')==1
    assert body.count('public.is_workspace_member(workspace_id) AND public.has_workspace_entitlement(workspace_id, \'\'core\'\')')==2
    linked=json.loads((ROOT/'supabase/.temp/linked-project.json').read_text())
    assert linked['ref']==REF
    inject=b"\nSET LOCAL lock_timeout='3s';\nSET LOCAL statement_timeout='30s';\nSET LOCAL idle_in_transaction_session_timeout='30s';"
    # Lexer's strict outer shape validated above. Exact split preserves every canonical byte.
    marker=b'BEGIN;'
    assert candidate.count(marker)==1
    offset=candidate.index(marker)+len(marker)
    wrapper=candidate[:offset]+inject+candidate[offset:]
    assert wrapper[:offset]+wrapper[offset+len(inject):]==candidate
    wrapper_path=OUT/'production-paid-cutover-bounded.sql'
    if phase=='preflight':
        assert not STATE.exists(), 'EXISTING_EXECUTION_STATE_STOP'
        wrapper_path.write_bytes(wrapper)
        before=query('production-paid-cutover-schema.select.sql',snapshot_sql)[0]['schema_snapshot']
        old=json.loads((OUT/'production-schema-drift-20261114.json').read_text())
        assert before==old,'SCHEMA_DRIFT_STOP'
        cohort=query('production-paid-cutover-cohort.select.sql',bounded(cohort_sql))[0]['evidence']
        prior=json.loads((OUT/'production-paid-preflight-20261114.json').read_text())
        assert cohort==prior['cohort'],'COHORT_ACL_HISTORY_DRIFT_STOP'
        data=query('production-paid-cutover-data-aggregates.select.sql',data_sql)[0]['aggregates']
        smoke=(OUT/'production-paid-rollback-rehearsal.sql').read_text()
        # Only reuse read-only verification block; omit candidate policy DO entirely.
        smoke='BEGIN TRANSACTION READ ONLY;\n'+inject.decode()+'\n'+smoke[smoke.index('DO $verify$'):]
        assert 'DROP POLICY' not in smoke and 'CREATE POLICY' not in smoke and smoke.rstrip().endswith('ROLLBACK;')
        (OUT/'production-paid-cutover-role-smoke.select.sql').write_text(smoke,encoding='utf-8')
        state={'status':'PREFLIGHT_PASS_NOT_APPLIED','target':REF,'candidate_sha256':PIN,'activation_byte_identical':True,'wrapper_sha256':digest(wrapper),'canonical_bytes_preserved_except_timeout_insertion':True,'fresh_schema_exact_reviewed':True,'fresh_cohort_exact_reviewed':True,'before_schema_sha256':digest(before),'cohort_before':cohort,'data_aggregates_before':data,'data_before_sha256':digest(data),'smoke_sql_sha256':digest(smoke.encode()),'apply_attempts':0,'history_attempts':0,'failures':[]}
        save(state)
        print(json.dumps({'status':state['status'],'wrapper_sha256':state['wrapper_sha256'],'data_tables':len(data),'data_sha256':digest(data)}))
        return
    state=json.loads(STATE.read_text())
    assert state['wrapper_sha256']==digest(wrapper)==digest(wrapper_path.read_bytes())
    if phase=='apply':
        assert state['status']=='PREFLIGHT_PASS_NOT_APPLIED' and state['apply_attempts']==0
        # Repeat fresh guards immediately before the only apply attempt.
        before=query('production-paid-cutover-schema.select.sql',snapshot_sql)[0]['schema_snapshot']
        assert digest(before)==state['before_schema_sha256'],'FRESH_SCHEMA_DRIFT_STOP'
        assert query('production-paid-cutover-cohort.select.sql',bounded(cohort_sql))[0]['evidence']==state['cohort_before'],'FRESH_COHORT_DRIFT_STOP'
        assert query('production-paid-cutover-data-aggregates.select.sql',data_sql)[0]['aggregates']==state['data_aggregates_before'],'FRESH_DATA_DRIFT_STOP'
        state.update(status='APPLY_DISPATCHED_AMBIGUOUS_UNTIL_READBACK',apply_attempts=1)
        save(state)
        try:
            result=cli(['db','query','--linked','--project-ref',REF,'--file',str(wrapper_path)])
            state['apply_cli_exit']=result.returncode
        except Exception:
            state['apply_cli_exit']='UNKNOWN_TIMEOUT_OR_TRANSPORT'
        save(state)
        # Always read catalog; never retry DDL even on ambiguous CLI exit.
        after=query('production-paid-cutover-schema.select.sql',snapshot_sql)[0]['schema_snapshot']
        policies=validate_policies(after)
        assert invariants(after)==before,'UNEXPECTED_SCHEMA_CHANGE_STOP'
        cohort=query('production-paid-cutover-cohort.select.sql',bounded(cohort_sql))[0]['evidence']
        assert cohort==state['cohort_before'],'COHORT_CHANGED_STOP'
        data=query('production-paid-cutover-data-aggregates.select.sql',data_sql)[0]['aggregates']
        assert data==state['data_aggregates_before'],'DATA_AGGREGATES_CHANGED_STOP'
        smoke=query_file(OUT/'production-paid-cutover-role-smoke.select.sql')[0]['evidence']
        assert smoke['role_select']['checks']==72 and smoke['role_select']['allowed_checks']==16 and smoke['role_select']['denied_checks']==56
        # Independent second read demonstrates persistence after read-only smoke rolled back.
        persistent=query('production-paid-cutover-schema.select.sql',snapshot_sql)[0]['schema_snapshot']
        assert persistent==after
        state.update(status='APPLIED_VERIFIED_NOT_YET_RECORDED',policy_count=len(policies),policies=policies,schema_except_paid_policies_and_dependencies_equal=True,functions_acl_settings_membership_policies_unchanged=True,data_aggregates_after=data,data_aggregate_before_after_equal=True,data_after_sha256=digest(data),cohort_before_after_equal=True,role_smoke=smoke,persistent_catalog_sha256=digest(persistent),no_application_dml=True)
        save(state)
        print(json.dumps({'status':state['status'],'policy_count':8,'apply_cli_exit':state['apply_cli_exit'],'role_smoke':smoke['role_select'],'data_sha256':digest(data)}))
    elif phase=='record':
        assert state['status']=='APPLIED_VERIFIED_NOT_YET_RECORDED' and state['history_attempts']==0
        assert digest(query('production-paid-cutover-schema.select.sql',snapshot_sql)[0]['schema_snapshot'])==state['persistent_catalog_sha256']
        state.update(status='APPLIED_VERIFIED_HISTORY_DISPATCHED',history_attempts=1)
        save(state)
        try:
            result=cli(['migration','repair','--status','applied','202611140001','--linked','--project-ref',REF])
            state['history_cli_exit']=result.returncode
        except Exception:
            state['history_cli_exit']='UNKNOWN_TIMEOUT_OR_TRANSPORT'
        save(state)
        cohort=query('production-paid-cutover-cohort.select.sql',bounded(cohort_sql))[0]['evidence']
        ledger=cohort.pop('ledger'); old=copy.deepcopy(state['cohort_before']); oldledger=old.pop('ledger')
        assert cohort==old,'FINAL_COHORT_CHANGED_STOP'
        added=[x for x in ledger if x['version']=='202611140001']
        assert len(added)==1 and [x for x in ledger if x['version']!='202611140001']==oldledger,'APPLIED_UNRECORDED_OR_HISTORY_MISMATCH_STOP'
        final=query('production-paid-cutover-schema.select.sql',snapshot_sql)[0]['schema_snapshot']
        validate_policies(final)
        assert digest(final)==state['persistent_catalog_sha256']
        assert query('production-paid-cutover-data-aggregates.select.sql',data_sql)[0]['aggregates']==state['data_aggregates_before']
        assert digest((ROOT/'supabase/migrations/202611140001_paid_access_rls.sql').read_bytes())==PIN
        state.update(status='PERSISTENT_APPLIED_VERIFIED_RECORDED',ledger_after=ledger,ledger_added_only=added,final_policy_count=8,final_data_aggregate_equal=True,limitations=['SQL_ROLE_SIMULATION_NOT_JWT_POSTGREST','NO_NATIVE_PARTNER_EXPIRED_REVOKED_COHORTS_LOCAL_ONLY','NATIVE_CONCURRENCY_UNPROVEN','BACKUP_RESTORE_UNPROVEN','NOT_PRODUCT_RELEASE_READINESS_SIGNOFF'])
        save(state)
        print(json.dumps({'status':state['status'],'policy_count':8,'ledger_count':len(ledger),'ledger_added_only':added,'history_cli_exit':state['history_cli_exit']}))
    else: raise ValueError('Unknown phase')

if __name__=='__main__':
    try: main(sys.argv[1])
    except Exception as exc:
        code=str(exc) if isinstance(exc,AssertionError) else type(exc).__name__
        if STATE.exists():
            s=json.loads(STATE.read_text()); s['failures'].append(code or 'ASSERTION_FAILED'); save(s)
        print(json.dumps({'status':'STOP_NO_AUTOMATIC_RETRY_OR_ROLLBACK','error':code or 'ASSERTION_FAILED'}))
        sys.exit(1)
