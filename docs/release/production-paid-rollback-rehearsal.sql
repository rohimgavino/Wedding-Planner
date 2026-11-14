BEGIN;
SET LOCAL lock_timeout='1500ms';
SET LOCAL statement_timeout='20s';
SET LOCAL idle_in_transaction_session_timeout='25s';

DO $paid_rls$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['budgets','tasks','guests','savings_accounts','savings_contributions','vendors','vendor_installments','vendor_payments'] LOOP
    -- Only replace this migration's own policy, never the permissive member policy.
    EXECUTE format('DROP POLICY IF EXISTS paid_core_access ON public.%I', target);
    EXECUTE format(
      'CREATE POLICY paid_core_access ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
       USING (public.is_workspace_member(workspace_id) AND public.has_workspace_entitlement(workspace_id, ''core''))
       WITH CHECK (public.is_workspace_member(workspace_id) AND public.has_workspace_entitlement(workspace_id, ''core''))',
      target
    );
  END LOOP;
END
$paid_rls$;
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
