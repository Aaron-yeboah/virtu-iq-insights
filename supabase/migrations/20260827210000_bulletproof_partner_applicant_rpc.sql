-- Bulletproof RPC to ensure partner applicant status and registration fee waiver
-- are applied with SECURITY DEFINER privileges (bypassing any client RLS issues).

CREATE OR REPLACE FUNCTION public.register_partner_applicant(_user_id UUID, _phone TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Ensure profile is marked as partner applicant and exempted from registration fee
  UPDATE public.profiles
  SET partner_applicant = true,
      registration_paid = true,
      phone = COALESCE(NULLIF(_phone, ''), phone),
      updated_at = now()
  WHERE id = _user_id;

  -- 2. Ensure partner application is created with 'pending' status for admin review
  INSERT INTO public.partner_applications (
    user_id,
    audience,
    motivation,
    payout_method,
    payout_details,
    status
  )
  VALUES (
    _user_id,
    'Partner link invite',
    'Registered via partner invitation link',
    'MTN MoMo',
    COALESCE(NULLIF(_phone, ''), 'Pending'),
    'pending'
  )
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_partner_applicant(UUID, TEXT) TO anon, authenticated, service_role;

-- Also update handle_new_user trigger
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
    CASE WHEN _is_applicant THEN true ELSE false END,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    partner_applicant = CASE WHEN _is_applicant THEN true ELSE profiles.partner_applicant END,
    registration_paid = CASE WHEN _is_applicant THEN true ELSE profiles.registration_paid END;

  -- Default 'member' role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member')
  ON CONFLICT DO NOTHING;

  -- Auto-create pending application for admin review
  IF _is_applicant THEN
    INSERT INTO public.partner_applications (
      user_id,
      audience,
      motivation,
      payout_method,
      payout_details,
      status
    )
    VALUES (
      NEW.id,
      'Partner link invite',
      'Registered via partner invitation link',
      'MTN MoMo',
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone',''), 'Pending'),
      'pending'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Bootstrap admin
  IF EXISTS (
    SELECT 1 FROM public.admin_bootstrap_emails WHERE email = lower(NEW.email)
  ) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Retroactively fix all partner applicants in the database so their registration fee is waived
UPDATE public.profiles
SET partner_applicant = true,
    registration_paid = true,
    updated_at = now()
WHERE id IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'partner_applicant' IN ('true','1')
) OR id IN (
  SELECT user_id FROM public.partner_applications
);

NOTIFY pgrst, 'reload schema';
