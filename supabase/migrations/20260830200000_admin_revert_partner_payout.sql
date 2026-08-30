-- RPC to revert a partner payout record and roll back payout_cleared_at
CREATE OR REPLACE FUNCTION public.admin_revert_partner_payout(_payout_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _partner_id uuid;
  _amount numeric;
  _cleared_at timestamptz;
  _prev_cleared timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT partner_id, amount_ghs, cleared_at
    INTO _partner_id, _amount, _cleared_at
    FROM public.partner_payouts
   WHERE id = _payout_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAYOUT_NOT_FOUND';
  END IF;

  -- Remove this payout record
  DELETE FROM public.partner_payouts WHERE id = _payout_id;

  -- Find the most recent remaining payout timestamp for this partner (or NULL if none remaining)
  SELECT cleared_at
    INTO _prev_cleared
    FROM public.partner_payouts
   WHERE partner_id = _partner_id
   ORDER BY cleared_at DESC
   LIMIT 1;

  -- Roll back the partner's payout_cleared_at watermark
  UPDATE public.profiles
     SET payout_cleared_at = _prev_cleared,
         updated_at = now()
   WHERE id = _partner_id;

  -- Record audit log for the reversal
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    auth.uid(),
    'partner.payout_reverted',
    'partner_payouts',
    _payout_id,
    jsonb_build_object(
      'partner_id', _partner_id,
      'amount_ghs', _amount,
      'reverted_cleared_at', _cleared_at,
      'new_payout_cleared_at', _prev_cleared
    )
  );

  RETURN _prev_cleared;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_revert_partner_payout(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_revert_partner_payout(uuid) TO authenticated, service_role;
