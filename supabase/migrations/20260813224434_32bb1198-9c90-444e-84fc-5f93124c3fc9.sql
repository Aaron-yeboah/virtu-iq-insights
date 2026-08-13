REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.protect_profile_credits() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.spend_credits(INTEGER, TEXT, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.refund_credits(INTEGER, TEXT, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.review_payment(UUID, BOOLEAN, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.review_partner_application(UUID, BOOLEAN, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.admin_stats() FROM anon;