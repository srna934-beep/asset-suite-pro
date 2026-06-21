
CREATE OR REPLACE FUNCTION public.generate_alert_notifications()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
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

  INSERT INTO public.notifications (title, body, category, link)
  SELECT 'عقد ينتهي قريباً #' || substr(c.id::text,1,8),
         'العقد ينتهي بتاريخ ' || c.end_date,
         'contract_expiry', '/contracts'
  FROM public.contracts c
  WHERE c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND c.status IN ('نشط','ساري')
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.title = 'عقد ينتهي قريباً #' || substr(c.id::text,1,8)
    );
END $$;
