-- Add admin_commission_rate to payment_settings
ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS admin_commission_rate numeric NOT NULL DEFAULT 25;
