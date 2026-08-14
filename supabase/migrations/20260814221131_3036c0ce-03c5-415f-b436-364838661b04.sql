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

-- Backfill: grant credits for approved package payments that never landed in the wallet
DO $$
DECLARE r RECORD;
BEGIN
  PERFORM set_config('app.credit_ctx', 'trusted', true);
  FOR r IN
    SELECT p.id, p.user_id, p.credits
      FROM public.payments p
     WHERE p.status = 'approved' AND p.kind <> 'registration'
       AND NOT EXISTS (
         SELECT 1 FROM public.credit_transactions ct
          WHERE ct.ref_id = p.id AND ct.delta > 0
       )
  LOOP
    UPDATE public.profiles SET credits = credits + r.credits, updated_at = now() WHERE id = r.user_id;
    INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id)
    VALUES (r.user_id, r.credits, 'Package purchase approved (backfill)', r.id);
  END LOOP;
  PERFORM set_config('app.credit_ctx', '', true);
END $$;