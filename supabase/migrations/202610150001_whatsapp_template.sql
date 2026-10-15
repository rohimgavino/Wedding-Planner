-- Additive workspace setting; inherits existing tenant member SELECT/UPDATE RLS.
BEGIN;
ALTER TABLE public.workspaces ADD COLUMN wa_template jsonb;
CREATE FUNCTION public.valid_wa_template(v jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT v IS NULL OR coalesce(jsonb_typeof(v)='object' AND
 v ?& ARRAY['style','time','zone','venue','address','maps','edited'] AND
 (v - ARRAY['style','time','zone','venue','address','maps','edited'])='{}'::jsonb AND
 v->>'style' IN ('formal','islami','santai') AND v->>'zone' IN ('WIB','WITA','WIT') AND
 jsonb_typeof(v->'style')='string' AND jsonb_typeof(v->'zone')='string' AND
 jsonb_typeof(v->'time')='string' AND length(v->>'time')<=200 AND
 jsonb_typeof(v->'venue')='string' AND length(v->>'venue')<=300 AND
 jsonb_typeof(v->'address')='string' AND length(v->>'address')<=2000 AND
 jsonb_typeof(v->'maps')='string' AND length(v->>'maps')<=2000 AND
 (v->>'maps'='' OR v->>'maps' ~ '^https://(maps\.app\.goo\.gl|maps\.google\.com|www\.google\.com|google\.com|goo\.gl)/') AND
 (v->'edited'='null'::jsonb OR (jsonb_typeof(v->'edited')='string' AND length(v->>'edited')<=12000)),false);
$$;
REVOKE ALL ON FUNCTION public.valid_wa_template(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.valid_wa_template(jsonb) TO authenticated;
ALTER TABLE public.workspaces ADD CONSTRAINT valid_wa_template CHECK (public.valid_wa_template(wa_template));
COMMIT;
