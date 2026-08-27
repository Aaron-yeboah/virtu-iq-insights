-- Ensure is_default_admin exists (idempotent) and make admin_set_admin safe even if it doesn't
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
('aaronyeboah545@gmail.com')
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

-- Re-create admin_set_admin to safely handle missing is_default_admin
CREATE OR REPLACE FUNCTION public.admin_set_admin(_user_id uuid, _make boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_bootstrap boolean := false;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  -- Safely check if this is a bootstrap admin (catch if is_default_admin doesn't exist)
  BEGIN
    _is_bootstrap := public.is_default_admin(_user_id);
  EXCEPTION WHEN undefined_function THEN
    _is_bootstrap := false;
  END;

  IF _is_bootstrap AND NOT _make THEN
    RAISE EXCEPTION 'CANNOT_REMOVE_DEFAULT_ADMIN';
  END IF;

  IF _user_id = auth.uid() AND NOT _make THEN
    RAISE EXCEPTION 'CANNOT_REMOVE_SELF';
  END IF;

  IF _make THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin';
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    auth.uid(),
    CASE WHEN _make THEN 'admin.added' ELSE 'admin.removed' END,
    'user_roles',
    _user_id,
    '{}'::jsonb
  );

  RETURN _make;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_admin(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_admin(uuid, boolean) TO authenticated, service_role;
