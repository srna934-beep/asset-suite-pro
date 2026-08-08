-- 1) payroll table
CREATE TABLE public.payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  period_year integer NOT NULL,
  period_month integer NOT NULL,
  basic_salary numeric NOT NULL DEFAULT 0,
  allowances numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'مستحق',
  paid_date date,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  entity_type text,
  entity_id uuid,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, period_year, period_month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll TO authenticated;
GRANT ALL ON public.payroll TO service_role;

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payroll_select" ON public.payroll FOR SELECT TO authenticated USING (true);
CREATE POLICY "payroll_insert" ON public.payroll FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "payroll_update" ON public.payroll FOR UPDATE TO authenticated USING (true);
CREATE POLICY "payroll_delete" ON public.payroll FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'manager'));

CREATE TRIGGER set_updated_at_payroll BEFORE UPDATE ON public.payroll
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_payroll AFTER INSERT OR UPDATE OR DELETE ON public.payroll
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();

-- 2) helper: default account
CREATE OR REPLACE FUNCTION public.default_account_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.accounts WHERE NOT archived ORDER BY created_at LIMIT 1
$$;

-- 3) payment paid -> income transaction (single source, no duplicates)
CREATE OR REPLACE FUNCTION public.sync_payment_income()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE acc uuid; unit uuid;
BEGIN
  IF NEW.status = 'مدفوع' THEN
    acc := public.default_account_id();
    IF acc IS NULL THEN RETURN NEW; END IF;
    SELECT c.unit_id INTO unit FROM public.contracts c WHERE c.id = NEW.contract_id;
    IF EXISTS (SELECT 1 FROM public.transactions t WHERE t.payment_id = NEW.id) THEN
      UPDATE public.transactions
         SET amount = NEW.amount,
             txn_date = COALESCE(NEW.paid_date, CURRENT_DATE),
             project_id = NEW.project_id
       WHERE payment_id = NEW.id;
    ELSE
      INSERT INTO public.transactions
        (account_id, txn_type, category, amount, txn_date, description,
         entity_type, entity_id, payment_id, project_id)
      VALUES
        (acc, 'إيراد', 'إيجار', NEW.amount, COALESCE(NEW.paid_date, CURRENT_DATE),
         'تحصيل دفعة إيجار', 'unit', unit, NEW.id, NEW.project_id);
    END IF;
  ELSE
    DELETE FROM public.transactions WHERE payment_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_payment_income ON public.payments;
CREATE TRIGGER trg_payment_income AFTER INSERT OR UPDATE OF status, amount, paid_date, project_id
  ON public.payments FOR EACH ROW EXECUTE FUNCTION public.sync_payment_income();

-- 4) payroll paid -> expense transaction
CREATE OR REPLACE FUNCTION public.sync_payroll_expense()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE acc uuid; label text;
BEGIN
  IF NEW.status = 'مدفوع' THEN
    acc := COALESCE(NEW.account_id, public.default_account_id());
    IF acc IS NULL THEN RETURN NEW; END IF;
    label := 'راتب ' || NEW.period_month::text || '/' || NEW.period_year::text;
    IF EXISTS (SELECT 1 FROM public.transactions t WHERE t.entity_type = 'payroll' AND t.entity_id = NEW.id) THEN
      UPDATE public.transactions
         SET amount = NEW.net_amount,
             txn_date = COALESCE(NEW.paid_date, CURRENT_DATE),
             project_id = NEW.project_id,
             employee_id = NEW.employee_id,
             description = label
       WHERE entity_type = 'payroll' AND entity_id = NEW.id;
    ELSE
      INSERT INTO public.transactions
        (account_id, txn_type, category, amount, txn_date, description,
         entity_type, entity_id, employee_id, project_id)
      VALUES
        (acc, 'مصروف', 'رواتب', NEW.net_amount, COALESCE(NEW.paid_date, CURRENT_DATE),
         label, 'payroll', NEW.id, NEW.employee_id, NEW.project_id);
    END IF;
  ELSE
    DELETE FROM public.transactions WHERE entity_type = 'payroll' AND entity_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_payroll_expense ON public.payroll;
CREATE TRIGGER trg_payroll_expense AFTER INSERT OR UPDATE OF status, net_amount, paid_date, project_id, account_id
  ON public.payroll FOR EACH ROW EXECUTE FUNCTION public.sync_payroll_expense();
