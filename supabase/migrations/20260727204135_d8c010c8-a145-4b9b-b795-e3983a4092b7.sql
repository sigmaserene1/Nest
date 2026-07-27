CREATE TABLE public.profiles (
  wallet TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT GENERATED ALWAYS AS (lower(btrim(name))) STORED UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles readable" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles claimable once" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (true);