-- OFFLINE ONLY: restore original paid restrictions, NOT membership-only enforcement rollback.
BEGIN;
DO $$ DECLARE r record; BEGIN
IF (SELECT count(*) FROM public.integration_policy_baseline)<>8 THEN RAISE EXCEPTION 'missing policy baseline'; END IF;
FOR r IN SELECT * FROM public.integration_policy_baseline LOOP
EXECUTE format('DROP POLICY IF EXISTS paid_core_access ON public.%I',r.table_name);
EXECUTE r.definition;
END LOOP;
IF NOT EXISTS(SELECT 1 FROM public.integration_helper_baseline WHERE id) THEN RAISE EXCEPTION 'missing helper baseline'; END IF;
EXECUTE (SELECT definition FROM public.integration_helper_baseline WHERE id);
END $$;
DROP FUNCTION IF EXISTS public.integration_policy_access(uuid,text);
COMMIT;
