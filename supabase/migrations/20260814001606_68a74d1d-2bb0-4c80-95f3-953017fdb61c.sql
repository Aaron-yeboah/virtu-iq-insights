CREATE OR REPLACE FUNCTION public.admin_set_partner(_user_id uuid, _make boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  IF _make THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'partner') ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'partner';
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), CASE WHEN _make THEN 'partner.added' ELSE 'partner.removed' END, 'user_roles', _user_id, '{}'::jsonb);

  RETURN _make;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_member_list(_search text DEFAULT NULL, _only_partners boolean DEFAULT false, _partner_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  credits integer,
  referral_code text,
  created_at timestamptz,
  is_partner boolean,
  referred_by uuid,
  referrer_name text,
  spent_ghs numeric,
  referral_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.email, p.full_name, p.credits, p.referral_code, p.created_at,
         EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'partner') AS is_partner,
         p.referred_by,
         (SELECT COALESCE(rp.full_name, rp.email) FROM public.profiles rp WHERE rp.id = p.referred_by) AS referrer_name,
         (SELECT COALESCE(sum(pay.amount_ghs),0) FROM public.payments pay WHERE pay.user_id = p.id AND pay.status = 'approved') AS spent_ghs,
         (SELECT count(*)::int FROM public.profiles c WHERE c.referred_by = p.id) AS referral_count
    FROM public.profiles p
   WHERE public.has_role(auth.uid(), 'admin')
     AND (_search IS NULL OR _search = '' OR p.email ILIKE '%'||_search||'%' OR COALESCE(p.full_name,'') ILIKE '%'||_search||'%' OR p.referral_code ILIKE '%'||_search||'%')
     AND (NOT _only_partners OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'partner'))
     AND (_partner_id IS NULL OR p.referred_by = _partner_id)
   ORDER BY p.created_at DESC
   LIMIT 500;
$$;

CREATE OR REPLACE FUNCTION public.partner_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'registrations', (SELECT count(*) FROM public.profiles WHERE referred_by = auth.uid()),
    'revenue_ghs', (SELECT COALESCE(sum(pay.amount_ghs),0) FROM public.payments pay
                     JOIN public.profiles p ON p.id = pay.user_id
                    WHERE p.referred_by = auth.uid() AND pay.status = 'approved'),
    'commissions_ghs', (SELECT COALESCE(sum(amount_ghs),0) FROM public.partner_commissions WHERE partner_id = auth.uid())
  )
  WHERE public.has_role(auth.uid(), 'partner');
$$;