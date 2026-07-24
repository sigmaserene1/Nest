## Nest — shared household expenses, settled in USDC on Arc

A premium consumer web app for roommates and shared households to track expenses and settle up with real onchain USDC payments on Arc. Splitwise simplicity, real settlement, zero crypto jargon in the UI. Branded as **Nest**, with a subtle "Built on Arc" badge.

### Product surface (all v1)

1. **Landing** — hero, how it works, testimonial-style block, CTA. White bg, red accents, "Built on Arc" badge in footer.
2. **Auth** — Email/password + Google (Lovable Cloud).
3. **Onboarding** — create your first Home, or join via invite code.
4. **Home Dashboard** — total household balance, "You owe / You are owed", quick add-expense CTA, recent activity, upcoming recurring bills.
5. **Members** — invite by email or share code, roles (admin / member), remove/leave home, wallet address per member.
6. **Expenses** — list + filters (category, member, month). Add expense flow: amount, payer, split type (equal / by shares / exact amounts / percentages), category (Rent, Groceries, Electricity, Internet, Other), notes, receipt image upload.
7. **Activity Feed** — chronological stream: expenses added/edited, settlements, member joins, comments.
8. **Balances / Settle Up** — simplified debt graph ("Alex owes you $42.30"). One-click **Settle Up** flow:
   - Shows recipient + amount in USDC.
   - Wallet Connect if not connected.
   - Sends USDC on Arc testnet.
   - Live transaction status (pending → confirmed with Arc's sub-second finality).
   - Wallet balance refreshes automatically after confirmation.
   - Onchain tx hash + Arc explorer link stored as proof.
9. **Transaction History** — every onchain settlement with hash, from, to, amount, status, timestamp, Arc explorer link.
10. **Monthly Analytics** — spend by category (donut), spend over time (line), top spenders, month-over-month comparison, per-member share.
11. **Settings** — profile, connected wallet, notification prefs, leave/delete home.

### Design direction (locked)
- Premium consumer product feel — think Linear × Notion × Cash App, not a crypto dashboard.
- Palette: **white background**, **subtle gray cards** (`#F7F7F8` / `#EEEEF0` borders), **bold red `#E41E26`** for primary CTAs, active states, and brand marks.
- Typography: clean modern sans (Inter or similar), tight tracking on headlines, generous whitespace.
- Rounded corners (12–16px), soft shadows, subtle motion on state changes.
- Fully responsive: mobile-first for the app views, desktop-optimized dashboard.
- Small "Built on Arc" badge (monochrome) in footer, settle-up screen, and transaction history — never dominant.
- No gradients, no neon, no Web3 tropes.

### Technical approach
```text
Framework:  TanStack Start (already scaffolded)
Styling:    Tailwind v4 tokens in src/styles.css
              --color-brand: #E41E26
              --color-surface, --color-surface-muted, --color-border
UI:         shadcn components restyled to Nest tokens
Backend:    Lovable Cloud
  ├─ auth (email/password + Google)
  ├─ tables: profiles, homes, home_members (role), expenses, expense_splits,
             settlements, activity_events
  ├─ RLS scoped by home membership via has_home_membership() SECURITY DEFINER
  └─ user_roles table pattern for home admin role (never on profiles)
Wallet:     wagmi + viem + RainbowKit configured for Arc testnet + USDC
Onchain:    settle-up flow = ERC-20 transfer of USDC to recipient's wallet on Arc
              tx hash + status stored on the settlement row
              balance re-read via wagmi useBalance after confirmation
Charts:     Recharts for monthly analytics (donut + line)
Server fns: createServerFn for all writes (expenses, settlements),
            requireSupabaseAuth middleware, homes gated by membership
```

### Data model (concise)
```text
profiles(user_id, display_name, avatar_url, wallet_address)
homes(id, name, created_by, created_at)
home_members(home_id, user_id, role: 'admin'|'member', joined_at)  -- PK (home_id, user_id)
expenses(id, home_id, payer_id, amount_cents, currency, category, description, receipt_url, occurred_at, created_by, created_at)
expense_splits(expense_id, user_id, share_cents)  -- who owes what for this expense
settlements(id, home_id, from_user, to_user, amount_cents, tx_hash, tx_status, chain_id, created_at)
activity_events(id, home_id, actor_id, kind, payload_json, created_at)
```
Balance = sum(splits owed to you) − sum(splits you owe) − sum(settlements you paid) + sum(settlements paid to you), computed in a SQL view.

### Build order
1. Design tokens + shadcn restyle to Nest palette. Landing page.
2. Auth + onboarding + Home Dashboard shell.
3. Expenses CRUD + splits + Activity Feed.
4. Balance computation + simplified debt graph.
5. Wallet Connect + Arc testnet chain config + USDC settle-up flow + tx history.
6. Monthly Analytics.
7. Members management + settings.
8. Polish pass: motion, empty states, error states, mobile responsiveness, "Built on Arc" badges.

### Notes
- All settle-up transactions are real onchain USDC transfers on Arc testnet. No custody, no escrow — Nest orchestrates the transfer from the payer's own wallet.
- Wallet address is optional at signup; required only when a user wants to settle up. Users can still track expenses without a wallet.
- Every state (loading, empty, error, success) gets a designed treatment — no default shadcn placeholders shipped.
