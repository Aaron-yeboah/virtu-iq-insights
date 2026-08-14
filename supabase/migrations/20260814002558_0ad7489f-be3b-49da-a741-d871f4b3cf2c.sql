-- 1. Trusted-context guard so credit functions can change balances
CREATE OR REPLACE FUNCTION public.protect_profile_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.credits IS DISTINCT FROM OLD.credits
     AND COALESCE(current_setting('app.credit_ctx', true), '') <> 'trusted' THEN
    NEW.credits := OLD.credits;
  END IF;
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    NEW.referral_code := OLD.referral_code;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.spend_credits(_amount integer, _reason text, _ref_id uuid DEFAULT NULL::uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _remaining INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount < 1 OR _amount > 100 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  PERFORM set_config('app.credit_ctx', 'trusted', true);

  UPDATE public.profiles SET credits = credits - _amount, updated_at = now()
   WHERE id = auth.uid() AND credits >= _amount
   RETURNING credits INTO _remaining;

  PERFORM set_config('app.credit_ctx', '', true);

  IF _remaining IS NULL THEN RAISE EXCEPTION 'INSUFFICIENT_CREDITS'; END IF;

  INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id)
  VALUES (auth.uid(), -_amount, _reason, _ref_id);

  RETURN _remaining;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_credits(_amount integer, _reason text, _ref_id uuid DEFAULT NULL::uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _remaining INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount < 1 OR _amount > 100 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  PERFORM set_config('app.credit_ctx', 'trusted', true);
  UPDATE public.profiles SET credits = credits + _amount, updated_at = now()
   WHERE id = auth.uid() RETURNING credits INTO _remaining;
  PERFORM set_config('app.credit_ctx', '', true);

  INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id)
  VALUES (auth.uid(), _amount, _reason, _ref_id);
  RETURN _remaining;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_payment(_payment_id uuid, _approve boolean, _note text DEFAULT NULL::text)
RETURNS payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _p public.payments; _partner UUID;
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
    PERFORM set_config('app.credit_ctx', 'trusted', true);
    UPDATE public.profiles SET credits = credits + _p.credits, updated_at = now() WHERE id = _p.user_id;
    PERFORM set_config('app.credit_ctx', '', true);

    INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id)
    VALUES (_p.user_id, _p.credits, 'Package purchase approved', _p.id);

    SELECT referred_by INTO _partner FROM public.profiles WHERE id = _p.user_id;
    IF _partner IS NOT NULL THEN
      INSERT INTO public.partner_commissions (partner_id, referred_user_id, payment_id, amount_ghs)
      VALUES (_partner, _p.user_id, _p.id, round(_p.amount_ghs * 0.10, 2));
    END IF;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'payment.approved' ELSE 'payment.rejected' END, 'payments', _p.id,
          jsonb_build_object('credits', _p.credits, 'amount_ghs', _p.amount_ghs, 'note', _note));

  RETURN _p;
END;
$$;

-- 2. Admin credit adjustment
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(_user_id uuid, _delta integer, _reason text DEFAULT NULL::text)
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
     SET credits = GREATEST(0, credits + _delta), updated_at = now()
   WHERE id = _user_id
   RETURNING credits INTO _remaining;
  PERFORM set_config('app.credit_ctx', '', true);

  IF _remaining IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;

  INSERT INTO public.credit_transactions (user_id, delta, reason)
  VALUES (_user_id, _delta, COALESCE(NULLIF(_reason,''), CASE WHEN _delta > 0 THEN 'Admin credit grant' ELSE 'Admin credit adjustment' END));

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), 'credits.adjusted', 'profiles', _user_id, jsonb_build_object('delta', _delta, 'reason', _reason, 'balance', _remaining));

  RETURN _remaining;
END;
$$;

-- 3. Admin package management
CREATE OR REPLACE FUNCTION public.admin_upsert_package(
  _name text,
  _slug text,
  _price_ghs numeric,
  _credits integer,
  _perks jsonb DEFAULT '[]'::jsonb,
  _is_active boolean DEFAULT true,
  _sort_order integer DEFAULT 0,
  _id uuid DEFAULT NULL::uuid
)
RETURNS packages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _p public.packages;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF COALESCE(NULLIF(trim(_name),''), '') = '' THEN RAISE EXCEPTION 'INVALID_NAME'; END IF;
  IF _price_ghs IS NULL OR _price_ghs < 0 THEN RAISE EXCEPTION 'INVALID_PRICE'; END IF;
  IF _credits IS NULL OR _credits < 1 THEN RAISE EXCEPTION 'INVALID_CREDITS'; END IF;

  IF _id IS NULL THEN
    INSERT INTO public.packages (name, slug, price_ghs, credits, perks, is_active, sort_order)
    VALUES (trim(_name), lower(trim(_slug)), _price_ghs, _credits, COALESCE(_perks,'[]'::jsonb), COALESCE(_is_active,true), COALESCE(_sort_order,0))
    RETURNING * INTO _p;
  ELSE
    UPDATE public.packages
       SET name = trim(_name), slug = lower(trim(_slug)), price_ghs = _price_ghs, credits = _credits,
           perks = COALESCE(_perks,'[]'::jsonb), is_active = COALESCE(_is_active,true), sort_order = COALESCE(_sort_order,0)
     WHERE id = _id RETURNING * INTO _p;
    IF _p.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), CASE WHEN _id IS NULL THEN 'package.created' ELSE 'package.updated' END, 'packages', _p.id,
          jsonb_build_object('name', _p.name, 'price_ghs', _p.price_ghs, 'credits', _p.credits, 'is_active', _p.is_active));

  RETURN _p;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_package(_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  IF EXISTS (SELECT 1 FROM public.payments WHERE package_id = _id) THEN
    UPDATE public.packages SET is_active = false WHERE id = _id;
  ELSE
    DELETE FROM public.packages WHERE id = _id;
  END IF;
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), 'package.deleted', 'packages', _id, '{}'::jsonb);
  RETURN true;
END;
$$;

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
    'credits_sold', (SELECT COALESCE(sum(credits),0) FROM public.payments WHERE status='approved'),
    'credits_spent', (SELECT COALESCE(-sum(delta),0) FROM public.credit_transactions WHERE delta < 0),
    'revenue_ghs', (SELECT COALESCE(sum(amount_ghs),0) FROM public.payments WHERE status='approved'),
    'active_packages', (SELECT count(*) FROM public.packages WHERE is_active)
  ) INTO _r;
  RETURN _r;
END;
$$;