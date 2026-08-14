ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner_applicant boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  INSERT INTO public.profiles (id, email, full_name, phone, referral_code, referred_by, partner_applicant)
  VALUES (NEW.id, NEW.email, NULLIF(NEW.raw_user_meta_data->>'full_name',''), NULLIF(NEW.raw_user_meta_data->>'phone',''), _code, _ref, _is_applicant);

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

-- Admins need the applicant's identity next to each application
CREATE OR REPLACE FUNCTION public.admin_partner_applications()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  email text,
  phone text,
  audience text,
  motivation text,
  payout_method text,
  payout_details text,
  status public.application_status,
  admin_note text,
  created_at timestamptz
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;
  RETURN QUERY
  SELECT a.id, a.user_id, p.full_name, p.email, p.phone, a.audience, a.motivation,
         a.payout_method, a.payout_details, a.status, a.admin_note, a.created_at
    FROM public.partner_applications a
    LEFT JOIN public.profiles p ON p.id = a.user_id
   ORDER BY (a.status = 'pending') DESC, a.created_at DESC
   LIMIT 200;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_partner_applications() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_partner_applications() TO authenticated, service_role;

ALTER TABLE public.partner_applications REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_applications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;