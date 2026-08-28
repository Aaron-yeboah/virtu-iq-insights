-- =============================================================================
-- Migration: Set Developer & Admin Commission Rates to 15%
-- =============================================================================

UPDATE public.payment_settings
   SET developer_commission_rate = 15,
       admin_commission_rate = 15,
       updated_at = now()
 WHERE id = true;

ALTER TABLE public.payment_settings
  ALTER COLUMN developer_commission_rate SET DEFAULT 15,
  ALTER COLUMN admin_commission_rate SET DEFAULT 15;
