
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.maintenance_requests
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID;

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, brand TEXT, model TEXT, year INT,
  plate_number TEXT, chassis_number TEXT, vehicle_type TEXT,
  driver_name TEXT, driver_phone TEXT,
  purchase_value NUMERIC, current_value NUMERIC, purchase_date DATE,
  insurance_company TEXT, insurance_expiry DATE, license_expiry DATE,
  status TEXT NOT NULL DEFAULT 'نشط', notes TEXT, photos TEXT[],
  archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth ins vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth upd vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin del vehicles" ON public.vehicles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE IF NOT EXISTS public.lands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, location TEXT, city TEXT, region TEXT,
  area_sqm NUMERIC, deed_number TEXT, ownership_type TEXT,
  purchase_value NUMERIC, current_value NUMERIC, purchase_date DATE,
  status TEXT NOT NULL DEFAULT 'متاحة', coordinates TEXT, notes TEXT, photos TEXT[],
  archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lands TO authenticated;
GRANT ALL ON public.lands TO service_role;
ALTER TABLE public.lands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read lands" ON public.lands FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth ins lands" ON public.lands FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth upd lands" ON public.lands FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin del lands" ON public.lands FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read dept" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth ins dept" ON public.departments FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth upd dept" ON public.departments FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin del dept" ON public.departments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'hr'));

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL, national_id TEXT, phone TEXT, email TEXT,
  position TEXT, department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  hire_date DATE, basic_salary NUMERIC,
  status TEXT NOT NULL DEFAULT 'نشط', address TEXT, notes TEXT, photo_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read emp" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth ins emp" ON public.employees FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth upd emp" ON public.employees FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin del emp" ON public.employees FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'hr'));

CREATE TABLE IF NOT EXISTS public.employment_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL, end_date DATE, contract_type TEXT,
  monthly_salary NUMERIC NOT NULL, allowances NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'نشط', notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employment_contracts TO authenticated;
GRANT ALL ON public.employment_contracts TO service_role;
ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read empc" ON public.employment_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth ins empc" ON public.employment_contracts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth upd empc" ON public.employment_contracts FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin del empc" ON public.employment_contracts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'hr'));

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL, check_in TIME, check_out TIME,
  status TEXT NOT NULL DEFAULT 'حاضر', notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read att" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth ins att" ON public.attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth upd att" ON public.attendance FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin del att" ON public.attendance FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'hr'));

CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'معلقة', reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leaves TO authenticated;
GRANT ALL ON public.leaves TO service_role;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read lv" ON public.leaves FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth ins lv" ON public.leaves FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth upd lv" ON public.leaves FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin del lv" ON public.leaves FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'hr'));

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT,
  status TEXT NOT NULL DEFAULT 'مفتوحة',
  priority TEXT NOT NULL DEFAULT 'متوسطة',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE, entity_type TEXT, entity_id UUID,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth ins tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth upd tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "creator or admin del tasks" ON public.tasks FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT, body TEXT NOT NULL, read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own read msg" ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "own send msg" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "own upd msg" ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "own del msg" ON public.messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read cm" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth ins cm" ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "own upd cm" ON public.comments FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "own del cm" ON public.comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, account_type TEXT NOT NULL DEFAULT 'نقدي',
  bank_name TEXT, account_number TEXT,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR', notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read acc" ON public.accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "acct ins acc" ON public.accounts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "acct upd acc" ON public.accounts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "admin del acc" ON public.accounts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  txn_type TEXT NOT NULL, category TEXT,
  amount NUMERIC NOT NULL, txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT, entity_type TEXT, entity_id UUID,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read txn" ON public.transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "acct ins txn" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "acct upd txn" ON public.transactions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "admin del txn" ON public.transactions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, table_name TEXT NOT NULL, record_id UUID,
  old_data JSONB, new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "sys ins audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name TEXT DEFAULT 'إدارة الأملاك',
  company_logo_url TEXT, default_currency TEXT DEFAULT 'SAR',
  primary_color TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.system_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
GRANT SELECT, UPDATE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read settings" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin upd settings" ON public.system_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE TABLE IF NOT EXISTS public.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, field_key TEXT NOT NULL, label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', options JSONB,
  required BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, field_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_fields TO authenticated;
GRANT ALL ON public.custom_fields TO service_role;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read cf" ON public.custom_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "sa write cf" ON public.custom_fields FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.module_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL, role public.app_role NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(module_key, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_visibility TO authenticated;
GRANT ALL ON public.module_visibility TO service_role;
ALTER TABLE public.module_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read mv" ON public.module_visibility FOR SELECT TO authenticated USING (true);
CREATE POLICY "sa write mv" ON public.module_visibility FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TABLE IF NOT EXISTS public.quick_access_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL, label TEXT NOT NULL, icon TEXT,
  link TEXT NOT NULL, display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quick_access_items TO authenticated;
GRANT ALL ON public.quick_access_items TO service_role;
ALTER TABLE public.quick_access_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own qa all" ON public.quick_access_items FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['vehicles','lands','departments','employees','employment_contracts','leaves','tasks','accounts','transactions']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%I ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER set_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  INSERT INTO public.audit_logs(user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME,
    CASE WHEN TG_OP='DELETE' THEN (OLD).id ELSE (NEW).id END,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END $fn$;

DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['properties','units','tenants','contracts','payments','vehicles','lands','employees','employment_contracts','transactions','accounts']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit()', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.dashboard_totals()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT jsonb_build_object(
    'properties_count', (SELECT count(*) FROM public.properties),
    'units_count', (SELECT count(*) FROM public.units),
    'vehicles_count', (SELECT count(*) FROM public.vehicles WHERE NOT archived),
    'lands_count', (SELECT count(*) FROM public.lands WHERE NOT archived),
    'tenants_count', (SELECT count(*) FROM public.tenants),
    'active_contracts', (SELECT count(*) FROM public.contracts WHERE status::text = 'نشط'),
    'expired_contracts', (SELECT count(*) FROM public.contracts WHERE status::text = 'منتهي'),
    'employees_count', (SELECT count(*) FROM public.employees WHERE NOT archived),
    'open_tasks', (SELECT count(*) FROM public.tasks WHERE status != 'منجزة'),
    'revenue_total', COALESCE((SELECT sum(amount) FROM public.transactions WHERE txn_type='إيراد'),0),
    'expense_total', COALESCE((SELECT sum(amount) FROM public.transactions WHERE txn_type='مصروف'),0),
    'assets_value', COALESCE((SELECT sum(current_value) FROM public.vehicles),0) + COALESCE((SELECT sum(current_value) FROM public.lands),0)
  )
$fn$;
