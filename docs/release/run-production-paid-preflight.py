"""Bounded authorized native rollback-only rehearsal; no customer identifiers emitted."""
import hashlib
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/release'
REF = 'lkudkvjaxdjntjosudni'
TABLES = ['budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments']

def query(sql):
    # SQL contains only schema metadata, aggregate queries and internal dynamic identifiers.
    path = OUT / 'production-paid-preflight-current.sql'
    path.write_text(sql, encoding='utf-8')
    result = subprocess.run(['npx.cmd','--no-install','supabase','db','query','--linked','--project-ref',REF,'--file',str(path)], cwd=ROOT,capture_output=True,text=True,encoding='utf-8')
    if result.returncode:
        raise RuntimeError('Native query failed; raw output suppressed; exit=' + str(result.returncode))
    try:
        raw,_ = json.JSONDecoder().raw_decode(result.stdout[result.stdout.index('{'):])
        return raw['rows']
    except Exception:
        raise RuntimeError('Unrecognized native output; raw output suppressed') from None

def safe(data):
    text=json.dumps(data)
    for pattern in [r'\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b',r'eyJ[A-Za-z0-9_-]{16,}\.',r'postgres(?:ql)?://']:
        assert not re.search(pattern,text,re.I), 'Unsafe evidence refused'
    return data

def strip_outer(sql):
    # Lexer recognizes quoted strings, identifiers, dollar bodies and SQL comments.
    # Only genuine top-level semicolons delimit statements; never regex-strip bodies.
    tokens=[]; start=0; i=0
    while i<len(sql):
        if sql.startswith('--',i):
            end=sql.find('\n',i); i=len(sql) if end<0 else end+1; continue
        if sql.startswith('/*',i):
            depth=1; i+=2
            while depth and i<len(sql):
                if sql.startswith('/*',i): depth+=1; i+=2
                elif sql.startswith('*/',i): depth-=1; i+=2
                else: i+=1
            assert depth==0
            continue
        ch=sql[i]
        if ch in "'\"":
            quote=ch; i+=1
            while i<len(sql):
                if sql[i]==quote:
                    if i+1<len(sql) and sql[i+1]==quote: i+=2; continue
                    i+=1; break
                i+=1
            else: raise AssertionError('Unclosed quote')
            continue
        if ch=='$':
            m=re.match(r'\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$',sql[i:])
            if m:
                end=sql.find(m[0],i+len(m[0])); assert end>=0
                i=end+len(m[0]); continue
        if ch==';': tokens.append(sql[start:i+1]); start=i+1
        i+=1
    assert not sql[start:].strip()
    clean=lambda s: re.sub(r'--[^\n]*(?:\n|$)','',s).strip()
    assert len(tokens)==3 and clean(tokens[0]).upper()=='BEGIN;' and clean(tokens[-1]).upper()=='COMMIT;'
    assert clean(tokens[1]).startswith('DO $paid_rls$')
    return tokens[1]

candidate=(ROOT/'supabase/migrations/202611140001_paid_access_rls.sql').read_bytes()
assert candidate==(ROOT/'supabase/activation/paid-enforcement.sql').read_bytes()
hash_=hashlib.sha256(candidate).hexdigest()
body=strip_outer(candidate.decode())
snapshot_sql=(OUT/'production-schema-drift-20261114.select.sql').read_text()
before=query(snapshot_sql)[0]['schema_snapshot']
previous=json.loads((OUT/'production-schema-drift-20261114.json').read_text())
assert before==previous, 'Hosted scoped schema changed since review; stop before DDL'
planner=[t for t in before['tables'] if t['schema']=='public' and t['name'] in TABLES]
assert len(planner)==8 and all(t['rls'] and len(t['policies'])==1 for t in planner)

