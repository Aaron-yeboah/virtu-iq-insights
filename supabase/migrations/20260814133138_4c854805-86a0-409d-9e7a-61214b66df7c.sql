CREATE OR REPLACE FUNCTION public.admin_explode_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _counts jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT jsonb_build_object(
    'analyses', (SELECT count(*) FROM public.analyses),
    'payments', (SELECT count(*) FROM public.payments),
    'commissions', (SELECT count(*) FROM public.partner_commissions),
    'applications', (SELECT count(*) FROM public.partner_applications)
  ) INTO _counts;

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
         registration_paid_at = NULL,
         payout_cleared_at = now(),
         updated_at = now();
  PERFORM set_config('app.credit_ctx', '', true);

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), 'platform.exploded', 'platform', NULL, _counts);

  RETURN _counts;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_explode_data() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_explode_data() TO authenticated;