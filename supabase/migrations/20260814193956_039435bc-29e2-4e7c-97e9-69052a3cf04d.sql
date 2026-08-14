-- Restore Data API grants (PostgREST needs explicit privileges)

-- profiles
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- user_roles (read-only for users; writes via security definer functions)
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- analyses
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;

-- credit_transactions (read-only; inserts via functions)
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;

-- packages (public catalog)
GRANT SELECT ON public.packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;

-- payments
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- payment_settings
GRANT SELECT, UPDATE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

-- partner_applications
GRANT SELECT, INSERT, UPDATE ON public.partner_applications TO authenticated;
GRANT ALL ON public.partner_applications TO service_role;

-- partner_commissions (read-only)
GRANT SELECT ON public.partner_commissions TO authenticated;
GRANT ALL ON public.partner_commissions TO service_role;

-- audit_logs (read-only for admins)
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- admin_bootstrap_emails stays server-only
GRANT ALL ON public.admin_bootstrap_emails TO service_role;

-- Realtime for live analysis + credit updates
ALTER TABLE public.analyses REPLICA IDENTITY FULL;
ALTER TABLE public.credit_transactions REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.analyses;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transactions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
