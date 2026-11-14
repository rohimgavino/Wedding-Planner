BEGIN TRANSACTION READ ONLY;
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
