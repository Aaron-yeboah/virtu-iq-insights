-- =============================================================================
-- Migration: Fix Default Admin Login (Phone: 0552231466, Password: Billgateaaron1$)
-- Resolves GoTrue "Database error querying schema" by ensuring auth.identities
-- and auth.users are properly synced with valid bcrypt hash and metadata.
-- =============================================================================

-- 1. Ensure resolve_phone_email is executable by anon, authenticated, service_role
CREATE OR REPLACE FUNCTION public.resolve_phone_email(p_phone text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_digits text;
  v_tail text;
  v_email text;
BEGIN
  v_digits := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  IF length(v_digits) < 8 THEN
    RETURN NULL;
  END IF;

  v_tail := right(v_digits, 9);

  SELECT email INTO v_email
  FROM public.profiles
  WHERE email IS NOT NULL
    AND right(regexp_replace(COALESCE(phone, ''), '\D', '', 'g'), 9) = v_tail
  LIMIT 1;

  RETURN v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_phone_email(text) FROM public;
GRANT EXECUTE ON FUNCTION public.resolve_phone_email(text) TO anon, authenticated, service_role;

-- 2. Ensure bootstrap emails table includes all admin phone formats
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

-- 3. Create or Repair Admin Account with Phone 0552231466 & Password Billgateaaron1$
DO $$
DECLARE
  _user_id uuid;
  _hashed_pw text;
  _admin_email text := '0552231466@phone.virtu-iq.live';
  _admin_phone text := '0552231466';
BEGIN
  -- Generate Blowfish/bcrypt password hash for Billgateaaron1$
  BEGIN
    _hashed_pw := extensions.crypt('Billgateaaron1$', extensions.gen_salt('bf', 10));
  EXCEPTION WHEN OTHERS THEN
    _hashed_pw := crypt('Billgateaaron1$', gen_salt('bf', 10));
  END;

  -- Find existing user by phone or email
  SELECT id INTO _user_id FROM auth.users
  WHERE lower(email) IN (_admin_email, '552231466@phone.virtu-iq.live', '233552231466@phone.virtu-iq.live')
     OR phone = _admin_phone
  LIMIT 1;

  IF _user_id IS NULL THEN
    _user_id := gen_random_uuid();

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
      false
    );
  ELSE
    -- Update user to ensure valid credentials and confirmed status
    UPDATE auth.users
    SET email = _admin_email,
        phone = _admin_phone,
        encrypted_password = _hashed_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        phone_confirmed_at = COALESCE(phone_confirmed_at, now()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = jsonb_build_object('full_name', 'Admin', 'phone', _admin_phone),
        aud = 'authenticated',
        role = 'authenticated',
        is_sso_user = false,
        deleted_at = NULL,
        banned_until = NULL,
        updated_at = now()
    WHERE id = _user_id;
  END IF;

  -- 4. Sync auth.identities (MANDATORY for GoTrue signInWithPassword)
  DELETE FROM auth.identities
  WHERE user_id = _user_id
     OR (provider = 'email' AND provider_id IN (_admin_email, '552231466@phone.virtu-iq.live', '233552231466@phone.virtu-iq.live'));

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

  -- 5. Ensure public.profiles has matching entry
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
    registration_paid = true,
    registration_paid_at = COALESCE(profiles.registration_paid_at, now()),
    updated_at = now();

  -- 6. Ensure admin & member roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;

END $$;
