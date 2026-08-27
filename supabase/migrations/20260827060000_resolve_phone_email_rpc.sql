-- SECURITY DEFINER RPC function to resolve account email by phone number
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
