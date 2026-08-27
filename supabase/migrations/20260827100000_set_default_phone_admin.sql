-- Ensure bootstrap emails table includes phone admin synthetic addresses
CREATE TABLE IF NOT EXISTS public.admin_bootstrap_emails (
  email text PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_bootstrap_emails ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.admin_bootstrap_emails TO authenticated;
GRANT ALL ON public.admin_bootstrap_emails TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_bootstrap_emails'
      AND policyname = 'Admins read bootstrap emails'
  ) THEN
    CREATE POLICY "Admins read bootstrap emails" ON public.admin_bootstrap_emails
      FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

INSERT INTO public.admin_bootstrap_emails (email) VALUES
('virtu.iq.hq@gmail.com'),
('aaronyeboah545@gmail.com'),
('owusujunior2004@gmail.com'),
('0552231466@phone.virtu-iq.live'),
('552231466@phone.virtu-iq.live')
ON CONFLICT (email) DO NOTHING;

-- Seed / Update default admin account with phone 0552231466 and password Billgateaaron1$
DO $$
DECLARE
  _user_id uuid;
  _hashed_pw text;
BEGIN
  -- Hash password with pgcrypto blowfish
  BEGIN
    _hashed_pw := extensions.crypt('Billgateaaron1$', extensions.gen_salt('bf'));
  EXCEPTION WHEN OTHERS THEN
    _hashed_pw := crypt('Billgateaaron1$', gen_salt('bf'));
  END;

  -- Check if user exists by phone or synthetic email
  SELECT id INTO _user_id FROM auth.users
  WHERE lower(email) IN ('0552231466@phone.virtu-iq.live', '552231466@phone.virtu-iq.live')
     OR phone = '0552231466'
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
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      _user_id,
      '00000000-0000-0000-0000-000000000000',
      '0552231466@phone.virtu-iq.live',
      '0552231466',
      _hashed_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin","phone":"0552231466"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  ELSE
    -- Update password and confirmation
    UPDATE auth.users
    SET encrypted_password = _hashed_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = _user_id;
  END IF;

  -- Ensure profile exists
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
    '0552231466@phone.virtu-iq.live',
    'Admin',
    '0552231466',
    1000,
    'ADMIN01',
    true,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = '0552231466',
    registration_paid = true,
    registration_paid_at = COALESCE(profiles.registration_paid_at, now()),
    updated_at = now();

  -- Ensure admin role is granted
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;

END $$;
