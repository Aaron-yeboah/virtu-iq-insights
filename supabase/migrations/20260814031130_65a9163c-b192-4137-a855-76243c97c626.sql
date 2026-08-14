ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS commission_rate numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS payout_cleared_at timestamptz;

CREATE OR REPLACE FUNCTION public.review_payment(_payment_id UUID, _approve BOOLEAN, _note TEXT DEFAULT NULL)
RETURNS public.payments LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.payments; _partner UUID; _rate numeric;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT * INTO _p FROM public.payments WHERE id = _payment_id FOR UPDATE;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF _p.status <> 'pending' THEN RAISE EXCEPTION 'ALREADY_REVIEWED'; END IF;

  UPDATE public.payments
     SET status = CASE WHEN _approve THEN 'approved'::public.payment_status ELSE 'rejected'::public.payment_status END,
         admin_note = _note, reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = _payment_id RETURNING * INTO _p;

  IF _approve THEN
    UPDATE public.profiles SET credits = credits + _p.credits, updated_at = now() WHERE id = _p.user_id;
    INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id)
    VALUES (_p.user_id, _p.credits, 'Package purchase approved', _p.id);

    SELECT referred_by INTO _partner FROM public.profiles WHERE id = _p.user_id;
    IF _partner IS NOT NULL THEN
      SELECT COALESCE(commission_rate, 10) INTO _rate FROM public.profiles WHERE id = _partner;
      INSERT INTO public.partner_commissions (partner_id, referred_user_id, payment_id, amount_ghs)
      VALUES (_partner, _p.user_id, _p.id, round(_p.amount_ghs * (COALESCE(_rate,10) / 100.0), 2));
    END IF;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'payment.approved' ELSE 'payment.rejected' END, 'payments', _p.id,
          jsonb_build_object('credits', _p.credits, 'amount_ghs', _p.amount_ghs, 'note', _note));

  RETURN _p;
END;
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
                    WHERE p.referred_by = auth.uid() AND pay.status = 'approved'
                      AND pay.created_at > COALESCE((SELECT payout_cleared_at FROM public.profiles WHERE id = auth.uid()), '-infinity'::timestamptz)),
    'commissions_ghs', (SELECT COALESCE(sum(amount_ghs),0) FROM public.partner_commissions
                         WHERE partner_id = auth.uid()
                           AND created_at > COALESCE((SELECT payout_cleared_at FROM public.profiles WHERE id = auth.uid()), '-infinity'::timestamptz)),
    'commission_rate', (SELECT COALESCE(commission_rate, 10) FROM public.profiles WHERE id = auth.uid())
  )
  WHERE public.has_role(auth.uid(), 'partner');
$$;

CREATE OR REPLACE FUNCTION public.admin_partner_list(_search text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  referral_code text,
  commission_rate numeric,
  payout_cleared_at timestamptz,
  referral_count integer,
  revenue_ghs numeric,
  commissions_ghs numeric
)
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
         (SELECT COALESCE(sum(pay.amount_ghs),0) FROM public.payments pay
            JOIN public.profiles r ON r.id = pay.user_id
           WHERE r.referred_by = p.id AND pay.status = 'approved'
             AND pay.created_at > COALESCE(p.payout_cleared_at, '-infinity'::timestamptz)) AS revenue_ghs,
         (SELECT COALESCE(sum(c.amount_ghs),0) FROM public.partner_commissions c
           WHERE c.partner_id = p.id
             AND c.created_at > COALESCE(p.payout_cleared_at, '-infinity'::timestamptz)) AS commissions_ghs
    FROM public.profiles p
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
REVOKE ALL ON FUNCTION public.admin_partner_list(text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_partner_list(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_set_commission_rate(_user_id uuid, _rate numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF _rate IS NULL OR _rate < 0 OR _rate > 100 THEN RAISE EXCEPTION 'INVALID_RATE'; END IF;
  UPDATE public.profiles SET commission_rate = _rate, updated_at = now() WHERE id = _user_id;
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), 'partner.commission_rate', 'profiles', _user_id, jsonb_build_object('rate', _rate));
  RETURN _rate;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_commission_rate(uuid, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_commission_rate(uuid, numeric) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_clear_partner_payout(_user_id uuid)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _t timestamptz := now();
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  UPDATE public.profiles SET payout_cleared_at = _t, updated_at = now() WHERE id = _user_id;
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), 'partner.payout_cleared', 'profiles', _user_id, jsonb_build_object('cleared_at', _t));
  RETURN _t;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_clear_partner_payout(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_clear_partner_payout(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _r JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT jsonb_build_object(
    'members', (SELECT count(*) FROM public.profiles),
    'analyses', (SELECT count(*) FROM public.analyses),
    'pending_payments', (SELECT count(*) FROM public.payments WHERE status='pending'),
    'partners', (SELECT count(*) FROM public.user_roles WHERE role='partner'),
    'pending_partners', (SELECT count(*) FROM public.partner_applications WHERE status='pending'),
    'revenue_ghs', (SELECT COALESCE(sum(amount_ghs),0) FROM public.payments WHERE status='approved')
  ) INTO _r;
  RETURN _r;
END;
$$;