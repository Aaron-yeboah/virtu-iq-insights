CREATE OR REPLACE FUNCTION public.is_default_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admin_bootstrap_emails b ON b.email = lower(p.email)
    WHERE p.id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_default_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_default_admin(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_set_admin(_user_id uuid, _make boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_default_admin(auth.uid()) THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF public.is_default_admin(_user_id) AND NOT _make THEN RAISE EXCEPTION 'CANNOT_REMOVE_DEFAULT_ADMIN'; END IF;

  IF _make THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), CASE WHEN _make THEN 'admin.added' ELSE 'admin.removed' END, 'user_roles', _user_id, '{}'::jsonb);

  RETURN _make;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_admin(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_admin(uuid, boolean) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.admin_member_list(text, boolean, uuid);

CREATE OR REPLACE FUNCTION public.admin_member_list(_search text DEFAULT NULL::text, _only_partners boolean DEFAULT false, _partner_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(id uuid, email text, full_name text, credits integer, referral_code text, created_at timestamp with time zone, is_partner boolean, is_admin boolean, referred_by uuid, referrer_name text, spent_ghs numeric, referral_count integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.email, p.full_name, p.credits, p.referral_code, p.created_at,
         EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'partner') AS is_partner,
         EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'admin') AS is_admin,
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

REVOKE ALL ON FUNCTION public.admin_member_list(text, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_member_list(text, boolean, uuid) TO authenticated, service_role;