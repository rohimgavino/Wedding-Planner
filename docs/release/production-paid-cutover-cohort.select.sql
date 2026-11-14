BEGIN TRANSACTION READ ONLY;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
SET LOCAL idle_in_transaction_session_timeout='30s';
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
