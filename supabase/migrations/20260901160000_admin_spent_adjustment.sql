-- Function to adjust a member's total spent amount by recording an approved payment adjustment entry
CREATE OR REPLACE FUNCTION public.admin_adjust_member_spent(
  _user_id uuid,
  _reduce_by numeric DEFAULT NULL,
  _set_total_spent numeric DEFAULT NULL,
  _reason text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _approved_sum numeric := 0;
  _delta numeric := 0;
  _final_spent numeric := 0;
  _ref text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT COALESCE(sum(amount_ghs), 0) INTO _approved_sum
    FROM public.payments
   WHERE user_id = _user_id AND status = 'approved';

  IF _set_total_spent IS NOT NULL THEN
    _delta := _set_total_spent - _approved_sum;
  ELSIF _reduce_by IS NOT NULL THEN
    _delta := - abs(_reduce_by);
  ELSE
    RAISE EXCEPTION 'INVALID_ARGUMENTS';
  END IF;

  IF _delta <> 0 THEN
    _ref := 'ADJ-' || upper(to_hex(extract(epoch from now())::bigint));
    INSERT INTO public.payments (user_id, amount_ghs, credits, method, reference, status, admin_note, reviewed_by, reviewed_at)
    VALUES (_user_id, _delta, 0, 'Admin Adjustment', _ref, 'approved', COALESCE(NULLIF(_reason,''), 'Admin spent reduction/adjustment'), auth.uid(), now());
  END IF;

  _final_spent := GREATEST(0, _approved_sum + _delta);

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    auth.uid(),
    'member.spent_adjusted',
    'profiles',
    _user_id,
    jsonb_build_object(
      'previous_spent', _approved_sum,
      'adjustment_delta', _delta,
      'final_spent', _final_spent,
      'reason', _reason
    )
  );

  RETURN _final_spent;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_member_spent(uuid, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_member_spent(uuid, numeric, numeric, text) TO authenticated, service_role;
