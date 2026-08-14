CREATE TABLE IF NOT EXISTS public.payment_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  momo_number text NOT NULL DEFAULT '',
  recipient_name text NOT NULL DEFAULT '',
  network text NOT NULL DEFAULT 'MTN MoMo',
  instructions text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_settings TO authenticated;
GRANT UPDATE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed in users read payment settings" ON public.payment_settings;
CREATE POLICY "Signed in users read payment settings" ON public.payment_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins update payment settings" ON public.payment_settings;
CREATE POLICY "Admins update payment settings" ON public.payment_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.payment_settings (id, momo_number, recipient_name, network, instructions)
VALUES (true, '0551234567', 'Virtu-IQ Ghana', 'MTN MoMo', 'Send the exact package amount, then submit your MoMo name and reference for approval.')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS sender_name text;