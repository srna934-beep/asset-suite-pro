
UPDATE public.tenants SET national_id = NULL WHERE national_id IN ('بدون','لا يوجد','-','—','');
UPDATE public.employees SET national_id = NULL WHERE national_id IN ('بدون','لا يوجد','-','—','');

CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  period text NOT NULL DEFAULT 'شهرية',
  start_date date NOT NULL,
  end_date date NOT NULL,
  scope text NOT NULL DEFAULT 'system',
  entity_id uuid,
  planned_income numeric(14,2) NOT NULL DEFAULT 0,
  planned_expense numeric(14,2) NOT NULL DEFAULT 0,
  responsible_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'مسودة',
  notes text,
  archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read budgets" ON public.budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "mgr ins budgets" ON public.budgets FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "mgr upd budgets" ON public.budgets FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "admin del budgets" ON public.budgets FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER set_updated_at_budgets BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category text NOT NULL,
  kind text NOT NULL DEFAULT 'expense',
  planned_amount numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_items TO authenticated;
GRANT ALL ON public.budget_items TO service_role;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read bi" ON public.budget_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "mgr all bi" ON public.budget_items FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant'));

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text,
  name text NOT NULL,
  project_type text,
  description text,
  responsible_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'مخطط',
  priority text NOT NULL DEFAULT 'متوسطة',
  planned_budget numeric(14,2) NOT NULL DEFAULT 0,
  planned_income numeric(14,2) NOT NULL DEFAULT 0,
  progress_pct numeric(5,2) NOT NULL DEFAULT 0,
  notes text,
  archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "mgr ins projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'manager'));
CREATE POLICY "mgr upd projects" ON public.projects FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'manager'));
CREATE POLICY "admin del projects" ON public.projects FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE UNIQUE INDEX projects_code_unique ON public.projects(code) WHERE code IS NOT NULL AND NOT archived;

CREATE TABLE public.project_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, entity_type, entity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_assets TO authenticated;
GRANT ALL ON public.project_assets TO service_role;
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read pa" ON public.project_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "mgr all pa" ON public.project_assets FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'manager')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'manager'));

CREATE TABLE public.project_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  role_in_project text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, employee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_employees TO authenticated;
GRANT ALL ON public.project_employees TO service_role;
ALTER TABLE public.project_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read pe" ON public.project_employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "mgr all pe" ON public.project_employees FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'manager')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'manager'));

CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  goal_type text NOT NULL DEFAULT 'مالي',
  scope text NOT NULL DEFAULT 'system',
  entity_id uuid,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  responsible_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  target_value numeric(14,2) NOT NULL DEFAULT 0,
  current_value numeric(14,2) NOT NULL DEFAULT 0,
  measure text,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'نشط',
  priority text NOT NULL DEFAULT 'متوسطة',
  notes text,
  archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read goals" ON public.goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "mgr ins goals" ON public.goals FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'manager'));
CREATE POLICY "mgr upd goals" ON public.goals FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'manager'));
CREATE POLICY "admin del goals" ON public.goals FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));
CREATE TRIGGER set_updated_at_goals BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.goal_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  value numeric(14,2) NOT NULL,
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_updates TO authenticated;
GRANT ALL ON public.goal_updates TO service_role;
ALTER TABLE public.goal_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read gu" ON public.goal_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "mgr all gu" ON public.goal_updates FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'manager')) WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'manager'));

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS budget_id  uuid REFERENCES public.budgets(id)  ON DELETE SET NULL;
ALTER TABLE public.expenses     ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.expenses     ADD COLUMN IF NOT EXISTS budget_id  uuid REFERENCES public.budgets(id)  ON DELETE SET NULL;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS budget_id  uuid REFERENCES public.budgets(id)  ON DELETE SET NULL;
ALTER TABLE public.payments  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.tasks     ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.tasks     ADD COLUMN IF NOT EXISTS goal_id    uuid REFERENCES public.goals(id)    ON DELETE SET NULL;
ALTER TABLE public.employment_contracts ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_txn_project     ON public.transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_txn_budget      ON public.transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_exp_project     ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_exp_budget      ON public.expenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_maint_project   ON public.maintenance_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_pay_project     ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project   ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_goal      ON public.tasks(goal_id);

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_plate_unique   ON public.vehicles(plate_number)    WHERE plate_number IS NOT NULL AND NOT archived;
CREATE UNIQUE INDEX IF NOT EXISTS employees_natid_unique  ON public.employees(national_id)    WHERE national_id IS NOT NULL AND NOT archived;
CREATE UNIQUE INDEX IF NOT EXISTS tenants_natid_unique    ON public.tenants(national_id)      WHERE national_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS properties_name_unique  ON public.properties(name);
CREATE UNIQUE INDEX IF NOT EXISTS units_prop_number_unique ON public.units(property_id, unit_number);
