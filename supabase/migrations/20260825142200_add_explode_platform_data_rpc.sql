-- RPC function to allow verified admins to reset/explode platform data directly via database
CREATE OR REPLACE FUNCTION public.explode_platform_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _analyses_count integer;
  _payments_count integer;
  _commissions_count integer;
  _applications_count integer;
  _result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT count(*) INTO _commissions_count FROM public.partner_commissions;
  SELECT count(*) INTO _applications_count FROM public.partner_applications;
  SELECT count(*) INTO _analyses_count FROM public.analyses;
  SELECT count(*) INTO _payments_count FROM public.payments;

  DELETE FROM public.partner_commissions;
  DELETE FROM public.credit_transactions;
  DELETE FROM public.analyses;
  DELETE FROM public.payments;
  DELETE FROM public.partner_applications;
  DELETE FROM public.audit_logs;

  PERFORM set_config('app.credit_ctx', 'trusted', true);
  UPDATE public.profiles
     SET credits = 0,
         registration_paid = false,
         registration_paid_at = null,
         payout_cleared_at = now(),
         updated_at = now();
  PERFORM set_config('app.credit_ctx', '', true);

  _result := jsonb_build_object(
    'analyses', _analyses_count,
    'payments', _payments_count,
    'commissions', _commissions_count,
    'applications', _applications_count
  );

  INSERT INTO public.audit_logs (actor_id, action, entity, meta)
  VALUES (auth.uid(), 'platform.exploded', 'platform', _result);

  RETURN _result;
END;
$function$;

REVOKE ALL ON FUNCTION public.explode_platform_data() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.explode_platform_data() TO authenticated, service_role;
