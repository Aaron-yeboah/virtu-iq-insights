-- Server-side rate limit: max 7 payment submissions per user per hour.
-- This fires BEFORE INSERT on the payments table, so no client can bypass it.

CREATE OR REPLACE FUNCTION public.enforce_payment_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  -- Admins are exempt from the rate limit
  IF public.has_role(NEW.user_id, 'admin') THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
    INTO _count
    FROM public.payments
   WHERE user_id = NEW.user_id
     AND created_at > (now() - INTERVAL '1 hour');

  IF _count >= 7 THEN
    RAISE EXCEPTION 'RATE_LIMITED: You have submitted too many payments. Please wait before trying again.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if it already exists then re-create
DROP TRIGGER IF EXISTS trg_payment_rate_limit ON public.payments;

CREATE TRIGGER trg_payment_rate_limit
  BEFORE INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_payment_rate_limit();
