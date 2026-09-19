DROP POLICY IF EXISTS "roommates readable" ON public.roommates;
DROP POLICY IF EXISTS "requests readable" ON public.payment_requests;
DROP POLICY IF EXISTS "profiles readable" ON public.profiles;
DROP POLICY IF EXISTS "transactions readable" ON public.transactions;

CREATE POLICY "roommates owner read" ON public.roommates
  FOR SELECT TO authenticated
  USING (owner_wallet = (auth.jwt() ->> 'wallet') OR wallet = (auth.jwt() ->> 'wallet'));

CREATE POLICY "requests party read" ON public.payment_requests
  FOR SELECT TO authenticated
  USING (from_wallet = (auth.jwt() ->> 'wallet') OR to_wallet = (auth.jwt() ->> 'wallet'));

CREATE POLICY "profiles self read" ON public.profiles
  FOR SELECT TO authenticated
  USING (wallet = (auth.jwt() ->> 'wallet'));

CREATE POLICY "transactions party read" ON public.transactions
  FOR SELECT TO authenticated
  USING (from_wallet = (auth.jwt() ->> 'wallet') OR to_wallet = (auth.jwt() ->> 'wallet'));