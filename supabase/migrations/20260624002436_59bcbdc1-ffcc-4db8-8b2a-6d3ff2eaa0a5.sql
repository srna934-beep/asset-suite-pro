
CREATE OR REPLACE FUNCTION public.generate_alert_notifications()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Late payments
  INSERT INTO public.notifications (title, body, category, link)
  SELECT 'دفعة متأخرة #' || substr(p.id::text,1,8),
         'دفعة بقيمة ' || p.amount || ' ر.س مستحقة منذ ' || p.due_date,
         'payment_late', '/payments'
  FROM public.payments p
  WHERE p.status IN ('متأخر','غير مدفوع') AND p.due_date < CURRENT_DATE
    AND NOT EXISTS (SELECT 1 FROM public.notifications n WHERE n.title = 'دفعة متأخرة #' || substr(p.id::text,1,8));

  -- Contracts expiring within 30 days
  INSERT INTO public.notifications (title, body, category, link)
  SELECT 'عقد ينتهي قريباً #' || substr(c.id::text,1,8),
         'العقد ينتهي بتاريخ ' || c.end_date, 'contract_expiry', '/contracts'
  FROM public.contracts c
  WHERE c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND c.status IN ('نشط','ساري')
    AND NOT EXISTS (SELECT 1 FROM public.notifications n WHERE n.title = 'عقد ينتهي قريباً #' || substr(c.id::text,1,8));

  -- Vehicle insurance expiring within 30 days
  INSERT INTO public.notifications (title, body, category, link)
  SELECT 'تأمين مركبة ينتهي #' || substr(v.id::text,1,8),
         COALESCE(v.name,'مركبة') || ' — تأمين ينتهي ' || v.insurance_expiry,
         'vehicle_insurance', '/vehicles'
  FROM public.vehicles v
  WHERE v.insurance_expiry IS NOT NULL
    AND v.insurance_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND NOT v.archived
    AND NOT EXISTS (SELECT 1 FROM public.notifications n WHERE n.title = 'تأمين مركبة ينتهي #' || substr(v.id::text,1,8));

  -- Vehicle license expiring within 30 days
  INSERT INTO public.notifications (title, body, category, link)
  SELECT 'استمارة مركبة تنتهي #' || substr(v.id::text,1,8),
         COALESCE(v.name,'مركبة') || ' — استمارة تنتهي ' || v.license_expiry,
         'vehicle_license', '/vehicles'
  FROM public.vehicles v
  WHERE v.license_expiry IS NOT NULL
    AND v.license_expiry BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND NOT v.archived
    AND NOT EXISTS (SELECT 1 FROM public.notifications n WHERE n.title = 'استمارة مركبة تنتهي #' || substr(v.id::text,1,8));

  -- Employment contracts expiring within 30 days
  INSERT INTO public.notifications (title, body, category, link)
  SELECT 'عقد موظف ينتهي #' || substr(ec.id::text,1,8),
         'عقد ينتهي بتاريخ ' || ec.end_date, 'employment_expiry', '/employment-contracts'
  FROM public.employment_contracts ec
  WHERE ec.end_date IS NOT NULL
    AND ec.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND ec.status = 'نشط'
    AND NOT EXISTS (SELECT 1 FROM public.notifications n WHERE n.title = 'عقد موظف ينتهي #' || substr(ec.id::text,1,8));

  -- Document expiry within 30 days
  INSERT INTO public.notifications (title, body, category, link)
  SELECT 'وثيقة تنتهي #' || substr(d.id::text,1,8),
         COALESCE(d.title,'وثيقة') || ' — تنتهي ' || d.expiry_date, 'document_expiry', '/documents'
  FROM public.documents d
  WHERE d.expiry_date IS NOT NULL
    AND d.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND NOT EXISTS (SELECT 1 FROM public.notifications n WHERE n.title = 'وثيقة تنتهي #' || substr(d.id::text,1,8));
END $function$;
