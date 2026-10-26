-- LOCAL ONLY, additive read-only reporting. Never applies/replaces historical role RPCs.
BEGIN;
CREATE FUNCTION public.admin_sales_report(p_from date DEFAULT NULL,p_to date DEFAULT NULL,p_search text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF public.site_role() IS NULL THEN RAISE EXCEPTION 'admin required'; END IF;
 IF p_search IS NULL OR length(p_search)>100 OR (p_from IS NOT NULL AND p_to IS NOT NULL AND p_from>p_to) THEN RAISE EXCEPTION 'invalid filters'; END IF;
 WITH candidates AS (
  SELECT p.*, (p.status='verified' AND p.verified_by IS NOT NULL AND p.verified_at IS NOT NULL AND EXISTS(
   SELECT 1 FROM public.verified_transactions v WHERE v.request_id=p.id AND v.workspace_id=p.workspace_id AND v.reference=p.transaction_reference
  )) AS recorded
  FROM public.purchase_requests p
  WHERE (p_from IS NULL OR (p.verified_at AT TIME ZONE 'Asia/Jakarta')::date>=p_from)
    AND (p_to IS NULL OR (p.verified_at AT TIME ZONE 'Asia/Jakarta')::date<=p_to)
    AND (strpos(lower(p.id::text||' '||p.workspace_id::text||' '||coalesce(p.transaction_reference,'')),lower(btrim(p_search)))>0)
 ), sales AS (SELECT * FROM candidates WHERE recorded), recent AS (
  SELECT id,workspace_id,price_idr::text AS price_idr,transaction_reference,verified_at FROM sales ORDER BY verified_at DESC,id DESC LIMIT 50
 ) SELECT jsonb_build_object(
  'gross_idr',coalesce((SELECT sum(price_idr) FROM sales),0)::text,
  'sale_count',(SELECT count(*) FROM sales),
  'excluded_verified',(SELECT count(*) FROM candidates WHERE status='verified' AND NOT recorded),
  'rows',coalesce((SELECT jsonb_agg(to_jsonb(recent) ORDER BY verified_at DESC,id DESC) FROM recent),'[]'::jsonb),
  'generated_at',now()
 ) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.admin_sales_report(date,date,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_sales_report(date,date,text) TO authenticated;
COMMENT ON FUNCTION public.admin_sales_report(date,date,text) IS 'Historical manual verified request snapshot amounts with matching permanent registry; not DOKU settlement, bank evidence, profit or effective entitlement. Aggregate all matching rows; detail newest 50. Date is verification date in WIB.';
COMMIT;
