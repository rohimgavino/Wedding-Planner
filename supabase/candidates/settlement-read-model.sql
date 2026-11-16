-- OFFLINE additive read projection only; does not mutate grants/orders.
BEGIN;
ALTER FUNCTION public.doku_workspace_orders(uuid) RENAME TO legacy_doku_workspace_orders;
REVOKE ALL ON FUNCTION public.legacy_doku_workspace_orders(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.doku_workspace_orders(p_workspace_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; orders jsonb; grants jsonb;
BEGIN
result:=public.legacy_doku_workspace_orders(p_workspace_id);
SELECT coalesce(jsonb_agg(CASE WHEN s.invoice IS NULL THEN item ELSE item || jsonb_build_object(
 'terms',s.terms,'duration_days',(s.terms->>'duration_days')::int,
 'expires_at',s.expires_at,'revoked_at',r.revoked_at) END ORDER BY ordinal),'[]'::jsonb)
INTO orders FROM jsonb_array_elements(result->'orders') WITH ORDINALITY a(item,ordinal)
LEFT JOIN public.package_settlements s ON s.invoice=item->>'invoice'
LEFT JOIN public.package_settlement_revocations r ON r.invoice=s.invoice;
SELECT coalesce(jsonb_agg(g),'[]'::jsonb) INTO grants FROM (
 SELECT jsonb_build_object('feature',f.feature,'payment_provider','doku','payment_reference',s.invoice,
 'expires_at',s.expires_at,'revoked_at',r.revoked_at,'terms',s.terms) g
 FROM public.package_settlements s LEFT JOIN public.package_settlement_revocations r ON r.invoice=s.invoice
 CROSS JOIN LATERAL (SELECT 'core' feature WHERE s.terms->'benefits' ? 'collaboration'
 UNION ALL SELECT 'shared_savings' WHERE s.terms->'benefits' ? 'shared_savings'
 UNION ALL SELECT s.terms->>'tier' WHERE s.terms->>'contract_version'='1' AND s.terms->>'tier' IN ('starter','premium','wedding_pro')) f
 WHERE s.workspace_id=p_workspace_id
) projection;
RETURN result || jsonb_build_object('orders',orders,'entitlements',(result->'entitlements')||grants);
END $$;
REVOKE ALL ON FUNCTION public.doku_workspace_orders(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.doku_workspace_orders(uuid) TO authenticated,service_role;
COMMIT;
