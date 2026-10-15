-- Manual bookkeeping only; no budget writes, transfers or entitlement changes.
BEGIN;
CREATE TABLE public.vendors (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 200),
 contact_name text NOT NULL DEFAULT '' CHECK(length(contact_name)<=200),
 contact_phone text NOT NULL DEFAULT '' CHECK(length(contact_phone)<=100),
 contract_notes text NOT NULL DEFAULT '' CHECK(length(contract_notes)<=4000),
 contract_total bigint NOT NULL DEFAULT 0 CHECK(contract_total BETWEEN 0 AND 9007199254740991),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(workspace_id,id)
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vendors FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.vendors TO authenticated;
CREATE POLICY member_crud ON public.vendors FOR ALL TO authenticated USING(public.is_workspace_member(workspace_id)) WITH CHECK(public.is_workspace_member(workspace_id));
-- Prevent tenant reassignment even by a member of both workspaces.
CREATE FUNCTION public.vendor_immutable_scope() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.workspace_id IS DISTINCT FROM OLD.workspace_id OR NEW.id IS DISTINCT FROM OLD.id THEN RAISE EXCEPTION 'immutable scope'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.vendor_immutable_scope() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER immutable_scope BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.vendor_immutable_scope();
CREATE TABLE public.vendor_installments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 vendor_id uuid NOT NULL, title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 amount bigint NOT NULL CHECK(amount BETWEEN 1 AND 9007199254740991),
 due_date date NOT NULL CHECK(due_date BETWEEN '1900-01-01' AND '9999-12-31'),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,vendor_id) REFERENCES public.vendors(workspace_id,id) ON DELETE CASCADE
);
CREATE TABLE public.vendor_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
 installment_id uuid NOT NULL,
 amount bigint NOT NULL CHECK(amount BETWEEN 1 AND 9007199254740991),
 paid_on date NOT NULL CHECK(paid_on BETWEEN '1900-01-01' AND '9999-12-31'),
 notes text NOT NULL DEFAULT '' CHECK(length(notes)<=4000), created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(workspace_id,installment_id) REFERENCES public.vendor_installments(workspace_id,id) ON DELETE CASCADE
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['vendor_installments','vendor_payments'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',t);
 EXECUTE format('CREATE POLICY member_crud ON public.%I FOR ALL TO authenticated USING(public.is_workspace_member(workspace_id)) WITH CHECK(public.is_workspace_member(workspace_id))',t);
 EXECUTE format('CREATE TRIGGER immutable_scope BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.vendor_immutable_scope()',t);
 END LOOP;
END $$;
CREATE INDEX ON public.vendors(workspace_id);
CREATE INDEX ON public.vendor_installments(workspace_id,vendor_id);
CREATE INDEX ON public.vendor_payments(workspace_id,installment_id);
CREATE OR REPLACE FUNCTION public.reset_planning_content(p_workspace_id uuid, p_confirmation text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); b bigint; t bigint; g bigint; s bigint; counts jsonb; v bigint; i bigint; p bigint;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 IF p_confirmation IS DISTINCT FROM 'RESET RENCANA' THEN RAISE EXCEPTION 'confirmation required' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=uid AND role='owner' FOR UPDATE) THEN
  RAISE EXCEPTION 'owner required' USING ERRCODE='42501';
 END IF;
 INSERT INTO starter_private.applied(workspace_id) VALUES(p_workspace_id) ON CONFLICT DO NOTHING;
 -- Explicit planning-only scope. Do not cascade-delete workspace, identity, legacy
 -- savings accounts, invitations, purchase references, entitlements or audit.
 DELETE FROM public.vendor_payments WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS p=ROW_COUNT;
 DELETE FROM public.vendor_installments WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS i=ROW_COUNT;
 DELETE FROM public.vendors WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS v=ROW_COUNT;
 DELETE FROM public.budgets WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS b=ROW_COUNT;
 DELETE FROM public.tasks WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS t=ROW_COUNT;
 DELETE FROM public.guests WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS g=ROW_COUNT;
 DELETE FROM public.savings_contributions WHERE workspace_id=p_workspace_id; GET DIAGNOSTICS s=ROW_COUNT;
 counts:=jsonb_build_object('vendors',v,'vendor_installments',i,'vendor_payments',p,'budgets',b,'tasks',t,'guests',g,'savings_contributions',s);
 INSERT INTO public.admin_audit(actor_id,action,subject_id,details)
 VALUES(uid,'planning.reset',p_workspace_id,jsonb_build_object('deleted',counts));
 RETURN counts;
END $$;

-- Existing-workspace opt-in must remain empty across all planning tables.
CREATE OR REPLACE FUNCTION public.use_starter_template(p_workspace_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); target bigint; used bigint:=0; amount bigint; item record;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'authentication required' USING ERRCODE='42501'; END IF;
 SELECT target_budget INTO target FROM public.workspaces WHERE id=p_workspace_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.workspace_members WHERE workspace_id=p_workspace_id AND user_id=uid AND role='owner' FOR UPDATE) THEN RAISE EXCEPTION 'owner required' USING ERRCODE='42501'; END IF;
 -- Durable receipt survives reset: retries never recreate deleted examples.
 IF EXISTS(SELECT 1 FROM starter_private.applied WHERE workspace_id=p_workspace_id) THEN RETURN p_workspace_id; END IF;
 IF EXISTS(SELECT 1 FROM public.budgets WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.tasks WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.guests WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.savings_contributions WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.savings_accounts WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.vendors WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.vendor_installments WHERE workspace_id=p_workspace_id) OR EXISTS(SELECT 1 FROM public.vendor_payments WHERE workspace_id=p_workspace_id) THEN RAISE EXCEPTION 'empty workspace required'; END IF;
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

COMMIT;
