-- Local rehearsal ONLY. Deliberately outside automatic Supabase migrations.
BEGIN;
CREATE SCHEMA doku_sandbox;
REVOKE ALL ON SCHEMA doku_sandbox FROM PUBLIC,anon,authenticated;
CREATE TABLE doku_sandbox.invoices (
 invoice text PRIMARY KEY CHECK(invoice ~ '^[A-Za-z0-9._-]{1,30}$'),
 merchant text NOT NULL CHECK(merchant ~ '^[A-Za-z0-9._-]{1,128}$'),
 request_id text UNIQUE NOT NULL CHECK(request_id ~ '^[A-Za-z0-9._-]{1,128}$'),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
 payer_id uuid NOT NULL REFERENCES auth.users(id),
 version bigint NOT NULL,
 amount_idr bigint NOT NULL CHECK(amount_idr BETWEEN 1 AND 9007199254740991),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(version,amount_idr) REFERENCES public.package_price_versions(version,amount_idr)
);
CREATE TABLE doku_sandbox.inbox (
 merchant text NOT NULL, event_id text NOT NULL,
 payload_hash text NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
 invoice text NOT NULL REFERENCES doku_sandbox.invoices(invoice),
 action text NOT NULL CHECK(action IN ('ignore','sandbox-payment-candidate')),
 received_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(merchant,event_id)
);
CREATE TABLE doku_sandbox.candidates (
 invoice text PRIMARY KEY REFERENCES doku_sandbox.invoices(invoice),
 proposed_start timestamptz NOT NULL,
 proposed_end timestamptz NOT NULL,
 CHECK(proposed_end>proposed_start)
);
CREATE TABLE doku_sandbox.audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 invoice text NOT NULL REFERENCES doku_sandbox.invoices(invoice),
 action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION doku_sandbox.immutable() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'immutable sandbox ledger'; END $$;
CREATE TRIGGER invoice_immutable BEFORE UPDATE OR DELETE ON doku_sandbox.invoices FOR EACH ROW EXECUTE FUNCTION doku_sandbox.immutable();
CREATE TRIGGER inbox_immutable BEFORE UPDATE OR DELETE ON doku_sandbox.inbox FOR EACH ROW EXECUTE FUNCTION doku_sandbox.immutable();
CREATE TRIGGER candidate_immutable BEFORE UPDATE OR DELETE ON doku_sandbox.candidates FOR EACH ROW EXECUTE FUNCTION doku_sandbox.immutable();
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON doku_sandbox.audit FOR EACH ROW EXECUTE FUNCTION doku_sandbox.immutable();
CREATE FUNCTION doku_sandbox.snapshot(p_invoice text) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT jsonb_build_object('environment','sandbox','invoice',invoice,'merchant',merchant,'requestId',request_id,'workspaceId',workspace_id,'packageVersion',version::text,'amount',amount_idr,'packageAmountIdr',amount_idr::text,'currency','IDR','durationUnit','calendar_year','durationCount',1,'workspaceCount',1,'grantsAccess',false)
 FROM doku_sandbox.invoices WHERE invoice=p_invoice
$$;
CREATE FUNCTION doku_sandbox.reserve(p_user uuid,p_workspace uuid,p_merchant text,p_invoice text,p_request text) RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $$
DECLARE v bigint; a bigint;
BEGIN
 -- Membership row lock held until commit; revocation must obtain this same row.
 PERFORM 1 FROM public.workspace_members WHERE workspace_id=p_workspace AND user_id=p_user AND role='owner' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'not authorized'; END IF;
 -- Lock the pointer first. A joined locking SELECT can follow an updated
 -- pointer after waiting while its statement snapshot cannot see the new version.
 SELECT c.version INTO v FROM public.package_price_current c WHERE c.id FOR SHARE;
 SELECT p.amount_idr INTO a FROM public.package_price_versions p WHERE p.version=v;
 IF v IS NULL THEN RAISE EXCEPTION 'pricing unavailable'; END IF;
 INSERT INTO doku_sandbox.invoices(invoice,merchant,request_id,workspace_id,payer_id,version,amount_idr) VALUES(p_invoice,p_merchant,p_request,p_workspace,p_user,v,a);
 INSERT INTO doku_sandbox.audit(invoice,action) VALUES(p_invoice,'reserved');
 RETURN doku_sandbox.snapshot(p_invoice);
