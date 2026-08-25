-- Enforce zero free credits on registration
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 0;

-- Ensure handle_new_user trigger always sets 0 credits on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _code TEXT;
  _ref UUID;
  _is_applicant BOOLEAN;
BEGIN
  LOOP
    _code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = _code);
  END LOOP;

  SELECT p.id INTO _ref FROM public.profiles p
   WHERE p.referral_code = upper(NULLIF(NEW.raw_user_meta_data->>'referral_code',''))
     AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'partner');

  _is_applicant := COALESCE(NEW.raw_user_meta_data->>'partner_applicant','') IN ('true','1');

  INSERT INTO public.profiles (id, email, full_name, phone, referral_code, referred_by, partner_applicant, credits)
  VALUES (NEW.id, NEW.email, NULLIF(NEW.raw_user_meta_data->>'full_name',''), NULLIF(NEW.raw_user_meta_data->>'phone',''), _code, _ref, _is_applicant, 0);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member')
  ON CONFLICT DO NOTHING;

  IF EXISTS (
    SELECT 1 FROM public.admin_bootstrap_emails WHERE email = lower(NEW.email)
  ) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure review_payment only adds credits on approved package purchases, never on registration
CREATE OR REPLACE FUNCTION public.review_payment(_payment_id uuid, _approve boolean, _note text DEFAULT NULL::text)
 RETURNS payments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    IF _p.kind = 'registration' THEN
      UPDATE public.profiles
         SET registration_paid = true, registration_paid_at = now(), updated_at = now()
       WHERE id = _p.user_id;
    ELSE
      PERFORM set_config('app.credit_ctx', 'trusted', true);
      UPDATE public.profiles SET credits = credits + _p.credits, updated_at = now() WHERE id = _p.user_id;
      PERFORM set_config('app.credit_ctx', '', true);
      INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id)
      VALUES (_p.user_id, _p.credits, 'Package purchase approved', _p.id);
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
          jsonb_build_object('kind', _p.kind, 'credits', _p.credits, 'amount_ghs', _p.amount_ghs, 'note', _note));

  RETURN _p;
END;
$function$;
