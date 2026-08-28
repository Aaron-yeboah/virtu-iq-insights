-- =============================================================================
-- Security Patch: Fix Point 1 (Free Credit RPC Exploit) & Point 2 (Phone Scraping)
-- =============================================================================

-- 1. Tighten refund_credits: Require verified admin OR valid unrefunded transaction ref
CREATE OR REPLACE FUNCTION public.refund_credits(_amount integer, _reason text, _ref_id uuid DEFAULT NULL::uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid;
  _is_admin boolean := false;
  _remaining integer;
  _spent_amount integer := 0;
  _already_refunded integer := 0;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _amount IS NULL OR _amount < 1 OR _amount > 100 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  _is_admin := public.has_role(_caller, 'admin');

  -- If caller is NOT an admin, enforce strict debit verification
  IF NOT _is_admin THEN
    -- A valid ref_id pointing to an actual debit transaction is strictly mandatory
    IF _ref_id IS NULL THEN
      RAISE EXCEPTION 'UNAUTHORIZED_REFUND: Reference ID is required';
    END IF;

    -- Verify how much was actually debited for this ref_id
    SELECT COALESCE(SUM(ABS(delta)), 0)
      INTO _spent_amount
      FROM public.credit_transactions
     WHERE user_id = _caller
       AND ref_id = _ref_id
       AND delta < 0;

    IF _spent_amount < 1 THEN
      RAISE EXCEPTION 'UNAUTHORIZED_REFUND: No debited credits found for reference ID';
    END IF;

    -- Verify that it hasn''t already been refunded
    SELECT COALESCE(SUM(delta), 0)
      INTO _already_refunded
      FROM public.credit_transactions
     WHERE user_id = _caller
       AND ref_id = _ref_id
       AND delta > 0;

    IF (_already_refunded + _amount) > _spent_amount THEN
      RAISE EXCEPTION 'UNAUTHORIZED_REFUND: Refund amount exceeds debited credits';
    END IF;
  END IF;

  -- Proceed with trusted credit refund
  PERFORM set_config('app.credit_ctx', 'trusted', true);
  UPDATE public.profiles
     SET credits = credits + _amount, updated_at = now()
   WHERE id = _caller
  RETURNING credits INTO _remaining;
  PERFORM set_config('app.credit_ctx', '', true);

  INSERT INTO public.credit_transactions (user_id, delta, reason, ref_id)
  VALUES (_caller, _amount, _reason, _ref_id);

  RETURN _remaining;
END;
$$;

-- Revoke execute from anon and public; grant only to authenticated and service_role
REVOKE ALL ON FUNCTION public.refund_credits(integer, text, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.refund_credits(integer, text, uuid) TO authenticated, service_role;


-- 2. Secure resolve_phone_email: Revoke execute from anon and public to prevent user enumeration
REVOKE ALL ON FUNCTION public.resolve_phone_email(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.resolve_phone_email(text) TO authenticated, service_role;