END $$;
CREATE FUNCTION doku_sandbox.status(p_user uuid,p_invoice text) RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM doku_sandbox.invoices i JOIN public.workspace_members m ON m.workspace_id=i.workspace_id WHERE i.invoice=p_invoice AND m.user_id=p_user AND i.payer_id=p_user) THEN RAISE EXCEPTION 'not authorized'; END IF;
 RETURN doku_sandbox.snapshot(p_invoice)||jsonb_build_object('state',CASE WHEN EXISTS(SELECT 1 FROM doku_sandbox.candidates WHERE invoice=p_invoice) THEN 'sandbox-candidate' ELSE 'reserved' END);
END $$;
CREATE FUNCTION doku_sandbox.calendar_year(p_start timestamptz) RETURNS timestamptz LANGUAGE sql IMMUTABLE STRICT SET search_path='' AS $$
 SELECT ((p_start AT TIME ZONE 'Asia/Jakarta') + interval '1 year') AT TIME ZONE 'Asia/Jakarta'
$$;
CREATE FUNCTION doku_sandbox.accept(p_merchant text,p_event text,p_hash text,p_invoice text,p_original text,p_amount bigint,p_action text,p_received timestamptz) RETURNS text LANGUAGE plpgsql SET search_path='' AS $$
DECLARE i doku_sandbox.invoices; old_hash text; outcome text;
BEGIN
 IF p_event IS NULL OR p_event !~ '^[A-Za-z0-9._-]{1,128}$' OR p_received IS NULL OR NOT isfinite(p_received) THEN RAISE EXCEPTION 'invalid event'; END IF;
 -- Serialize event identity before invoice; same event cannot target two invoices.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_merchant||':'||p_event,0));
 SELECT * INTO i FROM doku_sandbox.invoices WHERE invoice=p_invoice FOR UPDATE;
 IF NOT FOUND OR i.merchant IS DISTINCT FROM p_merchant OR i.request_id IS DISTINCT FROM p_original OR i.amount_idr IS DISTINCT FROM p_amount THEN RAISE EXCEPTION 'order mismatch'; END IF;
 SELECT payload_hash INTO old_hash FROM doku_sandbox.inbox WHERE merchant=p_merchant AND event_id=p_event;
 IF old_hash IS NOT NULL THEN
  IF old_hash=p_hash THEN RETURN 'duplicate-event'; END IF;
  INSERT INTO doku_sandbox.audit(invoice,action) VALUES(p_invoice,'event-conflict');
  RETURN 'conflict';
 END IF;
 INSERT INTO doku_sandbox.inbox(merchant,event_id,payload_hash,invoice,action) VALUES(p_merchant,p_event,p_hash,p_invoice,p_action);
 outcome:='record-ignored';
 IF p_action='sandbox-payment-candidate' THEN
  INSERT INTO doku_sandbox.candidates(invoice,proposed_start,proposed_end) VALUES(p_invoice,p_received,doku_sandbox.calendar_year(p_received)) ON CONFLICT DO NOTHING;
  outcome:=CASE WHEN FOUND THEN 'record-candidate' ELSE 'duplicate-payment' END;
 END IF;
 INSERT INTO doku_sandbox.audit(invoice,action) VALUES(p_invoice,outcome);
 RETURN outcome;
END $$;
-- Invoker functions: only a future dedicated trusted server DB role may execute.
-- Never expose user-argument functions through PostgREST or grant API roles.
ALTER TABLE doku_sandbox.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE doku_sandbox.inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE doku_sandbox.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE doku_sandbox.audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA doku_sandbox FROM PUBLIC,anon,authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA doku_sandbox FROM PUBLIC,anon,authenticated;
COMMIT;
