-- Additive only: no payment enforcement, no automatic backfill of existing workspaces.
BEGIN;
CREATE SCHEMA IF NOT EXISTS starter_private;
REVOKE ALL ON SCHEMA starter_private FROM PUBLIC,anon,authenticated;
CREATE TABLE starter_private.requests(request_id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES auth.users(id), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE);
CREATE TABLE starter_private.applied(workspace_id uuid PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE, applied_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON ALL TABLES IN SCHEMA starter_private FROM PUBLIC,anon,authenticated;
ALTER TABLE starter_private.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE starter_private.applied ENABLE ROW LEVEL SECURITY; -- No policies: deny non-owner roles even with accidental grants.

CREATE FUNCTION public.use_starter_template(p_workspace_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); target bigint; used bigint:=0; amount bigint; item record;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 SELECT target_budget INTO target FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=uid AND role='owner' FOR UPDATE) THEN RAISE EXCEPTION 'owner required' USING ERRCODE='42501'; END IF;
 -- Durable receipt survives reset: retries never recreate deleted examples.
 IF EXISTS(SELECT 1 FROM starter_private.applied WHERE workspace_id=p_workspace_id) THEN RETURN p_workspace_id; END IF;
 IF EXISTS(SELECT 1 FROM public.budgets WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.tasks WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.guests WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.savings_contributions WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.savings_accounts WHERE workspace_id=p_workspace_id) THEN RAISE EXCEPTION 'empty workspace required'; END IF;
 IF target IS NULL OR target<0 OR target>9007199254740991 THEN RAISE EXCEPTION 'invalid target'; END IF;
 FOR item IN SELECT * FROM (VALUES (1,'Katering',40),(2,'Venue',15),(3,'Dekorasi',10),(4,'MUA & Busana',10),(5,'Dokumentasi',8),(6,'Undangan & Souvenir',5),(7,'Mahar & Seserahan',5),(8,'Dana Darurat',7)) AS v(ord,category,pct) ORDER BY ord LOOP
  -- Integer Rupiah, final reserve absorbs floor rounding. Sum always equals user's target.
  amount:=CASE WHEN item.ord=8 THEN target-used ELSE floor(target::numeric*item.pct/100)::bigint END;
  used:=used+amount;
  INSERT INTO public.budgets(workspace_id,category,title,allocated_amount,spent_amount,payment_status,notes)
  VALUES(p_workspace_id,item.category,'[CONTOH FIKTIF] '||item.category,amount,0,'unpaid','Estimasi ilustratif proporsional dari target Anda, bukan penawaran/harga pasar. Belum ada pembayaran. Ubah sesuai kebutuhan dan penawaran vendor; target tidak diubah.');
 END LOOP;
 INSERT INTO public.tasks(workspace_id,title,phase,pic,is_completed,notes)
 SELECT p_workspace_id,'[CONTOH FIKTIF] '||v.title,v.phase,'both',false,'Rekomendasi umum yang dapat diedit; belum dilakukan. Sesuaikan dengan tanggal, adat, agama dan ketentuan resmi setempat; bukan kepastian jadwal atau persyaratan.' FROM (VALUES
 ('Sepakati prioritas, jumlah tamu dan batas anggaran','H-6 Bulan'),
 ('Bandingkan venue, kapasitas dan aksesibilitas','H-6 Bulan'),
 ('Minta rincian katering, pajak dan biaya tambahan','H-6 Bulan'),
 ('Hitung kebutuhan tabungan bulanan dari sisa target dan bulan tersisa; sepakati kontribusi tanpa mencatat transfer fiktif','H-6 Bulan'),
 ('Konfirmasi persyaratan dan jadwal pencatatan nikah pada instansi resmi','Dokumen KUA'),
 ('Siapkan dokumen identitas sesuai persyaratan resmi terbaru','Dokumen KUA'),
 ('Konsultasikan persyaratan kesehatan pada fasilitas resmi','Dokumen KUA'),
 ('Bandingkan dekorasi dan kebutuhan listrik','H-3 Bulan'),
 ('Pilih MUA, busana dan jadwal fitting','H-3 Bulan'),
 ('Sepakati dokumentasi dan hak penggunaan foto','H-3 Bulan'),
 ('Tinjau kontrak, jadwal DP, pelunasan dan pembatalan','H-3 Bulan'),
 ('Buat daftar tamu nyata dan verifikasi kontak sebelum mengundang','H-3 Bulan'),
 ('Siapkan undangan, souvenir, mahar dan seserahan sesuai kesepakatan','H-1 Bulan'),
 ('Susun rundown, PIC, transportasi dan kebutuhan konsumsi','H-1 Bulan'),
 ('Periksa dana darurat; pisahkan alokasi dari pengeluaran aktual','H-1 Bulan'),
 ('Konfirmasi vendor dan RSVP; jangan anggap contoh sebagai kehadiran','H-1 Minggu'),
 ('Briefing keluarga dan vendor; siapkan rencana cuaca darurat','H-1 Minggu'),
 ('Periksa dokumen dan jalankan rundown; catat hanya pembayaran nyata','Hari H')
 ) AS v(title,phase);
 INSERT INTO public.guests(workspace_id,name,category,pax,phone,rsvp_status,notes)
 SELECT p_workspace_id,'[CONTOH FIKTIF] '||v.name,v.category,1,NULL,'uncontacted','Placeholder ilustratif, bukan tamu nyata. Belum dihubungi/RSVP belum dikonfirmasi. Ganti/hapus sebelum mengirim undangan.' FROM (VALUES ('Tamu keluarga pria','keluarga_pria'),('Tamu keluarga wanita','keluarga_wanita'),('Tamu sahabat','sahabat')) AS v(name,category);
 INSERT INTO starter_private.applied(workspace_id) VALUES(p_workspace_id);
 RETURN p_workspace_id;
