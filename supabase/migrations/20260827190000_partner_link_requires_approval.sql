-- Partner link flow redesign:
-- Users who register via the partner link are flagged as partner_applicant=true
-- but NO longer auto-granted the 'partner' role.
-- The frontend auto-inserts a pending partner_application row.
-- Admins must approve it, which then grants the role via review_partner_application().

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
    -- Partner link users bypass the 50 GHS fee (registration_paid=true)
    -- but they do NOT get partner access until admin approves them.
    CASE WHEN _is_applicant THEN true ELSE false END,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    partner_applicant = EXCLUDED.partner_applicant,
    registration_paid = CASE WHEN _is_applicant THEN true ELSE profiles.registration_paid END;

  -- Default 'member' role for all users
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member')
  ON CONFLICT DO NOTHING;

  -- NOTE: Partner role is intentionally NOT granted here.
  -- It is granted by review_partner_application() when an admin approves the application.

  -- Bootstrap admin accounts
  IF EXISTS (
    SELECT 1 FROM public.admin_bootstrap_emails WHERE email = lower(NEW.email)
  ) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
