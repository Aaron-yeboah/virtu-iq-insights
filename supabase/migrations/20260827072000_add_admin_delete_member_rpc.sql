-- RPC function to delete a member completely and safely by verified admins
CREATE OR REPLACE FUNCTION public.admin_delete_member(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _profile_email text;
  _is_bootstrap boolean := false;
BEGIN
  -- Verify caller has admin role
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  -- Disallow removing oneself
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'CANNOT_REMOVE_SELF';
  END IF;

  -- Lookup email for audit log
  SELECT email INTO _profile_email FROM public.profiles WHERE id = _user_id;
  IF _profile_email IS NULL THEN
    SELECT email INTO _profile_email FROM auth.users WHERE id = _user_id;
  END IF;

  -- Protect bootstrap default admin safely
  BEGIN
    _is_bootstrap := public.is_default_admin(_user_id);
  EXCEPTION WHEN undefined_function THEN
    _is_bootstrap := false;
  END;

  IF _is_bootstrap THEN
    RAISE EXCEPTION 'CANNOT_REMOVE_DEFAULT_ADMIN';
  END IF;

  -- Delete all related records cleanly
  DELETE FROM public.credit_transactions WHERE user_id = _user_id;
  DELETE FROM public.analyses WHERE user_id = _user_id;
  DELETE FROM public.payments WHERE user_id = _user_id;
  DELETE FROM public.partner_applications WHERE user_id = _user_id;
  DELETE FROM public.partner_commissions WHERE partner_id = _user_id OR referred_user_id = _user_id;
  
  -- Handle partner_payouts if table exists
  BEGIN
    DELETE FROM public.partner_payouts WHERE partner_id = _user_id;
  EXCEPTION WHEN undefined_table THEN
    -- table does not exist yet
  END;

  DELETE FROM public.user_roles WHERE user_id = _user_id;

  -- Clear referred_by pointers
  UPDATE public.profiles SET referred_by = NULL WHERE referred_by = _user_id;

  -- Delete profile record
  DELETE FROM public.profiles WHERE id = _user_id;

  -- Delete auth user
  DELETE FROM auth.users WHERE id = _user_id;

  -- Write audit log entry
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    auth.uid(),
    'member.removed',
    'profiles',
    _user_id,
    jsonb_build_object('email', _profile_email)
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_member(uuid) TO authenticated, service_role;
