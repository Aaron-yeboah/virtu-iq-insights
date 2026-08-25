-- 1. Bulletproof protect_profile_credits trigger to never block admin/system updates
CREATE OR REPLACE FUNCTION public.protect_profile_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only non-admin direct client updates without trusted context are blocked
  IF NEW.credits IS DISTINCT FROM OLD.credits
     AND COALESCE(current_setting('app.credit_ctx', true), '') <> 'trusted'
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.credits := OLD.credits;
  END IF;

  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.referral_code := OLD.referral_code;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 2. Enhanced review_payment to always load package credits accurately into wallet
CREATE OR REPLACE FUNCTION public.review_payment(_payment_id uuid, _approve boolean, _note text DEFAULT NULL::text)
RETURNS payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE 
  _p public.payments; 
  _partner UUID; 
  _rate numeric;
  _pkg_credits integer := 0;
  _credits_to_grant integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT * INTO _p FROM public.payments WHERE id = _payment_id FOR UPDATE;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF _p.status <> 'pending' THEN RAISE EXCEPTION 'ALREADY_REVIEWED'; END IF;

  -- Determine credits from package table if package_id exists
  IF _p.package_id IS NOT NULL THEN
    SELECT COALESCE(pk.credits, 0) INTO _pkg_credits FROM public.packages pk WHERE pk.id = _p.package_id;
    _credits_to_grant := CASE WHEN _pkg_credits > 0 THEN _pkg_credits ELSE COALESCE(_p.credits, 0) END;
  ELSE
    _credits_to_grant := COALESCE(_p.credits, 0);
  END IF;

  UPDATE public.payments
     SET status = CASE WHEN _approve THEN 'approved'::public.payment_status ELSE 'rejected'::public.payment_status END,
         credits = CASE WHEN _credits_to_grant > 0 THEN _credits_to_grant ELSE credits END,
         admin_note = _note, 
         reviewed_by = auth.uid(), 
         reviewed_at = now()
   WHERE id = _payment_id RETURNING * INTO _p;

  IF _approve THEN
    IF _p.kind = 'registration' AND _p.package_id IS NULL THEN
      UPDATE public.profiles
         SET registration_paid = true, registration_paid_at = now(), updated_at = now()
       WHERE id = _p.user_id;
    ELSE
      -- Package purchase or credit grant:
      PERFORM set_config('app.credit_ctx', 'trusted', true);
      UPDATE public.profiles 
         SET credits = COALESCE(credits, 0) + _credits_to_grant, 
             registration_paid = true,
             updated_at = now() 
       WHERE id = _p.user_id;
      PERFORM set_config('app.credit_ctx', '', true);

      INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id)
      VALUES (_p.user_id, _credits_to_grant, 'Package purchase approved', _p.id);
    END IF;

    SELECT referred_by INTO _partner FROM public.profiles WHERE id = _p.user_id;
    IF _partner IS NOT NULL THEN
      SELECT COALESCE(commission_rate, 10) INTO _rate FROM public.profiles WHERE id = _partner;
      INSERT INTO public.partner_commissions (partner_id, referred_user_id, payment_id, amount_ghs)
      VALUES (_partner, _p.user_id, _p.id, round(_p.amount_ghs * (COALESCE(_rate,10) / 100.0), 2));
    END IF;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'payment.approved' ELSE 'payment.rejected' END, 'payments', _p.id,
          jsonb_build_object('kind', _p.kind, 'credits', _credits_to_grant, 'amount_ghs', _p.amount_ghs, 'note', _note));

  RETURN _p;
END;
$function$;

-- 3. One-time credit sync for any approved package payment where balance was not credited
DO $$
DECLARE
  r RECORD;
  _pkg_credits integer;
  _actual_credits integer;
BEGIN
  FOR r IN 
    SELECT p.id, p.user_id, p.package_id, p.credits
    FROM public.payments p
    WHERE p.status = 'approved' AND (p.package_id IS NOT NULL OR p.kind = 'package')
  LOOP
    IF r.package_id IS NOT NULL THEN
      SELECT COALESCE(pk.credits, 0) INTO _pkg_credits FROM public.packages pk WHERE pk.id = r.package_id;
      _actual_credits := CASE WHEN _pkg_credits > 0 THEN _pkg_credits ELSE COALESCE(r.credits, 0) END;
    ELSE
      _actual_credits := COALESCE(r.credits, 0);
    END IF;

    IF _actual_credits > 0 AND NOT EXISTS (SELECT 1 FROM public.credit_transactions WHERE ref_id = r.id) THEN
      PERFORM set_config('app.credit_ctx', 'trusted', true);
      UPDATE public.profiles 
         SET credits = COALESCE(credits, 0) + _actual_credits, 
             registration_paid = true,
             updated_at = now() 
       WHERE id = r.user_id;
      PERFORM set_config('app.credit_ctx', '', true);

      INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id)
      VALUES (r.user_id, _actual_credits, 'Package purchase sync', r.id);
    END IF;
  END LOOP;
END $$;
