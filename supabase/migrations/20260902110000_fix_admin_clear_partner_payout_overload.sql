-- Drop old 1-argument overloaded function signature to resolve candidate function ambiguity
DROP FUNCTION IF EXISTS public.admin_clear_partner_payout(uuid);

-- Re-create single canonical function signature with _note default parameter
CREATE OR REPLACE FUNCTION public.admin_clear_partner_payout(_user_id uuid, _note text DEFAULT NULL::text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t timestamptz := now();
  _rate numeric;
  _unpaid_rev numeric;
  _unpaid_comm numeric;
  _last_cleared timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT COALESCE(commission_rate, 10), payout_cleared_at
    INTO _rate, _last_cleared
    FROM public.profiles
   WHERE id = _user_id;

  SELECT COALESCE(sum(pay.amount_ghs), 0)
    INTO _unpaid_rev
    FROM public.profiles r
    JOIN public.payments pay ON pay.user_id = r.id
   WHERE r.referred_by = _user_id AND pay.status = 'approved'
     AND (_last_cleared IS NULL OR pay.created_at > _last_cleared);

  _unpaid_comm := round(_unpaid_rev * (_rate / 100.0), 2);

  IF _unpaid_comm > 0 THEN
    INSERT INTO public.partner_payouts (partner_id, amount_ghs, cleared_at, cleared_by, note)
    VALUES (_user_id, _unpaid_comm, _t, auth.uid(), _note);
  END IF;

  UPDATE public.profiles SET payout_cleared_at = _t, updated_at = now() WHERE id = _user_id;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), 'partner.payout_cleared', 'profiles', _user_id,
          jsonb_build_object('amount_ghs', _unpaid_comm, 'cleared_at', _t, 'note', _note));

  RETURN _t;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_clear_partner_payout(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_clear_partner_payout(uuid, text) TO authenticated, service_role;