cohort_sql="""BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout='15s';
SELECT jsonb_build_object(
'workspaces',(SELECT count(*) FROM public.workspaces),
'memberships',(SELECT count(*) FROM public.workspace_members),
'owners',(SELECT count(*) FROM public.workspace_members WHERE role='owner'),
'partners',(SELECT count(*) FROM public.workspace_members WHERE role<>'owner'),
'active_finite_core',(SELECT count(DISTINCT workspace_id) FROM public.workspace_entitlements WHERE feature='core' AND revoked_at IS NULL AND expires_at>now()),
'active_null_core',(SELECT count(DISTINCT workspace_id) FROM public.workspace_entitlements WHERE feature='core' AND revoked_at IS NULL AND expires_at IS NULL),
'expired_core_rows',(SELECT count(*) FROM public.workspace_entitlements WHERE feature='core' AND revoked_at IS NULL AND expires_at<=now()),
'revoked_core_rows',(SELECT count(*) FROM public.workspace_entitlements WHERE feature='core' AND revoked_at IS NOT NULL),
'no_active_core',(SELECT count(*) FROM public.workspaces w WHERE NOT EXISTS(SELECT 1 FROM public.workspace_entitlements e WHERE e.workspace_id=w.id AND e.feature='core' AND e.revoked_at IS NULL AND (e.expires_at IS NULL OR e.expires_at>now()))),
'developer_own_effective_memberships',(SELECT count(*) FROM public.workspace_members m JOIN public.site_admins a ON a.user_id=m.user_id AND a.role='developer' WHERE m.role='owner' AND EXISTS(SELECT 1 FROM public.developer_test_grants g WHERE g.user_id=m.user_id AND g.workspace_id=m.workspace_id AND g.revoked_at IS NULL AND g.expires_at>now())),
'effective_core_member_access',(SELECT count(*) FROM public.workspace_members m WHERE EXISTS(SELECT 1 FROM public.workspace_entitlements e WHERE e.workspace_id=m.workspace_id AND e.feature='core' AND e.revoked_at IS NULL AND (e.expires_at IS NULL OR e.expires_at>now())) OR (m.role='owner' AND EXISTS(SELECT 1 FROM public.site_admins a WHERE a.user_id=m.user_id AND a.role='developer') AND EXISTS(SELECT 1 FROM public.developer_test_grants g WHERE g.user_id=m.user_id AND g.workspace_id=m.workspace_id AND g.revoked_at IS NULL AND g.expires_at>now()))),
'ledger',(SELECT jsonb_agg(jsonb_build_object('version',version,'name',name) ORDER BY version) FROM supabase_migrations.schema_migrations),
'helper_acl',(SELECT jsonb_agg(jsonb_build_object('name',p.proname,'owner',pg_get_userbyid(p.proowner),'security_definer',p.prosecdef,'config',p.proconfig,'authenticated',has_function_privilege('authenticated',p.oid,'EXECUTE'),'anon',has_function_privilege('anon',p.oid,'EXECUTE')) ORDER BY p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('is_workspace_member','has_workspace_entitlement','has_developer_test_access','site_role')),
'table_acl',(SELECT jsonb_agg(jsonb_build_object('table',c.relname,'select',has_table_privilege('authenticated',c.oid,'SELECT'),'insert',has_table_privilege('authenticated',c.oid,'INSERT'),'update',has_table_privilege('authenticated',c.oid,'UPDATE'),'delete',has_table_privilege('authenticated',c.oid,'DELETE')) ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments'))
) AS evidence;
ROLLBACK;
"""
cohort=safe(query(cohort_sql)[0]['evidence'])
assert all(all(t[k] for k in ['select','insert','update','delete']) for t in cohort['table_acl'])
assert all(f['authenticated'] and f['security_definer'] and f['owner']=='postgres' and f['config']==['search_path=""'] for f in cohort['helper_acl'])
assert not any(x['version']=='202611140001' for x in cohort['ledger'])
# Snapshot equality covers exact function source, security flags, ACL, policies and structure.
# One Management API query submits one PostgreSQL batch/session, explicit BEGIN/ROLLBACK.
rehearsal="""BEGIN;
SET LOCAL lock_timeout='1500ms';
SET LOCAL statement_timeout='20s';
SET LOCAL idle_in_transaction_session_timeout='25s';
"""+body+"""
DO $verify$
DECLARE combos jsonb; item jsonb; target text; uid uuid; ws uuid; allow_access boolean;
expected bigint; observed bigint; checks integer:=0; allowed integer:=0; denied integer:=0;
nonempty_allowed integer:=0; nonempty_denied integer:=0; owner_cases integer:=0; partner_cases integer:=0; outsider_cases integer:=0;
BEGIN
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND policyname='paid_core_access' AND permissive='RESTRICTIVE' AND cmd='ALL' AND roles=ARRAY['authenticated']::name[] AND qual=with_check AND qual LIKE '%is_workspace_member(workspace_id)%' AND qual LIKE '%has_workspace_entitlement(workspace_id, ''core''::text)%')<>8 THEN RAISE EXCEPTION 'POLICY_ASSERTION_FAILED'; END IF;
 SELECT jsonb_agg(jsonb_build_object('uid',a.user_id,'ws',w.id,'member_role',m.role,
 'allow',m.user_id IS NOT NULL AND (EXISTS(SELECT 1 FROM public.workspace_entitlements e WHERE e.workspace_id=w.id AND e.feature='core' AND e.revoked_at IS NULL AND (e.expires_at IS NULL OR e.expires_at>now())) OR (m.role='owner' AND EXISTS(SELECT 1 FROM public.site_admins s WHERE s.user_id=a.user_id AND s.role='developer') AND EXISTS(SELECT 1 FROM public.developer_test_grants g WHERE g.workspace_id=w.id AND g.user_id=a.user_id AND g.revoked_at IS NULL AND g.expires_at>now())))))
 INTO combos FROM (SELECT DISTINCT user_id FROM public.workspace_members) a CROSS JOIN public.workspaces w LEFT JOIN public.workspace_members m ON m.workspace_id=w.id AND m.user_id=a.user_id;
 FOR item IN SELECT value FROM jsonb_array_elements(combos) LOOP
  uid:=(item->>'uid')::uuid; ws:=(item->>'ws')::uuid; allow_access:=(item->>'allow')::boolean;
  IF item->>'member_role'='owner' THEN owner_cases:=owner_cases+1;
  ELSIF item->>'member_role' IS NOT NULL THEN partner_cases:=partner_cases+1;
  ELSE outsider_cases:=outsider_cases+1; END IF;
  FOREACH target IN ARRAY ARRAY['budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments'] LOOP
   EXECUTE format('SELECT count(*) FROM public.%I WHERE workspace_id=$1',target) INTO expected USING ws;
   PERFORM set_config('request.jwt.claim.sub',uid::text,true);
   PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',uid,'role','authenticated')::text,true);
   EXECUTE 'SET LOCAL ROLE authenticated';
   IF current_user<>'authenticated' OR auth.uid() IS DISTINCT FROM uid THEN RAISE EXCEPTION 'ROLE_CONTEXT_FAILED'; END IF;
   EXECUTE format('SELECT count(*) FROM public.%I WHERE workspace_id=$1',target) INTO observed USING ws;
   EXECUTE 'RESET ROLE';
   IF observed<>(CASE WHEN allow_access THEN expected ELSE 0 END) THEN RAISE EXCEPTION 'ROLE_SELECT_ASSERTION_FAILED'; END IF;
   checks:=checks+1;
   IF allow_access THEN allowed:=allowed+1; IF expected>0 THEN nonempty_allowed:=nonempty_allowed+1; END IF;
   ELSE denied:=denied+1; IF expected>0 THEN nonempty_denied:=nonempty_denied+1; END IF; END IF;
  END LOOP;
 END LOOP;
 PERFORM set_config('paid_rehearsal.result',jsonb_build_object('checks',checks,'allowed_checks',allowed,'denied_checks',denied,'nonempty_allowed_checks',nonempty_allowed,'nonempty_denied_checks',nonempty_denied,'owner_pairs',owner_cases,'partner_pairs',partner_cases,'outsider_pairs',outsider_cases,'role_context_asserted',true,'jwt_proof',false)::text,true);
END
$verify$;
SELECT jsonb_build_object('role_select',current_setting('paid_rehearsal.result')::jsonb,'policies',(SELECT jsonb_agg(to_jsonb(p) ORDER BY tablename) FROM pg_policies p WHERE schemaname='public' AND policyname='paid_core_access'),'native_version',version(),'transaction_open',pg_current_xact_id_if_assigned() IS NOT NULL) AS evidence;
ROLLBACK;
"""
(OUT/'production-paid-rollback-rehearsal.sql').write_text(rehearsal,encoding='utf-8')
results=safe(query(rehearsal)[0]['evidence'])
after=query(snapshot_sql)[0]['schema_snapshot']
assert after==before, 'Rollback inventory mismatch'
cohort_after=query(cohort_sql)[0]['evidence']
assert cohort_after==cohort, 'Aggregate cohort changed during bounded rehearsal'
evidence=safe({'status':'PASS_ROLLBACK_ONLY_NOT_CUTOVER','target':REF,'candidate_sha256':hash_,'activation_byte_identical':True,'snapshot_exact_before_and_after':True,'scoped_functions_exact_snapshot':len(before['functions']),'cohort_before_after_equal':True,'cohort':cohort,'native_rehearsal':results,'sql_sha256':hashlib.sha256(rehearsal.encode()).hexdigest(),'no_customer_dml':True,'jwt_postgrest':'NOT_TESTED','native_restore':'NOT_TESTED','multi_connection':'NOT_TESTED'})
(OUT/'production-paid-preflight-20261114.json').write_text(json.dumps(evidence,indent=2)+'\n',encoding='utf-8')
print(json.dumps(evidence,indent=2))
