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

  SELECT p.id INTO _ref FROM public.profiles p
   WHERE p.referral_code = upper(NULLIF(NEW.raw_user_meta_data->>'referral_code',''))
     AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'partner');

  INSERT INTO public.profiles (id, email, full_name, phone, referral_code, referred_by)
  VALUES (NEW.id, NEW.email, NULLIF(NEW.raw_user_meta_data->>'full_name',''), NULLIF(NEW.raw_user_meta_data->>'phone',''), _code, _ref);

  INSERT INTO public.credit_transactions (user_id, delta, reason)
  VALUES (NEW.id, 3, 'Welcome bonus');

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
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;