CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash text NOT NULL UNIQUE,
  from_wallet text NOT NULL,
  to_wallet text NOT NULL,
  to_name text,
  amount numeric NOT NULL,
  mode text NOT NULL DEFAULT 'send',
  note text,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.transactions TO anon, authenticated;
GRANT ALL ON public.transactions TO service_role;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions readable" ON public.transactions FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX transactions_from_wallet_idx ON public.transactions (from_wallet);
CREATE INDEX transactions_to_wallet_idx ON public.transactions (to_wallet);
CREATE INDEX transactions_created_at_idx ON public.transactions (created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;