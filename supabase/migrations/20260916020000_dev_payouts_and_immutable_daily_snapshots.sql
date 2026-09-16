-- Migration: Dev Payouts History and Immutable Daily Revenue Snapshots
-- 1. Creates dev_payouts table to track developer commission payouts and history.
-- 2. Adds dev_payout_cleared_at timestamp to payment_settings.
-- 3. Adds RPCs admin_clear_dev_payout, admin_revert_dev_payout, and admin_dev_commission_summary.
-- 4. Enforces immutable locking on past daily_commission_snapshots calendar entries.

-- Step 1: Create dev_payouts table
CREATE TABLE IF NOT EXISTS public.dev_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount_ghs numeric NOT NULL,
  cleared_at timestamptz NOT NULL DEFAULT now(),
  cleared_by uuid REFERENCES public.profiles(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.dev_payouts TO authenticated;
GRANT ALL ON public.dev_payouts TO service_role;
ALTER TABLE public.dev_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage dev payouts" ON public.dev_payouts;
CREATE POLICY "Admins manage dev payouts" ON public.dev_payouts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 2: Add dev_payout_cleared_at column to payment_settings
ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS dev_payout_cleared_at timestamptz;

-- Step 3: RPC to summarize Developer Commission (Unpaid accumulated balance, Lifetime earned, Total paid, Last cleared at)
CREATE OR REPLACE FUNCTION public.admin_dev_commission_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _dev_rate numeric;
  _last_cleared timestamptz;
  _unpaid_comm numeric := 0;
  _lifetime_comm numeric := 0;
  _total_paid numeric := 0;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  -- Get current settings & last cleared timestamp
  SELECT COALESCE(developer_commission_rate, 15), dev_payout_cleared_at
    INTO _dev_rate, _last_cleared
    FROM public.payment_settings
   LIMIT 1;

  -- Calculate unpaid developer commission since last clearance
  SELECT round(COALESCE(sum(p.amount_ghs * (COALESCE(dcs.developer_commission_rate, _dev_rate) / 100.0)), 0), 2)
    INTO _unpaid_comm
    FROM public.payments p
    LEFT JOIN public.daily_commission_snapshots dcs ON dcs.date = p.created_at::date
   WHERE p.status = 'approved'
     AND (_last_cleared IS NULL OR p.created_at > _last_cleared);

  -- Calculate lifetime developer commission earned across all time
  SELECT round(COALESCE(sum(p.amount_ghs * (COALESCE(dcs.developer_commission_rate, _dev_rate) / 100.0)), 0), 2)
    INTO _lifetime_comm
    FROM public.payments p
    LEFT JOIN public.daily_commission_snapshots dcs ON dcs.date = p.created_at::date
   WHERE p.status = 'approved';

  -- Calculate total developer payouts disbursed to date
  SELECT COALESCE(sum(amount_ghs), 0)
    INTO _total_paid
    FROM public.dev_payouts;

  RETURN jsonb_build_object(
    'unpaid_dev_commission_ghs', _unpaid_comm,
    'lifetime_dev_commission_ghs', _lifetime_comm,
    'total_paid_dev_commission_ghs', _total_paid,
    'last_cleared_at', _last_cleared
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dev_commission_summary() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_dev_commission_summary() TO authenticated, service_role;

-- Step 4: RPC to confirm and clear Developer Payout
CREATE OR REPLACE FUNCTION public.admin_clear_dev_payout(_note text DEFAULT NULL::text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _t timestamptz := now();
  _dev_rate numeric;
  _last_cleared timestamptz;
  _unpaid_comm numeric := 0;
  _payout_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT COALESCE(developer_commission_rate, 15), dev_payout_cleared_at
    INTO _dev_rate, _last_cleared
    FROM public.payment_settings
   LIMIT 1;

  -- Calculate current accumulated unpaid dev commission
  SELECT round(COALESCE(sum(p.amount_ghs * (COALESCE(dcs.developer_commission_rate, _dev_rate) / 100.0)), 0), 2)
    INTO _unpaid_comm
    FROM public.payments p
    LEFT JOIN public.daily_commission_snapshots dcs ON dcs.date = p.created_at::date
   WHERE p.status = 'approved'
     AND (_last_cleared IS NULL OR p.created_at > _last_cleared);

  IF _unpaid_comm > 0 THEN
    INSERT INTO public.dev_payouts (amount_ghs, cleared_at, cleared_by, note)
    VALUES (_unpaid_comm, _t, auth.uid(), _note)
    RETURNING id INTO _payout_id;
  END IF;

  -- Record cleared timestamp in payment_settings
  UPDATE public.payment_settings
     SET dev_payout_cleared_at = _t,
         updated_at = now();

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), 'dev.payout_cleared', 'payment_settings', _payout_id,
          jsonb_build_object('amount_ghs', _unpaid_comm, 'cleared_at', _t, 'note', _note));

  RETURN _t;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_clear_dev_payout(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_clear_dev_payout(text) TO authenticated, service_role;

-- Step 5: RPC to revert a mistakenly recorded Developer Payout
CREATE OR REPLACE FUNCTION public.admin_revert_dev_payout(_payout_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _reverted_amount numeric;
  _prev_cleared_at timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT amount_ghs INTO _reverted_amount
    FROM public.dev_payouts
   WHERE id = _payout_id;

  IF _reverted_amount IS NULL THEN
    RAISE EXCEPTION 'PAYOUT_NOT_FOUND';
  END IF;

  -- Delete the payout record
  DELETE FROM public.dev_payouts WHERE id = _payout_id;

  -- Find the most recent remaining payout timestamp (or NULL if none remain)
  SELECT max(cleared_at) INTO _prev_cleared_at FROM public.dev_payouts;

  -- Restore payment_settings cleared timestamp
  UPDATE public.payment_settings
     SET dev_payout_cleared_at = _prev_cleared_at,
         updated_at = now();

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (auth.uid(), 'dev.payout_reverted', 'dev_payouts', _payout_id,
          jsonb_build_object('reverted_amount_ghs', _reverted_amount, 'new_cleared_at', _prev_cleared_at));

  RETURN _prev_cleared_at;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_revert_dev_payout(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_revert_dev_payout(uuid) TO authenticated, service_role;

-- Step 6: Ensure daily_commission_snapshots has is_locked flag and immutability trigger
ALTER TABLE public.daily_commission_snapshots
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

-- Trigger function to prevent mutation of locked historical daily revenue snapshots
CREATE OR REPLACE FUNCTION public.prevent_locked_daily_snapshot_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (OLD.date < CURRENT_DATE OR OLD.is_locked = true) THEN
    -- Allow updating locked status explicitly if needed, but block mutating historical rates/revenue
    IF (NEW.revenue_ghs <> OLD.revenue_ghs OR NEW.developer_commission_rate <> OLD.developer_commission_rate OR NEW.admin_commission_rate <> OLD.admin_commission_rate) THEN
      RAISE EXCEPTION 'CANNOT_MUTATE_LOCKED_DAILY_SNAPSHOT';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_locked_daily_snapshot_mutation ON public.daily_commission_snapshots;
CREATE TRIGGER trg_prevent_locked_daily_snapshot_mutation
  BEFORE UPDATE OR DELETE ON public.daily_commission_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_locked_daily_snapshot_mutation();

-- Update admin_daily_commission_snapshots RPC to ensure locking for past dates
CREATE OR REPLACE FUNCTION public.admin_daily_commission_snapshots()
RETURNS TABLE (
  date date,
  developer_commission_rate numeric,
  admin_commission_rate numeric,
  default_partner_commission_rate numeric,
  revenue_ghs numeric,
  dev_commission_ghs numeric,
  admin_commission_ghs numeric,
  is_locked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _dev_rate numeric;
  _admin_rate numeric;
  _partner_rate numeric;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'FORBIDDEN'; END IF;

  SELECT 
    COALESCE(developer_commission_rate, 15),
    COALESCE(admin_commission_rate, 15),
    COALESCE(default_partner_commission_rate, 10)
  INTO _dev_rate, _admin_rate, _partner_rate
  FROM public.payment_settings
  LIMIT 1;

  -- 1. Upsert snapshot for TODAY (live calculation)
  INSERT INTO public.daily_commission_snapshots (
    date,
    developer_commission_rate,
    admin_commission_rate,
    default_partner_commission_rate,
    revenue_ghs,
    dev_commission_ghs,
    admin_commission_ghs,
    is_locked,
    locked_at
  )
  SELECT 
    CURRENT_DATE,
    _dev_rate,
    _admin_rate,
    _partner_rate,
    COALESCE(sum(p.amount_ghs), 0),
    round(COALESCE(sum(p.amount_ghs), 0) * (_dev_rate / 100.0), 2),
    round(COALESCE(sum(p.amount_ghs), 0) * (_admin_rate / 100.0), 2),
    false,
    now()
  FROM public.payments p
  WHERE p.status = 'approved' AND p.created_at::date = CURRENT_DATE
  ON CONFLICT (date) DO UPDATE
    SET developer_commission_rate = _dev_rate,
        admin_commission_rate = _admin_rate,
        default_partner_commission_rate = _partner_rate,
        revenue_ghs = (SELECT COALESCE(sum(p2.amount_ghs), 0) FROM public.payments p2 WHERE p2.status = 'approved' AND p2.created_at::date = CURRENT_DATE),
        dev_commission_ghs = round((SELECT COALESCE(sum(p2.amount_ghs), 0) FROM public.payments p2 WHERE p2.status = 'approved' AND p2.created_at::date = CURRENT_DATE) * (_dev_rate / 100.0), 2),
        admin_commission_ghs = round((SELECT COALESCE(sum(p2.amount_ghs), 0) FROM public.payments p2 WHERE p2.status = 'approved' AND p2.created_at::date = CURRENT_DATE) * (_admin_rate / 100.0), 2),
        updated_at = now();

  -- 2. Lock past dates with approved payments if not already snapshotted
  INSERT INTO public.daily_commission_snapshots (
    date,
    developer_commission_rate,
    admin_commission_rate,
    default_partner_commission_rate,
    revenue_ghs,
    dev_commission_ghs,
    admin_commission_ghs,
    is_locked,
    locked_at
  )
  SELECT 
    p.created_at::date AS d,
    _dev_rate,
    _admin_rate,
    _partner_rate,
    COALESCE(sum(p.amount_ghs), 0),
    round(COALESCE(sum(p.amount_ghs), 0) * (_dev_rate / 100.0), 2),
    round(COALESCE(sum(p.amount_ghs), 0) * (_admin_rate / 100.0), 2),
    true,
    now()
  FROM public.payments p
  WHERE p.status = 'approved' AND p.created_at IS NOT NULL AND p.created_at::date < CURRENT_DATE
  GROUP BY p.created_at::date
  ON CONFLICT (date) DO NOTHING;

  -- Mark all past date snapshots as locked
  UPDATE public.daily_commission_snapshots
     SET is_locked = true
   WHERE date < CURRENT_DATE AND is_locked = false;

  -- 3. Return all snapshots ordered by date descending
  RETURN QUERY
  SELECT 
    dcs.date,
    dcs.developer_commission_rate,
    dcs.admin_commission_rate,
    dcs.default_partner_commission_rate,
    dcs.revenue_ghs,
    dcs.dev_commission_ghs,
    dcs.admin_commission_ghs,
    (dcs.date < CURRENT_DATE OR dcs.is_locked = true) AS is_locked
  FROM public.daily_commission_snapshots dcs
  ORDER BY dcs.date DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_daily_commission_snapshots() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_daily_commission_snapshots() TO authenticated, service_role;
