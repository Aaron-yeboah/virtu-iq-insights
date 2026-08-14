CREATE OR REPLACE FUNCTION public.admin_explode_data()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _counts jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT jsonb_build_object(
    'analyses', (SELECT count(*) FROM public.analyses),
    'payments', (SELECT count(*) FROM public.payments),
    'commissions', (SELECT count(*) FROM public.partner_commissions),
    'applications', (SELECT count(*) FROM public.partner_applications)
  ) INTO _counts;

  DELETE FROM public.partner_commissions WHERE id IS NOT NULL;
  DELETE FROM public.credit_transactions WHERE id IS NOT NULL;
  DELETE FROM public.analyses WHERE id IS NOT NULL;
  DELETE FROM public.payments WHERE id IS NOT NULL;
  DELETE FROM public.partner_applications WHERE id IS NOT NULL;
  DELETE FROM public.audit_logs WHERE id IS NOT NULL;

  PERFORM set_config('app.credit_ctx', 'trusted', true);
  UPDATE public.profiles
     SET credits = 0,
         registration_paid = false,
         registration_paid_at = NULL,
         payout_cleared_at = now(),
         updated_at = now()
   WHERE id IS NOT NULL;
  PERFORM set_config('app.credit_ctx', '', true);

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), 'platform.exploded', 'platform', NULL, _counts);

  RETURN _counts;
END;
$function$;