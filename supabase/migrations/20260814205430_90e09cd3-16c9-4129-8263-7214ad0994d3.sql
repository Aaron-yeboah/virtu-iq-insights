DROP FUNCTION IF EXISTS public.admin_member_list(text, boolean, uuid);

CREATE OR REPLACE FUNCTION public.admin_member_list(_search text DEFAULT NULL, _only_partners boolean DEFAULT false, _partner_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid, email text, full_name text, phone text, credits integer, referral_code text,
  created_at timestamp with time zone, last_sign_in_at timestamp with time zone,
  registration_paid boolean, registration_paid_at timestamp with time zone,
  is_partner boolean, is_admin boolean, referred_by uuid, referrer_name text,
  spent_ghs numeric, referral_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.email, p.full_name, p.phone, p.credits, p.referral_code, p.created_at,
         (SELECT u.last_sign_in_at FROM auth.users u WHERE u.id = p.id) AS last_sign_in_at,
         p.registration_paid, p.registration_paid_at,
         EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'partner') AS is_partner,
         EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'admin') AS is_admin,
         p.referred_by,
         (SELECT COALESCE(rp.full_name, rp.email) FROM public.profiles rp WHERE rp.id = p.referred_by) AS referrer_name,
         (SELECT COALESCE(sum(pay.amount_ghs),0) FROM public.payments pay WHERE pay.user_id = p.id AND pay.status = 'approved') AS spent_ghs,
         (SELECT count(*)::int FROM public.profiles c WHERE c.referred_by = p.id) AS referral_count
    FROM public.profiles p
   WHERE public.has_role(auth.uid(), 'admin')
     AND (_search IS NULL OR _search = '' OR p.email ILIKE '%'||_search||'%' OR COALESCE(p.full_name,'') ILIKE '%'||_search||'%' OR COALESCE(p.phone,'') ILIKE '%'||_search||'%' OR p.referral_code ILIKE '%'||_search||'%')
     AND (NOT _only_partners OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'partner'))
     AND (_partner_id IS NULL OR p.referred_by = _partner_id)
   ORDER BY p.created_at DESC
   LIMIT 500;
$$;

REVOKE ALL ON FUNCTION public.admin_member_list(text, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_member_list(text, boolean, uuid) TO authenticated, service_role;