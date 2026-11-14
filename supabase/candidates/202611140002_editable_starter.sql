-- NEW CANDIDATE ONLY. Not installed, not historical migration replay.
-- Requires public workspaces/workspace_members/budgets/tasks from reviewed schema.
BEGIN;
CREATE SCHEMA editable_starter_private;
REVOKE ALL ON SCHEMA editable_starter_private FROM PUBLIC, anon, authenticated;
CREATE TABLE editable_starter_private.receipts (
 workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
 applied_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 applied_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE editable_starter_private.receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON editable_starter_private.receipts FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.apply_editable_starter_v1(p_workspace_id uuid, p_confirmation text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE uid uuid := auth.uid();
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_confirmation IS DISTINCT FROM 'TAMBAH TEMPLATE' THEN RAISE EXCEPTION 'confirmation required' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=uid AND role='owner' FOR UPDATE) THEN
  RAISE EXCEPTION 'owner required' USING ERRCODE='42501';
 END IF;
 IF EXISTS(SELECT 1 FROM editable_starter_private.receipts WHERE workspace_id=p_workspace_id) THEN
  RETURN jsonb_build_object('already_applied',true);
 END IF;
 INSERT INTO public.budgets(workspace_id,category,title,allocated_amount,spent_amount,payment_status,notes)
 SELECT p_workspace_id,category,category,0,0,'unpaid','Template awal; isi alokasi sesuai kesepakatan dan penawaran nyata. Belum ada pengeluaran.'
 FROM (VALUES ('Katering'),('Venue'),('Dekorasi'),('MUA & Busana'),('Dokumentasi'),('Undangan & Souvenir'),('Mahar & Seserahan'),('Dana Darurat')) v(category);
 INSERT INTO public.tasks(workspace_id,title,phase,pic,is_completed,due_date,notes)
 SELECT p_workspace_id,title,phase,'both',false,NULL,'Template awal; sesuaikan tahap dan kebutuhan bersama pasangan. Tidak menetapkan tanggal atau persyaratan resmi.'
 FROM (VALUES
 ('Sepakati prioritas dan batas anggaran','H-6 Bulan'),
 ('Susun kebutuhan dan kapasitas acara','H-6 Bulan'),
 ('Periksa persyaratan pencatatan pada instansi resmi','Dokumen KUA'),
 ('Bandingkan penawaran dan kontrak vendor','H-3 Bulan'),
 ('Susun daftar tamu nyata bersama keluarga','H-3 Bulan'),
 ('Siapkan undangan dan kebutuhan acara','H-1 Bulan'),
 ('Susun rundown dan pembagian PIC','H-1 Bulan'),
 ('Konfirmasi kesiapan keluarga dan vendor','H-1 Minggu')) v(title,phase);
 INSERT INTO editable_starter_private.receipts(workspace_id,applied_by) VALUES(p_workspace_id,uid);
 RETURN jsonb_build_object('already_applied',false);
END $$;
REVOKE ALL ON FUNCTION public.apply_editable_starter_v1(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.apply_editable_starter_v1(uuid,text) TO authenticated;
COMMIT;