END $$;

CREATE FUNCTION public.create_starter_workspace(p_request_id uuid,p_groom_name text,p_bride_name text,p_wedding_date date,p_target_budget bigint,p_target_savings bigint)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); ws uuid; prior starter_private.requests%ROWTYPE;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL THEN RAISE EXCEPTION 'request required'; END IF;
 -- Same logical request serialized before workspace creation, including network retries.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_request_id::text,0));
 SELECT * INTO prior FROM starter_private.requests WHERE request_id=p_request_id;
 IF FOUND THEN
  IF prior.owner_id<>uid THEN RAISE EXCEPTION 'request belongs to another owner' USING ERRCODE='42501'; END IF;
  RETURN prior.workspace_id;
 END IF;
 IF p_groom_name IS NULL OR length(btrim(p_groom_name)) NOT BETWEEN 1 AND 100 OR p_bride_name IS NULL OR length(btrim(p_bride_name)) NOT BETWEEN 1 AND 100 OR p_wedding_date IS NULL OR p_target_budget IS NULL OR p_target_savings IS NULL OR p_target_budget NOT BETWEEN 0 AND 9007199254740991 OR p_target_savings NOT BETWEEN 0 AND 9007199254740991 THEN RAISE EXCEPTION 'invalid workspace'; END IF;
 ws:=public.create_workspace('Pernikahan '||btrim(p_groom_name)||' & '||btrim(p_bride_name),p_wedding_date);
 UPDATE public.workspaces SET groom_name=p_groom_name,bride_name=p_bride_name,target_budget=p_target_budget,target_savings=p_target_savings WHERE id=ws;
 PERFORM public.use_starter_template(ws);
 INSERT INTO starter_private.requests VALUES(p_request_id,uid,ws);
 RETURN ws;
END $$;
REVOKE ALL ON FUNCTION public.use_starter_template(uuid), public.create_starter_workspace(uuid,text,text,date,bigint,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.use_starter_template(uuid), public.create_starter_workspace(uuid,text,text,date,bigint,bigint) TO authenticated;
CREATE OR REPLACE FUNCTION public.reset_planning_content(p_workspace_id uuid, p_confirmation text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); b bigint; t bigint; g bigint; s bigint; counts jsonb;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_confirmation IS DISTINCT FROM 'RESET RENCANA' THEN RAISE EXCEPTION 'confirmation required' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=uid AND role='owner' FOR UPDATE) THEN
  RAISE EXCEPTION 'owner required' USING ERRCODE='42501';
 END IF;
 INSERT INTO starter_private.applied(workspace_id) VALUES(p_workspace_id) ON CONFLICT DO NOTHING;
 -- Only these four tables. Do not cascade-delete workspace, identity, legacy
 -- savings accounts, invitations, purchase references, entitlements or audit.
 DELETE FROM public.budgets WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS b=ROW_COUNT;
 DELETE FROM public.tasks WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS t=ROW_COUNT;
 DELETE FROM public.guests WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS g=ROW_COUNT;
 DELETE FROM public.savings_contributions WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS s=ROW_COUNT;
 counts:=jsonb_build_object('budgets',b,'tasks',t,'guests',g,'savings_contributions',s);
 INSERT INTO public.admin_audit(actor_id,action,subject_id,details)
 VALUES(uid,'planning.reset',p_workspace_id,jsonb_build_object('deleted',counts));
 RETURN counts;
END $$;

COMMIT;
