-- Allow all verified admins to add or remove admin roles for other users
CREATE OR REPLACE FUNCTION public.admin_set_admin(_user_id uuid, _make boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN
    RAISE EXCEPTION 'NOT_FOUND';
  END IF;

  -- Prevent removing the default bootstrap admin
  IF public.is_default_admin(_user_id) AND NOT _make THEN
    RAISE EXCEPTION 'CANNOT_REMOVE_DEFAULT_ADMIN';
  END IF;

  -- Prevent an admin from accidentally removing their own admin role
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
