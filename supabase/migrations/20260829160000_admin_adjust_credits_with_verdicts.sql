-- Add max_verdicts to profiles table if not present
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_verdicts integer DEFAULT 2;

-- Update admin_adjust_credits to accept and persist _max_verdicts
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(
  _user_id uuid,
  _delta integer,
  _reason text DEFAULT NULL::text,
  _max_verdicts integer DEFAULT NULL::integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _remaining INTEGER;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _delta IS NULL OR _delta = 0 OR abs(_delta) > 10000 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;

  PERFORM set_config('app.credit_ctx', 'trusted', true);
  UPDATE public.profiles
     SET credits = GREATEST(0, credits + _delta),
         max_verdicts = CASE 
           WHEN _max_verdicts IS NOT NULL AND _max_verdicts >= 1 THEN _max_verdicts 
           ELSE COALESCE(max_verdicts, 2) 
         END,
         updated_at = now()
   WHERE id = _user_id
   RETURNING credits INTO _remaining;
  PERFORM set_config('app.credit_ctx', '', true);

  IF _remaining IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  INSERT INTO public.credit_transactions (user_id, delta, reason)
  VALUES (_user_id, _delta, COALESCE(NULLIF(_reason,''), CASE WHEN _delta > 0 THEN 'Admin credit grant' ELSE 'Admin credit adjustment' END));

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), 'credits.adjusted', 'profiles', _user_id, jsonb_build_object('delta', _delta, 'reason', _reason, 'balance', _remaining, 'max_verdicts', _max_verdicts));

  RETURN _remaining;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_adjust_credits(uuid, integer, text, integer) TO authenticated, service_role;

-- Update my_verdict_limit to check user profile's allocated max_verdicts first
CREATE OR REPLACE FUNCTION public.my_verdict_limit()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- 1. Check profile-level allocated max_verdicts
    (SELECT p.max_verdicts FROM public.profiles p WHERE p.id = auth.uid() AND p.max_verdicts IS NOT NULL),
    -- 2. Check latest approved package payment
    (SELECT pk.max_verdicts
     FROM public.payments pm
     JOIN public.packages pk ON pk.id = pm.package_id
     WHERE pm.user_id = auth.uid() AND pm.status = 'approved'
     ORDER BY pm.reviewed_at DESC NULLS LAST, pm.created_at DESC
     LIMIT 1),
    -- 3. Default fallback
    2
  );
$$;

GRANT EXECUTE ON FUNCTION public.my_verdict_limit() TO authenticated, service_role;

-- Update admin_member_list to return max_verdicts
DROP FUNCTION IF EXISTS public.admin_member_list(text, boolean, uuid);

CREATE OR REPLACE FUNCTION public.admin_member_list(_search text DEFAULT NULL, _only_partners boolean DEFAULT false, _partner_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid, email text, full_name text, phone text, credits integer, referral_code text,
  created_at timestamp with time zone, last_sign_in_at timestamp with time zone,
  registration_paid boolean, registration_paid_at timestamp with time zone,
  is_partner boolean, is_admin boolean, referred_by uuid, referrer_name text,
  spent_ghs numeric, referral_count integer, max_verdicts integer
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
         (SELECT count(*)::int FROM public.profiles c WHERE c.referred_by = p.id) AS referral_count,
         COALESCE(p.max_verdicts, 2) AS max_verdicts
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
