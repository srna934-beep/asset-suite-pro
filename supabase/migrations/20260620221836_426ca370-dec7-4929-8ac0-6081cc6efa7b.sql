
-- Enums
CREATE TYPE public.property_type AS ENUM ('عمارة','فيلا','مجمع','أرض','محل','مكتب');
CREATE TYPE public.property_status AS ENUM ('مؤجر','خاصة','متاح');
CREATE TYPE public.unit_type AS ENUM ('شقة','محل','مكتب','مستودع','استوديو');
CREATE TYPE public.unit_status AS ENUM ('مؤجرة','فارغة','صيانة');
CREATE TYPE public.contract_status AS ENUM ('نشط','منتهي','ملغي');
CREATE TYPE public.payment_status AS ENUM ('مدفوع','متأخر','غير مدفوع');
CREATE TYPE public.maintenance_status AS ENUM ('جديد','قيد التنفيذ','مكتمل','ملغي');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- 1) Properties
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type public.property_type NOT NULL DEFAULT 'عمارة',
  location TEXT,
  address TEXT,
  status public.property_status NOT NULL DEFAULT 'متاح',
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO anon, authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access properties" ON public.properties FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Tenants
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  national_id TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  id_document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO anon, authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access tenants" ON public.tenants FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Units
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  type public.unit_type NOT NULL DEFAULT 'شقة',
  rent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.unit_status NOT NULL DEFAULT 'فارغة',
  area_sqm NUMERIC(10,2),
  bedrooms INT,
  bathrooms INT,
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_units_property ON public.units(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO anon, authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access units" ON public.units FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_units_updated BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent NUMERIC(12,2) NOT NULL,
  deposit NUMERIC(12,2) DEFAULT 0,
  status public.contract_status NOT NULL DEFAULT 'نشط',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contracts_unit ON public.contracts(unit_id);
CREATE INDEX idx_contracts_tenant ON public.contracts(tenant_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO anon, authenticated;
GRANT ALL ON public.contracts TO service_role;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access contracts" ON public.contracts FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_contracts_updated BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  paid_date DATE,
  amount NUMERIC(12,2) NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'غير مدفوع',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_contract ON public.payments(contract_id);
CREATE INDEX idx_payments_due ON public.payments(due_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO anon, authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6) Maintenance
CREATE TABLE public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.maintenance_status NOT NULL DEFAULT 'جديد',
  cost NUMERIC(12,2) DEFAULT 0,
  assigned_to TEXT,
  reported_at DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_requests TO anon, authenticated;
GRANT ALL ON public.maintenance_requests TO service_role;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access maintenance" ON public.maintenance_requests FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_maint_updated BEFORE UPDATE ON public.maintenance_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7) Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO anon, authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);

-- 8) Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_expenses_property ON public.expenses(property_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO anon, authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- Auto-update overdue payments view-friendly trigger: mark unpaid past due as 'متأخر'
CREATE OR REPLACE FUNCTION public.refresh_payment_statuses() RETURNS void
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.payments
  SET status = 'متأخر'
  WHERE status = 'غير مدفوع' AND due_date < CURRENT_DATE;
END $$;
