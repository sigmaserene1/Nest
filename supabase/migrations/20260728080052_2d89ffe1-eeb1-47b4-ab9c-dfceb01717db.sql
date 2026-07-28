DROP POLICY IF EXISTS "roommates insertable" ON public.roommates;
REVOKE INSERT ON public.roommates FROM anon, authenticated;
GRANT ALL ON public.roommates TO service_role;

DROP POLICY IF EXISTS "requests insertable" ON public.payment_requests;
REVOKE INSERT ON public.payment_requests FROM anon, authenticated;
GRANT ALL ON public.payment_requests TO service_role;