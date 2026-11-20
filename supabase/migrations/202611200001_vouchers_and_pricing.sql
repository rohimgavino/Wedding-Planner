-- Migration: 202611200001_vouchers_and_pricing.sql
-- Vouchers catalog, validation, administrative controls, and quick price update.

BEGIN;

CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  title text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value bigint NOT NULL CHECK (discount_value > 0),
  max_discount_idr bigint NULL,
  min_purchase_idr bigint NOT NULL DEFAULT 0,
  package_ids text[] NULL,
  max_uses integer NULL,
  used_count integer NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS vouchers_code_upper_idx ON public.vouchers (upper(btrim(code)));

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vouchers FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.voucher_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  invoice text NOT NULL,
  discount_amount_idr bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voucher_usages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.voucher_usages FROM PUBLIC, anon, authenticated;

-- Public / Authenticated voucher validator
CREATE OR REPLACE FUNCTION public.validate_voucher(
  p_code text,
  p_package_id text,
  p_workspace_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rec public.vouchers;
  v_now timestamptz := clock_timestamp();
  v_code text := upper(btrim(COALESCE(p_code, '')));
  v_base_price bigint := 0;
  v_discount bigint := 0;
  v_final_price bigint := 0;
  v_curr_ver bigint;
  v_cfg jsonb;
BEGIN
  IF v_code = '' THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Kode voucher tidak boleh kosong.');
  END IF;

  IF p_package_id IS NULL OR p_package_id NOT IN ('starter', 'premium', 'wedding_pro') THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Paket tidak valid.');
  END IF;

  SELECT * INTO v_rec FROM public.vouchers WHERE upper(btrim(code)) = v_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Kode voucher tidak ditemukan.');
  END IF;

  IF NOT v_rec.is_active THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Voucher saat ini sedang tidak aktif.');
  END IF;

  IF v_now < v_rec.starts_at THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Voucher belum dapat digunakan.');
  END IF;

  IF v_rec.expires_at IS NOT NULL AND v_now > v_rec.expires_at THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Voucher sudah kedaluwarsa.');
  END IF;

  IF v_rec.max_uses IS NOT NULL AND v_rec.used_count >= v_rec.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Kuota pemakaian voucher telah habis.');
  END IF;

  IF v_rec.package_ids IS NOT NULL AND NOT (p_package_id = ANY(v_rec.package_ids)) THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Voucher tidak berlaku untuk paket ini.');
  END IF;

  -- Determine base price of the package
  SELECT version INTO v_curr_ver FROM public.tier_price_current WHERE package_id = p_package_id;
  IF v_curr_ver IS NOT NULL THEN
    SELECT config INTO v_cfg FROM public.tier_price_versions WHERE package_id = p_package_id AND version = v_curr_ver;
    IF v_cfg IS NOT NULL AND v_cfg->>'amount_idr' IS NOT NULL THEN
      v_base_price := (v_cfg->>'amount_idr')::bigint;
    END IF;
  END IF;

  IF v_base_price <= 0 THEN
    -- Fallback default tier prices
    IF p_package_id = 'starter' THEN v_base_price := 49900;
    ELSIF p_package_id = 'premium' THEN v_base_price := 79900;
    ELSIF p_package_id = 'wedding_pro' THEN v_base_price := 99900;
    END IF;
  END IF;

  -- Calculate discount
  IF v_rec.discount_type = 'fixed' THEN
    v_discount := v_rec.discount_value;
  ELSIF v_rec.discount_type = 'percentage' THEN
    v_discount := (v_base_price * v_rec.discount_value) / 100;
    IF v_rec.max_discount_idr IS NOT NULL AND v_discount > v_rec.max_discount_idr THEN
      v_discount := v_rec.max_discount_idr;
    END IF;
  END IF;

  -- Ensure discount doesn't exceed base price (minimum 1000 IDR for gateway processing)
  IF v_discount >= v_base_price THEN
    v_discount := v_base_price - 1000;
  END IF;
  IF v_discount < 0 THEN v_discount := 0; END IF;

  v_final_price := v_base_price - v_discount;

  RETURN jsonb_build_object(
    'valid', true,
    'message', 'Voucher berhasil diterapkan!',
    'code', v_rec.code,
    'title', v_rec.title,
    'discount_type', v_rec.discount_type,
    'discount_value', v_rec.discount_value,
    'discount_amount_idr', v_discount,
    'base_price_idr', v_base_price,
    'final_price_idr', v_final_price
  );
END $$;

REVOKE ALL ON FUNCTION public.validate_voucher(text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_voucher(text, text, uuid) TO authenticated;

-- Admin: list all vouchers
CREATE OR REPLACE FUNCTION public.admin_list_vouchers()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_site_admin() THEN
    RAISE EXCEPTION 'admin required';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(v) ORDER BY v.created_at DESC)
    FROM public.vouchers v
  ), '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.admin_list_vouchers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_vouchers() TO authenticated;

