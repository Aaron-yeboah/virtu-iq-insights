-- Ensure admin_bootstrap_emails table and is_default_admin function exist
CREATE TABLE IF NOT EXISTS public.admin_bootstrap_emails (
  email text PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.admin_bootstrap_emails ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.admin_bootstrap_emails TO authenticated;
GRANT ALL ON public.admin_bootstrap_emails TO service_role;

CREATE POLICY "Admins read bootstrap emails" ON public.admin_bootstrap_emails
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.admin_bootstrap_emails (email) VALUES
('virtu.iq.hq@gmail.com'),
('aaronyeboah545@gmail.com'),
('owusujunior2004@gmail.com')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_default_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admin_bootstrap_emails b ON lower(b.email) = lower(p.email)
    WHERE p.id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_default_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_default_admin(uuid) TO authenticated, service_role;
