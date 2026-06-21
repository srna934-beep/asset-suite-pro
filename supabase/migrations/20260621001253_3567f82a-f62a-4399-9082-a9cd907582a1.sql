
-- 1. Profiles & roles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read all auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles read own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 2. Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  -- First user becomes admin, others become 'user'
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  category TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif read own or global" ON public.notifications FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "notif update own or global" ON public.notifications FOR UPDATE TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "notif insert any auth" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notif delete own" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 4. Tighten RLS on existing tables: replace open policies with authenticated-only
DROP POLICY IF EXISTS "open access contracts" ON public.contracts;
DROP POLICY IF EXISTS "open access documents" ON public.documents;
DROP POLICY IF EXISTS "open access expenses" ON public.expenses;
DROP POLICY IF EXISTS "open access maintenance" ON public.maintenance_requests;
DROP POLICY IF EXISTS "open access payments" ON public.payments;
DROP POLICY IF EXISTS "open access properties" ON public.properties;
DROP POLICY IF EXISTS "open access tenants" ON public.tenants;
DROP POLICY IF EXISTS "open access units" ON public.units;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['contracts','documents','expenses','maintenance_requests','payments','properties','tenants','units']
  LOOP
    EXECUTE format('CREATE POLICY "auth read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "auth insert %1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "auth update %1$s" ON public.%1$I FOR UPDATE TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "auth delete %1$s" ON public.%1$I FOR DELETE TO authenticated USING (true)', t);
  END LOOP;
END $$;

-- 5. Notifications generator (contract expiry within 30d + overdue payments)
CREATE OR REPLACE FUNCTION public.generate_alert_notifications()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Overdue payments
  INSERT INTO public.notifications (title, body, category, link)
  SELECT 'دفعة متأخرة', 'يوجد دفعة متأخرة بقيمة ' || p.amount || ' ر.س مستحقة منذ ' || p.due_date,
         'payment_late', '/payments'
  FROM public.payments p
  WHERE p.status IN ('متأخر','غير مدفوع') AND p.due_date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.category = 'payment_late' AND n.body LIKE '%' || p.id::text || '%'
    )
    AND FALSE; -- disabled body match; instead use a simpler dedupe below
  
  -- Simpler: just ensure one row per overdue payment id
  INSERT INTO public.notifications (title, body, category, link)
  SELECT 'دفعة متأخرة #' || substr(p.id::text,1,8),
         'دفعة بقيمة ' || p.amount || ' ر.س مستحقة منذ ' || p.due_date,
         'payment_late', '/payments'
  FROM public.payments p
  WHERE p.status IN ('متأخر','غير مدفوع') AND p.due_date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.title = 'دفعة متأخرة #' || substr(p.id::text,1,8)
    );

  -- Contracts expiring in <=30 days
  INSERT INTO public.notifications (title, body, category, link)
  SELECT 'عقد ينتهي قريباً #' || substr(c.id::text,1,8),
         'العقد ينتهي بتاريخ ' || c.end_date,
         'contract_expiry', '/contracts'
  FROM public.contracts c
  WHERE c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND c.status = 'ساري'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.title = 'عقد ينتهي قريباً #' || substr(c.id::text,1,8)
    );
END $$;

GRANT EXECUTE ON FUNCTION public.generate_alert_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, anon;
