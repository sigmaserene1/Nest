-- payment_requests: remove unrestricted UPDATE
DROP POLICY IF EXISTS "requests updatable" ON public.payment_requests;
REVOKE UPDATE ON public.payment_requests FROM anon, authenticated;
GRANT ALL ON public.payment_requests TO service_role;

-- profiles: remove unrestricted INSERT (claims now go through signature-verified server action)
DROP POLICY IF EXISTS "profiles claimable once" ON public.profiles;
REVOKE INSERT ON public.profiles FROM anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

-- roommates: remove unrestricted DELETE
DROP POLICY IF EXISTS "roommates deletable" ON public.roommates;
REVOKE DELETE ON public.roommates FROM anon, authenticated;
GRANT ALL ON public.roommates TO service_role;