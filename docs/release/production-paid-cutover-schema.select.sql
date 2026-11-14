-- REVIEW ONLY: catalog metadata, never application rows or ledger statement bodies.
-- Run from repository root with db query --linked --project-ref <verified-production-ref> --file <this-file>.
BEGIN TRANSACTION READ ONLY;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
SET LOCAL idle_in_transaction_session_timeout='30s';
WITH target_tables AS (
 SELECT c.oid, n.nspname AS schema_name,c.relname AS table_name,c.relowner,c.relacl,c.relrowsecurity,c.relforcerowsecurity
 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 WHERE c.relkind='r' AND ((n.nspname='public' AND c.relname IN
 ('budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments','workspaces','admin_audit','package_price_current','package_price_versions'))
 OR n.nspname='starter_private')
), target_functions AS (
 SELECT p.*,n.nspname AS schema_name FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
 WHERE p.prokind='f' AND (n.nspname='starter_private' OR (n.nspname='public' AND p.proname IN
 ('reset_planning_content','create_starter_workspace','use_starter_template','vendor_immutable_scope','create_workspace','is_workspace_member','has_workspace_entitlement','has_developer_test_access','site_role'))
 OR p.oid IN (SELECT t.tgfoid FROM pg_catalog.pg_trigger t JOIN target_tables tt ON tt.oid=t.tgrelid WHERE NOT t.tgisinternal))
), target_addresses AS (
 SELECT 'pg_class'::regclass AS classid,oid FROM target_tables
 UNION ALL SELECT 'pg_proc'::regclass,oid FROM target_functions
 UNION ALL SELECT 'pg_constraint'::regclass,c.oid FROM pg_catalog.pg_constraint c WHERE c.conrelid IN (SELECT oid FROM target_tables)
 UNION ALL SELECT 'pg_trigger'::regclass,t.oid FROM pg_catalog.pg_trigger t WHERE t.tgrelid IN (SELECT oid FROM target_tables)
 UNION ALL SELECT 'pg_class'::regclass,i.indexrelid FROM pg_catalog.pg_index i WHERE i.indrelid IN (SELECT oid FROM target_tables)
 UNION ALL SELECT 'pg_policy'::regclass,p.oid FROM pg_catalog.pg_policy p WHERE p.polrelid IN (SELECT oid FROM target_tables)
 UNION ALL SELECT 'pg_attrdef'::regclass,a.oid FROM pg_catalog.pg_attrdef a WHERE a.adrelid IN (SELECT oid FROM target_tables)
), dependency_edges AS (
 SELECT DISTINCT pg_catalog.pg_describe_object(d.classid,d.objid,d.objsubid) AS dependent,
 pg_catalog.pg_describe_object(d.refclassid,d.refobjid,d.refobjsubid) AS referenced,d.deptype AS dependency_type
 FROM pg_catalog.pg_depend d WHERE EXISTS(SELECT 1 FROM target_addresses a WHERE (a.classid=d.classid AND a.oid=d.objid) OR (a.classid=d.refclassid AND a.oid=d.refobjid))
)
SELECT jsonb_build_object(
 'format','review-only-schema-metadata-v1',
 'schemas',(SELECT jsonb_agg(jsonb_build_object('name',n.nspname,'owner',pg_get_userbyid(n.nspowner),'acl',n.nspacl::text) ORDER BY n.nspname) FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('public','starter_private')),
 'migration_ledger',(SELECT jsonb_agg(jsonb_build_object('version',version,'name',name) ORDER BY version) FROM supabase_migrations.schema_migrations WHERE version IN ('202610140005','202610140006','202610150001','202610150002')),
 'functions',(SELECT jsonb_agg(jsonb_build_object('schema',p.schema_name,'name',p.proname,'identity_arguments',pg_get_function_identity_arguments(p.oid),'definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'security_definer',p.prosecdef,'config',p.proconfig,'acl',p.proacl::text,'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE')) ORDER BY p.schema_name,p.proname,p.oid) FROM target_functions p),
 'tables',(SELECT jsonb_agg(jsonb_build_object('schema',tt.schema_name,'name',tt.table_name,'owner',pg_get_userbyid(tt.relowner),'acl',tt.relacl::text,'rls',tt.relrowsecurity,'force_rls',tt.relforcerowsecurity,
 'columns',(SELECT COALESCE(jsonb_agg(jsonb_build_object('name',a.attname,'position',a.attnum,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'identity',a.attidentity,'generated',a.attgenerated,'default',pg_get_expr(ad.adbin,ad.adrelid),'acl',a.attacl::text) ORDER BY a.attnum),'[]'::jsonb) FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef ad ON ad.adrelid=a.attrelid AND ad.adnum=a.attnum WHERE a.attrelid=tt.oid AND a.attnum>0 AND NOT a.attisdropped),
 'constraints',(SELECT COALESCE(jsonb_agg(jsonb_build_object('name',c.conname,'type',c.contype,'definition',pg_get_constraintdef(c.oid,true),'validated',c.convalidated,'deferrable',c.condeferrable,'initially_deferred',c.condeferred) ORDER BY c.conname),'[]'::jsonb) FROM pg_catalog.pg_constraint c WHERE c.conrelid=tt.oid),
 'indexes',(SELECT COALESCE(jsonb_agg(jsonb_build_object('definition',pg_get_indexdef(i.indexrelid),'valid',i.indisvalid,'ready',i.indisready) ORDER BY i.indexrelid::regclass::text),'[]'::jsonb) FROM pg_catalog.pg_index i WHERE i.indrelid=tt.oid),
 'policies',(SELECT COALESCE(jsonb_agg(to_jsonb(pol) ORDER BY pol.policyname),'[]'::jsonb) FROM pg_catalog.pg_policies pol WHERE pol.schemaname=tt.schema_name AND pol.tablename=tt.table_name),
 'triggers',(SELECT COALESCE(jsonb_agg(jsonb_build_object('name',t.tgname,'definition',pg_get_triggerdef(t.oid,true),'enabled',t.tgenabled,'internal',t.tgisinternal,'function',t.tgfoid::regprocedure::text) ORDER BY t.tgname),'[]'::jsonb) FROM pg_catalog.pg_trigger t WHERE t.tgrelid=tt.oid)
 ) ORDER BY tt.schema_name,tt.table_name) FROM target_tables tt),
 'dependencies',(SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.dependent,d.referenced,d.dependency_type),'[]'::jsonb) FROM dependency_edges d),
 'dependency_limit','Catalog edges only. PL/pgSQL body references are not exhaustively tracked by pg_depend; review definitions and source too.'
) AS schema_snapshot;
ROLLBACK;