-- Admin: upsert voucher
CREATE OR REPLACE FUNCTION public.admin_upsert_voucher(
  p_code text,
  p_title text,
  p_discount_type text,
  p_discount_value bigint,
  p_max_discount_idr bigint,
  p_max_uses integer,
  p_expires_at timestamptz,
  p_is_active boolean,
  p_package_ids text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_code text := upper(btrim(COALESCE(p_code, '')));
  v_title text := btrim(COALESCE(p_title, ''));
  v_id uuid;
BEGIN
  IF NOT public.is_site_admin() THEN
    RAISE EXCEPTION 'admin required';
  END IF;

  IF length(v_code) < 3 OR length(v_code) > 24 OR v_code !~ '^[A-Z0-9_-]+$' THEN
    RAISE EXCEPTION 'Kode voucher harus 3-24 karakter alfanumerik (A-Z, 0-9, -, _).';
  END IF;

  IF length(v_title) < 2 OR length(v_title) > 100 THEN
    RAISE EXCEPTION 'Judul voucher harus 2-100 karakter.';
  END IF;

  IF p_discount_type NOT IN ('fixed', 'percentage') THEN
    RAISE EXCEPTION 'Tipe diskon harus fixed atau percentage.';
  END IF;

  IF p_discount_value <= 0 THEN
    RAISE EXCEPTION 'Nilai diskon harus lebih besar dari 0.';
  END IF;

  IF p_discount_type = 'percentage' AND p_discount_value > 100 THEN
    RAISE EXCEPTION 'Diskon persentase maksimal 100 persen.';
  END IF;

  INSERT INTO public.vouchers (
    code, title, discount_type, discount_value,
    max_discount_idr, max_uses, expires_at, is_active, package_ids, updated_at
  )
  VALUES (
    v_code, v_title, p_discount_type, p_discount_value,
    p_max_discount_idr, p_max_uses, p_expires_at, COALESCE(p_is_active, true), p_package_ids, clock_timestamp()
  )
  ON CONFLICT ((upper(btrim(code)))) DO UPDATE SET
    title = excluded.title,
    discount_type = excluded.discount_type,
    discount_value = excluded.discount_value,
    max_discount_idr = excluded.max_discount_idr,
    max_uses = excluded.max_uses,
    expires_at = excluded.expires_at,
    is_active = excluded.is_active,
    package_ids = excluded.package_ids,
    updated_at = clock_timestamp()
  RETURNING id INTO v_id;

  INSERT INTO public.admin_audit (actor_id, action, details)
  VALUES (
    auth.uid(),
    'voucher.upserted',
    jsonb_build_object(
      'voucher_id', v_id,
      'code', v_code,
      'title', v_title,
      'discount_type', p_discount_type,
      'discount_value', p_discount_value
    )
  );

  RETURN public.admin_list_vouchers();
END $$;

REVOKE ALL ON FUNCTION public.admin_upsert_voucher(text, text, text, bigint, bigint, integer, timestamptz, boolean, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_voucher(text, text, text, bigint, bigint, integer, timestamptz, boolean, text[]) TO authenticated;

-- Admin: toggle voucher active status
CREATE OR REPLACE FUNCTION public.admin_toggle_voucher(p_id uuid, p_active boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_site_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
  UPDATE public.vouchers SET is_active = p_active, updated_at = clock_timestamp() WHERE id = p_id;
  INSERT INTO public.admin_audit (actor_id, action, details)
  VALUES (auth.uid(), 'voucher.toggled', jsonb_build_object('voucher_id', p_id, 'is_active', p_active));
  RETURN public.admin_list_vouchers();
END $$;

REVOKE ALL ON FUNCTION public.admin_toggle_voucher(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_toggle_voucher(uuid, boolean) TO authenticated;

-- Admin: delete voucher
CREATE OR REPLACE FUNCTION public.admin_delete_voucher(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_site_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
  DELETE FROM public.vouchers WHERE id = p_id;
  INSERT INTO public.admin_audit (actor_id, action, details)
  VALUES (auth.uid(), 'voucher.deleted', jsonb_build_object('voucher_id', p_id));
  RETURN public.admin_list_vouchers();
END $$;

REVOKE ALL ON FUNCTION public.admin_delete_voucher(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_voucher(uuid) TO authenticated;

-- Admin: quick package price update
CREATE OR REPLACE FUNCTION public.admin_quick_update_price(
  p_package_id text,
  p_price_idr bigint,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_version bigint;
BEGIN
  IF NOT public.is_site_admin() THEN RAISE EXCEPTION 'admin required'; END IF;
  IF p_price_idr < 10000 OR p_price_idr > 100000000 THEN RAISE EXCEPTION 'Harga tidak valid (min 10.000, maks 100.000.000)'; END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) < 1 THEN RAISE EXCEPTION 'Alasan wajib diisi'; END IF;

  SELECT version INTO v_version FROM public.tier_price_current WHERE package_id = p_package_id;
  IF v_version IS NULL THEN
    v_version := 1;
  END IF;

  RETURN public.admin_update_tier_price(
    p_package_id,
    v_version::text,
    jsonb_build_object('amount_idr', p_price_idr::text, 'promo', null),
    p_reason,
    true
  );
END $$;

REVOKE ALL ON FUNCTION public.admin_quick_update_price(text, bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_quick_update_price(text, bigint, text) TO authenticated;

-- Apply voucher to order and reserve usage atomically
CREATE OR REPLACE FUNCTION public.apply_voucher_to_order(
  p_invoice text,
  p_code text,
  p_workspace_id uuid,
  p_package_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_validation jsonb;
  v_discount bigint;
  v_final bigint;
  v_code text := upper(btrim(COALESCE(p_code, '')));
BEGIN
  v_validation := public.validate_voucher(v_code, p_package_id, p_workspace_id);
  IF (v_validation->>'valid')::boolean IS NOT TRUE THEN
    RETURN v_validation;
  END IF;

  v_discount := (v_validation->>'discount_amount_idr')::bigint;
  v_final := (v_validation->>'final_price_idr')::bigint;

  -- Update order in doku_orders if amount matches or needs discount update
  UPDATE public.doku_orders
  SET amount_idr = v_final
  WHERE invoice = p_invoice AND workspace_id = p_workspace_id;

  -- Record usage
  INSERT INTO public.voucher_usages (voucher_id, workspace_id, user_id, invoice, discount_amount_idr)
  SELECT id, p_workspace_id, auth.uid(), p_invoice, v_discount
  FROM public.vouchers WHERE upper(btrim(code)) = v_code;

  -- Increment used_count
  UPDATE public.vouchers
  SET used_count = used_count + 1, updated_at = clock_timestamp()
  WHERE upper(btrim(code)) = v_code;

  RETURN v_validation;
END $$;

REVOKE ALL ON FUNCTION public.apply_voucher_to_order(text, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_voucher_to_order(text, text, uuid, text) TO authenticated;

-- Seed initial popular vouchers if table is empty
INSERT INTO public.vouchers (code, title, discount_type, discount_value, max_uses, is_active)
VALUES 
  ('NIKAHHEMAT', 'Promo Spesial Pasangan Baru', 'fixed', 20000, 50, true),
  ('EVERRAEVIP', 'Diskon Spesial 25% Wedding Pro', 'percentage', 25, 30, true)
ON CONFLICT ((upper(btrim(code)))) DO NOTHING;

COMMIT;
