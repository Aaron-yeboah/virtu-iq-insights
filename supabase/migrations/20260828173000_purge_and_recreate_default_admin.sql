-- =============================================================================
-- Migration: Purge & Recreate Default Admin (0552231466 / Billgateaaron1$)
-- Ensures all Supabase GoTrue columns (is_anonymous, identities, metadata)
-- are 100% compliant so GoTrue login works immediately without schema errors.
-- =============================================================================

-- 1. Ensure admin_bootstrap_emails contains all admin phone variations
CREATE TABLE IF NOT EXISTS public.admin_bootstrap_emails (
  email text PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_bootstrap_emails ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.admin_bootstrap_emails TO anon, authenticated;
GRANT ALL ON public.admin_bootstrap_emails TO service_role;

INSERT INTO public.admin_bootstrap_emails (email) VALUES
('0552231466@phone.virtu-iq.live'),
('552231466@phone.virtu-iq.live'),
('233552231466@phone.virtu-iq.live'),
('virtu.iq.hq@gmail.com'),
('aaronyeboah545@gmail.com'),
('owusujunior2004@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 2. Update handle_new_user trigger to automatically assign admin privileges
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
  _is_admin BOOLEAN;
BEGIN
  LOOP
    _code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = _code);
  END LOOP;

  SELECT p.id INTO _ref FROM public.profiles p
   WHERE p.referral_code = upper(NULLIF(NEW.raw_user_meta_data->>'referral_code',''))
     AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'partner');

  _is_applicant := COALESCE(NEW.raw_user_meta_data->>'partner_applicant','') IN ('true','1');

  _is_admin := EXISTS (
    SELECT 1 FROM public.admin_bootstrap_emails b
    WHERE lower(b.email) = lower(NEW.email)
  ) OR lower(COALESCE(NEW.raw_user_meta_data->>'phone','')) = '0552231466';

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    referral_code,
    referred_by,
    partner_applicant,
    registration_paid,
    credits
  )
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'full_name',''),
    NULLIF(NEW.raw_user_meta_data->>'phone',''),
    _code,
    _ref,
    _is_applicant,
    CASE WHEN _is_applicant OR _is_admin THEN true ELSE false END,
    CASE WHEN _is_admin THEN 1000 ELSE 0 END
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    partner_applicant = CASE WHEN _is_applicant THEN true ELSE profiles.partner_applicant END,
    registration_paid = CASE WHEN _is_applicant OR _is_admin THEN true ELSE profiles.registration_paid END,
    credits = CASE WHEN _is_admin THEN GREATEST(profiles.credits, 1000) ELSE profiles.credits END;

  -- Default member role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member')
  ON CONFLICT DO NOTHING;

  -- Admin role if bootstrap admin
  IF _is_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3. Purge existing corrupted admin record and cleanly recreate
DO $$
DECLARE
  _user_id uuid := gen_random_uuid();
  _hashed_pw text;
  _admin_email text := '0552231466@phone.virtu-iq.live';
  _admin_phone text := '0552231466';
BEGIN
  -- Generate bcrypt hash for Billgateaaron1$
  BEGIN
    _hashed_pw := extensions.crypt('Billgateaaron1$', extensions.gen_salt('bf', 10));
  EXCEPTION WHEN OTHERS THEN
    _hashed_pw := crypt('Billgateaaron1$', gen_salt('bf', 10));
  END;

  -- Clean out any old broken rows for 0552231466
  DELETE FROM auth.identities
  WHERE provider_id IN (_admin_email, '552231466@phone.virtu-iq.live', '233552231466@phone.virtu-iq.live')
     OR user_id IN (
       SELECT id FROM auth.users
       WHERE lower(email) IN (_admin_email, '552231466@phone.virtu-iq.live', '233552231466@phone.virtu-iq.live')
          OR phone = _admin_phone
     );

  DELETE FROM public.user_roles
  WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE lower(email) IN (_admin_email, '552231466@phone.virtu-iq.live', '233552231466@phone.virtu-iq.live')
       OR phone = _admin_phone
  );

  DELETE FROM public.profiles
  WHERE lower(email) IN (_admin_email, '552231466@phone.virtu-iq.live', '233552231466@phone.virtu-iq.live')
     OR phone = _admin_phone;

  DELETE FROM auth.users
  WHERE lower(email) IN (_admin_email, '552231466@phone.virtu-iq.live', '233552231466@phone.virtu-iq.live')
     OR phone = _admin_phone;

  -- Insert clean, compliant user record into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    phone,
    encrypted_password,
    email_confirmed_at,
    phone_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    is_super_admin,
    is_sso_user
  ) VALUES (
    _user_id,
    '00000000-0000-0000-0000-000000000000',
    _admin_email,
    _admin_phone,
    _hashed_pw,
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin","phone":"0552231466"}'::jsonb,
    now(),
    now(),
    'authenticated',
    'authenticated',
    false,
    false
  );

  -- Insert valid auth.identities record
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    _user_id::text,
    _user_id,
    jsonb_build_object('sub', _user_id::text, 'email', _admin_email),
    'email',
    _admin_email,
    now(),
    now(),
    now()
  );

  -- Ensure public.profiles entry
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    credits,
    referral_code,
    registration_paid,
    registration_paid_at,
    created_at,
    updated_at
  ) VALUES (
    _user_id,
    _admin_email,
    'Admin',
    _admin_phone,
    1000,
    'ADMIN01',
    true,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = _admin_email,
    phone = _admin_phone,
    full_name = 'Admin',
    credits = GREATEST(profiles.credits, 1000),
    registration_paid = true,
    registration_paid_at = COALESCE(profiles.registration_paid_at, now()),
    updated_at = now();

  -- Grant roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'member')
  ON CONFLICT DO NOTHING;

END $$;
