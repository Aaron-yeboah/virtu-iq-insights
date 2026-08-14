CREATE OR REPLACE FUNCTION public.admin_partner_list(_search text DEFAULT NULL)
RETURNS TABLE(id uuid, email text, full_name text, referral_code text, commission_rate numeric, payout_cleared_at timestamptz, referral_count integer, revenue_ghs numeric, commissions_ghs numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
         p.email,
         p.full_name,
         p.referral_code,
         COALESCE(p.commission_rate, 10) AS commission_rate,
         p.payout_cleared_at,
         (SELECT count(*)::int FROM public.profiles r WHERE r.referred_by = p.id) AS referral_count,
         rev.revenue_ghs,
         round(rev.revenue_ghs * COALESCE(p.commission_rate, 10) / 100.0, 2) AS commissions_ghs
    FROM public.profiles p
    CROSS JOIN LATERAL (
      SELECT COALESCE(sum(pay.amount_ghs),0)::numeric AS revenue_ghs
        FROM public.payments pay
        JOIN public.profiles r ON r.id = pay.user_id
       WHERE r.referred_by = p.id AND pay.status = 'approved'
         AND pay.created_at > COALESCE(p.payout_cleared_at, '-infinity'::timestamptz)
    ) rev
   WHERE public.has_role(auth.uid(), 'admin')
     AND public.has_role(p.id, 'partner')
     AND (
       _search IS NULL OR btrim(_search) = '' OR
       p.email ILIKE '%' || btrim(_search) || '%' OR
       COALESCE(p.full_name,'') ILIKE '%' || btrim(_search) || '%' OR
       p.referral_code ILIKE '%' || btrim(_search) || '%'
     )
   ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.partner_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT id, COALESCE(commission_rate, 10) AS rate, payout_cleared_at
      FROM public.profiles WHERE id = auth.uid()
  ), rev AS (
    SELECT COALESCE(sum(pay.amount_ghs),0)::numeric AS revenue_ghs
      FROM public.payments pay
      JOIN public.profiles p ON p.id = pay.user_id
      JOIN me ON true
     WHERE p.referred_by = me.id AND pay.status = 'approved'
       AND pay.created_at > COALESCE(me.payout_cleared_at, '-infinity'::timestamptz)
  )
  SELECT jsonb_build_object(
    'registrations', (SELECT count(*) FROM public.profiles WHERE referred_by = auth.uid()),
    'revenue_ghs', (SELECT revenue_ghs FROM rev),
    'commissions_ghs', round((SELECT revenue_ghs FROM rev) * (SELECT rate FROM me) / 100.0, 2),
    'commission_rate', (SELECT rate FROM me)
  )
  WHERE public.has_role(auth.uid(), 'partner');
$$;