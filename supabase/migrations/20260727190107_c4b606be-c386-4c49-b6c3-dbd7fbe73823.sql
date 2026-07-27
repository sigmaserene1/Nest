CREATE TABLE public.roommates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_wallet text NOT NULL,
  owner_name text,
  wallet text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_wallet, wallet)
);
CREATE INDEX roommates_owner_wallet_idx ON public.roommates (owner_wallet);
CREATE INDEX roommates_wallet_idx ON public.roommates (wallet);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roommates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roommates TO authenticated;
GRANT ALL ON public.roommates TO service_role;
ALTER TABLE public.roommates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roommates readable" ON public.roommates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "roommates insertable" ON public.roommates FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "roommates deletable" ON public.roommates FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_wallet text NOT NULL,
  from_name text,
  to_wallet text NOT NULL,
  to_name text,
  amount numeric(20,6) NOT NULL CHECK (amount > 0),
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','declined','cancelled')),
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payment_requests_to_idx ON public.payment_requests (to_wallet);
CREATE INDEX payment_requests_from_idx ON public.payment_requests (from_wallet);

GRANT SELECT, INSERT, UPDATE ON public.payment_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.payment_requests TO authenticated;
GRANT ALL ON public.payment_requests TO service_role;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests readable" ON public.payment_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "requests insertable" ON public.payment_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "requests updatable" ON public.payment_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.roommates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_requests;