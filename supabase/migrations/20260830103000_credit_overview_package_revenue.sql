-- Add credit_revenue_ghs to admin_credit_overview so the
-- Packages & Credits tab shows only credit/package revenue,
-- excluding registration fees.
CREATE OR REPLACE FUNCTION public.admin_credit_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _r jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT jsonb_build_object(
    'credits_outstanding', (SELECT COALESCE(sum(credits),0) FROM public.profiles),
    'credits_sold',        (SELECT COALESCE(sum(credits),0) FROM public.payments WHERE status='approved'),
    'credits_spent',       (SELECT COALESCE(-sum(delta),0)  FROM public.credit_transactions WHERE delta < 0),
    'revenue_ghs',         (SELECT COALESCE(sum(amount_ghs),0) FROM public.payments WHERE status='approved'),
    'credit_revenue_ghs',  (SELECT COALESCE(sum(amount_ghs),0) FROM public.payments
                             WHERE status='approved' AND (package_id IS NOT NULL OR kind = 'package')),
    'active_packages',     (SELECT count(*) FROM public.packages WHERE is_active)
  ) INTO _r;
  RETURN _r;
END;
$$;
