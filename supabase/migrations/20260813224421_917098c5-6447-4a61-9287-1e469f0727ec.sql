CREATE TYPE public.app_role AS ENUM ('admin','partner','member');
CREATE TYPE public.payment_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.analysis_status AS ENUM ('pending','processing','completed','failed');
CREATE TYPE public.application_status AS ENUM ('pending','approved','rejected');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.protect_profile_credits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.credits IS DISTINCT FROM OLD.credits THEN
    NEW.credits := OLD.credits;
  END IF;
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    NEW.referral_code := OLD.referral_code;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER protect_profile_credits BEFORE UPDATE ON public.profiles
FOR EACH ROW WHEN (current_setting('role', true) = 'authenticated') EXECUTE FUNCTION public.protect_profile_credits();

CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_ghs NUMERIC(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  perks JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.packages TO anon, authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active packages" ON public.packages FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "Admins manage packages" ON public.packages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.packages (name, slug, price_ghs, credits, perks, sort_order) VALUES
('Starter','starter',250.00,50,'["50 screenshot analyses","Standard AI model","Analysis history","Email support"]'::jsonb,1),
('Plus','plus',350.00,100,'["100 screenshot analyses","Priority AI model","Analysis history & export","Priority support"]'::jsonb,2),
('Premium','premium',500.00,200,'["200 screenshot analyses","Highest-accuracy AI model","Unlimited history & export","Dedicated support"]'::jsonb,3);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  amount_ghs NUMERIC(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  method TEXT NOT NULL,
  reference TEXT NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins update payments" ON public.payments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own credit history" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled analysis',
  image_path TEXT NOT NULL,
  prompt TEXT,
  status public.analysis_status NOT NULL DEFAULT 'pending',
  summary TEXT,
  result JSONB,
  error_message TEXT,
  credits_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own analyses" ON public.analyses FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  audience TEXT NOT NULL,
  motivation TEXT NOT NULL,
  payout_method TEXT NOT NULL,
  payout_details TEXT NOT NULL,
  status public.application_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.partner_applications TO authenticated;
GRANT ALL ON public.partner_applications TO service_role;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own application" ON public.partner_applications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own application" ON public.partner_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins update applications" ON public.partner_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.partner_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  amount_ghs NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_commissions TO authenticated;
GRANT ALL ON public.partner_commissions TO service_role;
ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners read own commissions" ON public.partner_commissions FOR SELECT TO authenticated USING (auth.uid() = partner_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _code TEXT;
  _ref UUID;
BEGIN
  LOOP
    _code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = _code);
  END LOOP;

  SELECT id INTO _ref FROM public.profiles
   WHERE referral_code = upper(NULLIF(NEW.raw_user_meta_data->>'referral_code',''));

  INSERT INTO public.profiles (id, email, full_name, phone, referral_code, referred_by)
  VALUES (NEW.id, NEW.email, NULLIF(NEW.raw_user_meta_data->>'full_name',''), NULLIF(NEW.raw_user_meta_data->>'phone',''), _code, _ref);

  INSERT INTO public.credit_transactions (user_id, delta, reason)
  VALUES (NEW.id, 3, 'Welcome bonus');

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.spend_credits(_amount INTEGER, _reason TEXT, _ref_id UUID DEFAULT NULL)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _remaining INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount < 1 OR _amount > 100 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  UPDATE public.profiles SET credits = credits - _amount, updated_at = now()
   WHERE id = auth.uid() AND credits >= _amount
   RETURNING credits INTO _remaining;

  IF _remaining IS NULL THEN RAISE EXCEPTION 'INSUFFICIENT_CREDITS'; END IF;

  INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id)
  VALUES (auth.uid(), -_amount, _reason, _ref_id);

  RETURN _remaining;
END;
$$;
REVOKE ALL ON FUNCTION public.spend_credits(INTEGER, TEXT, UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.spend_credits(INTEGER, TEXT, UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.refund_credits(_amount INTEGER, _reason TEXT, _ref_id UUID DEFAULT NULL)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _remaining INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount < 1 OR _amount > 100 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  UPDATE public.profiles SET credits = credits + _amount, updated_at = now()
   WHERE id = auth.uid() RETURNING credits INTO _remaining;
  INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id)
  VALUES (auth.uid(), _amount, _reason, _ref_id);
  RETURN _remaining;
END;
$$;
REVOKE ALL ON FUNCTION public.refund_credits(INTEGER, TEXT, UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.refund_credits(INTEGER, TEXT, UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.review_payment(_payment_id UUID, _approve BOOLEAN, _note TEXT DEFAULT NULL)
RETURNS public.payments LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    UPDATE public.profiles SET credits = credits + _p.credits, updated_at = now() WHERE id = _p.user_id;
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
REVOKE ALL ON FUNCTION public.review_payment(UUID, BOOLEAN, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.review_payment(UUID, BOOLEAN, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.review_partner_application(_application_id UUID, _approve BOOLEAN, _note TEXT DEFAULT NULL)
RETURNS public.partner_applications LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _a public.partner_applications;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT * INTO _a FROM public.partner_applications WHERE id = _application_id FOR UPDATE;
  IF _a.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF _a.status <> 'pending' THEN RAISE EXCEPTION 'ALREADY_REVIEWED'; END IF;

  UPDATE public.partner_applications
     SET status = CASE WHEN _approve THEN 'approved'::public.application_status ELSE 'rejected'::public.application_status END,
         admin_note = _note, reviewed_by = auth.uid(), reviewed_at = now()
   WHERE id = _application_id RETURNING * INTO _a;

  IF _approve THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_a.user_id, 'partner') ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), CASE WHEN _approve THEN 'partner.approved' ELSE 'partner.rejected' END, 'partner_applications', _a.id, jsonb_build_object('note', _note));

  RETURN _a;
END;
$$;
REVOKE ALL ON FUNCTION public.review_partner_application(UUID, BOOLEAN, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.review_partner_application(UUID, BOOLEAN, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _r JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  SELECT jsonb_build_object(
    'members', (SELECT count(*) FROM public.profiles),
    'analyses', (SELECT count(*) FROM public.analyses),
    'pending_payments', (SELECT count(*) FROM public.payments WHERE status='pending'),
    'pending_partners', (SELECT count(*) FROM public.partner_applications WHERE status='pending'),
    'revenue_ghs', (SELECT COALESCE(sum(amount_ghs),0) FROM public.payments WHERE status='approved')
  ) INTO _r;
  RETURN _r;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_stats() FROM public;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated, service_role;

CREATE POLICY "Users read own screenshots" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'screenshots' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Users upload own screenshots" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own screenshots" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);