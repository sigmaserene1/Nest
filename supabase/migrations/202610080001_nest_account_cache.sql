create table if not exists public.nest_account_cache (
  account_wallet text not null,
  scope text not null check (scope in ('testnet', 'mainnet', 'global')),
  snapshot jsonb,
  bridge_history jsonb not null default '[]'::jsonb,
  receipt_history jsonb not null default '[]'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  agent_config jsonb,
  agent_runs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (account_wallet, scope)
);

alter table public.nest_account_cache enable row level security;

-- There are intentionally no public RLS policies. Nest reads/writes this
-- table only from server functions after validating a short-lived Circle
-- user token and resolving the wallet address server-side. The Supabase
-- service-role key must never be exposed to the browser.

create index if not exists nest_account_cache_updated_at_idx
  on public.nest_account_cache (updated_at desc);
