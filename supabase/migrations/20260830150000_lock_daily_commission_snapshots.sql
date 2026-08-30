-- Migration: Lock Daily Commission Snapshots
-- Creates daily_commission_snapshots table to record and lock commission percentages
-- for each day before it resets, preventing future commission setting changes
-- from retroactively mutating historical calendar earnings.

CREATE TABLE IF NOT EXISTS public.daily_commission_snapshots (
  date DATE PRIMARY KEY,
  developer_commission_rate NUMERIC NOT NULL DEFAULT 15,
  admin_commission_rate NUMERIC NOT NULL DEFAULT 15,
  default_partner_commission_rate NUMERIC NOT NULL DEFAULT 10,
  revenue_ghs NUMERIC NOT NULL DEFAULT 0,
  dev_commission_ghs NUMERIC NOT NULL DEFAULT 0,
  admin_commission_ghs NUMERIC NOT NULL DEFAULT 0,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_commission_snapshots TO authenticated;
GRANT ALL ON public.daily_commission_snapshots TO service_role;
ALTER TABLE public.daily_commission_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage daily commission snapshots" ON public.daily_commission_snapshots;
CREATE POLICY "Admins manage daily commission snapshots" ON public.daily_commission_snapshots
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Backfill initial snapshots for existing approved payments dates using payment_settings rates
INSERT INTO public.daily_commission_snapshots (
  date,
  developer_commission_rate,
  admin_commission_rate,
  default_partner_commission_rate,
  revenue_ghs,
  dev_commission_ghs,
  admin_commission_ghs,
  locked_at
)
SELECT 
  p.created_at::date AS d,
  COALESCE(s.developer_commission_rate, 15),
  COALESCE(s.admin_commission_rate, 15),
  COALESCE(s.default_partner_commission_rate, 10),
  COALESCE(sum(p.amount_ghs), 0),
  round(COALESCE(sum(p.amount_ghs), 0) * (COALESCE(s.developer_commission_rate, 15) / 100.0), 2),
  round(COALESCE(sum(p.amount_ghs), 0) * (COALESCE(s.admin_commission_rate, 15) / 100.0), 2),
  now()
FROM public.payments p
CROSS JOIN (SELECT developer_commission_rate, admin_commission_rate, default_partner_commission_rate FROM public.payment_settings LIMIT 1) s
WHERE p.status = 'approved' AND p.created_at IS NOT NULL
GROUP BY p.created_at::date, s.developer_commission_rate, s.admin_commission_rate, s.default_partner_commission_rate
ON CONFLICT (date) DO NOTHING;

-- RPC for Admin Console to retrieve all daily commission snapshots with locked status
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

  -- 1. Ensure a snapshot exists for today with current live settings
  INSERT INTO public.daily_commission_snapshots (
    date,
    developer_commission_rate,
    admin_commission_rate,
    default_partner_commission_rate,
    revenue_ghs,
    dev_commission_ghs,
    admin_commission_ghs,
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

  -- 2. Ensure any past days that had approved payments have snapshots locked
  INSERT INTO public.daily_commission_snapshots (
    date,
    developer_commission_rate,
    admin_commission_rate,
    default_partner_commission_rate,
    revenue_ghs,
    dev_commission_ghs,
    admin_commission_ghs,
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
    now()
  FROM public.payments p
  WHERE p.status = 'approved' AND p.created_at IS NOT NULL AND p.created_at::date < CURRENT_DATE
  GROUP BY p.created_at::date
  ON CONFLICT (date) DO NOTHING; -- Preserves locked past rates!

  -- 3. Return all daily snapshots
  RETURN QUERY
  SELECT 
    dcs.date,
    dcs.developer_commission_rate,
    dcs.admin_commission_rate,
    dcs.default_partner_commission_rate,
    dcs.revenue_ghs,
    dcs.dev_commission_ghs,
    dcs.admin_commission_ghs,
    (dcs.date < CURRENT_DATE) AS is_locked
  FROM public.daily_commission_snapshots dcs
  ORDER BY dcs.date DESC;
END;
$$;
