-- Add owusujunior2004@gmail.com to admin bootstrap list and grant admin role
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

-- Ensure all admin bootstrap emails are recorded
INSERT INTO public.admin_bootstrap_emails (email) VALUES
('virtu.iq.hq@gmail.com'),
('aaronyeboah545@gmail.com'),
('owusujunior2004@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Grant admin role immediately to existing user with this email (if registered)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(email) = 'owusujunior2004@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also mark registration_paid as true in profiles for this admin
UPDATE public.profiles
SET registration_paid = true,
    registration_paid_at = COALESCE(registration_paid_at, now())
WHERE lower(email) = 'owusujunior2004@gmail.com';
