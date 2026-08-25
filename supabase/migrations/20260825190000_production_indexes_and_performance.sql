-- ============================================================================
-- Production Performance & Scalability Indexing
-- ============================================================================

-- 1. Analyses: High-frequency lookups by user and descending timeline
CREATE INDEX IF NOT EXISTS idx_analyses_user_created 
  ON public.analyses (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analyses_status 
  ON public.analyses (status) 
  WHERE status IN ('processing', 'pending');

-- 2. Payments: High-frequency user history & admin review queues
CREATE INDEX IF NOT EXISTS idx_payments_user_status_created 
  ON public.payments (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_status_created 
  ON public.payments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_kind 
  ON public.payments (kind);

CREATE INDEX IF NOT EXISTS idx_payments_package_id 
  ON public.payments (package_id)
  WHERE package_id IS NOT NULL;

-- 3. Credit Transactions: Fast wallet ledger lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created 
  ON public.credit_transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_ref_id 
  ON public.credit_transactions (ref_id) 
  WHERE ref_id IS NOT NULL;

-- 4. Partner Commissions & Payouts: Partner Hub and Ledger lookups
CREATE INDEX IF NOT EXISTS idx_partner_commissions_partner_created 
  ON public.partner_commissions (partner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_commissions_referred_user 
  ON public.partner_commissions (referred_user_id);

CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner_cleared 
  ON public.partner_payouts (partner_id, cleared_at DESC);

-- 5. Partner Applications: Fast admin review lookup
CREATE INDEX IF NOT EXISTS idx_partner_applications_status_created 
  ON public.partner_applications (status, created_at DESC);

-- 6. Profiles: Fast referral tracking & code lookup
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code 
  ON public.profiles (referral_code);

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by 
  ON public.profiles (referred_by) 
  WHERE referred_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_registration_paid 
  ON public.profiles (registration_paid);

-- 7. Audit Logs: Fast admin security inspection
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created 
  ON public.audit_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
  ON public.audit_logs (entity, entity_id);
