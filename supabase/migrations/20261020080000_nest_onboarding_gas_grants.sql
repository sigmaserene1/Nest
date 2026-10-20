-- One-time, testnet-only Nest onboarding gas grants.
-- This is an administrative anti-abuse ledger, not storage of app/workspace
-- state. A uniqueness constraint prevents parallel requests from paying twice.
create table if not exists public.nest_onboarding_gas_grants (
  privy_user_id text primary key,
  wallet_address text not null unique,
  amount_usdc text not null,
  status text not null default 'reserved'
    check (status in ('reserved', 'sent')),
  tx_hash text unique,
  created_at timestamptz not null default now()
);

alter table public.nest_onboarding_gas_grants enable row level security;

-- The table is accessed only with the server's service-role client; users may
-- not read or write claims directly, even if they know their Privy user ID.
revoke all on public.nest_onboarding_gas_grants from anon, authenticated;
grant select, insert, update on public.nest_onboarding_gas_grants to service_role;
