
-- 1) Responsible employee on assets
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS responsible_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.vehicles   ADD COLUMN IF NOT EXISTS responsible_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.lands      ADD COLUMN IF NOT EXISTS responsible_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;
ALTER TABLE public.units      ADD COLUMN IF NOT EXISTS responsible_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- 2) Employee link on transactions (for salaries) + ensure entity_type/entity_id exist
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- 3) Expenses: add asset linkage (previously only property_id)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS entity_id uuid;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- 4) Maintenance: employee link (assignee)
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- 5) Employee assets (assignments)
CREATE TABLE IF NOT EXISTS public.employee_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  asset_type text NOT NULL, -- 'property' | 'unit' | 'vehicle' | 'land'
  asset_id uuid NOT NULL,
  role text, -- e.g. 'مسؤول عقار', 'سائق', 'مسؤول مركبة', ...
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_assets TO authenticated;
GRANT ALL ON public.employee_assets TO service_role;

ALTER TABLE public.employee_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read employee_assets" ON public.employee_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth ins employee_assets"  ON public.employee_assets FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth upd employee_assets"  ON public.employee_assets FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin del employee_assets" ON public.employee_assets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_employee_assets_employee ON public.employee_assets(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_assets_asset ON public.employee_assets(asset_type, asset_id);

CREATE TRIGGER trg_employee_assets_updated_at BEFORE UPDATE ON public.employee_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6) Helper indexes for asset linkage
CREATE INDEX IF NOT EXISTS idx_transactions_entity ON public.transactions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_transactions_employee ON public.transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_expenses_entity ON public.expenses(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_entity ON public.maintenance_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_employee ON public.maintenance_requests(employee_id);
