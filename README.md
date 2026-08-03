# Nest — shared living, effortlessly settled on Arc

Nest is a consumer-grade shared-household expense app built entirely on **Arc Testnet**.
Roommates create a home, add expenses, split them, and settle in **USDC** — every room,
member, expense, share and settlement lives onchain in the `ExpenseManager` contract, so
everyone in a home sees exactly the same state from any device or wallet.

## Features

- **Wallet-only sign in** — RainbowKit + wagmi, no email or password anywhere.
- **Onchain homes** — create a home or join one via an opaque invite link; contract
  addresses and room IDs are never exposed to users.
- **Expenses & splits** — record an expense, pick participants, shares are computed with
  USDC 6-decimal precision and stored onchain.
- **One-tap settle** — pays the exact outstanding amount in USDC and marks the share
  settled onchain in the same flow; "Settle all" runs debts sequentially.
- **Send / Request / Split / Scan** — a single action modal maps each intent to a real
  contract call, with an EIP-681 QR code for scan-to-pay.
- **Live activity feed** — read straight from the contract's activity log.
- **Permanent identity** — a display name is claimed once and permanently bound to a wallet.
- **Insights** — category breakdowns and balances derived from onchain expenses.

## Smart contract architecture

`contracts/ExpenseManager.sol` (deployed at `0x709cbad88162b999882788155cde79ade46a6d42`
on Arc Testnet, chain ID `5042002`):

| Area | Functions |
| --- | --- |
| Rooms | `createRoom`, `joinRoom`, `getRooms`, `getRoomMembers` |
| Members | `inviteMember`, `setDisplayName`, `getDisplayNames` |
| Expenses | `addExpense`, `getExpenses` |
| Settlement | `settleShare`, `transferTo` (USDC `transferFrom` into the payee) |
| History | `getActivity` — an append-only event log per room |

Amounts use USDC's 6 decimals throughout. Payments move real USDC
(`0x3600000000000000000000000000000000000000`); Arc uses USDC for gas as well, so users
never need a second token.

Frontend integration:

- `src/contracts/expense-manager-artifact.ts` — ABI + bytecode
- `src/lib/chain/config.ts` — contract address, active room, invite tokens
- `src/lib/chain/nest-chain.tsx` — all reads (members, expenses, activity, balances)
- `src/lib/chain/writes.ts` — all writes (create/join, invite, expense, settle, transfer)

## Tech stack

TanStack Start (React 19, Vite 7) · TypeScript · Tailwind CSS v4 · Framer Motion ·
wagmi + viem · RainbowKit · Arc Testnet + Circle USDC.

## Setup

```sh
npm install
npm run dev
```

Environment (`.env`):

```
VITE_EXPENSE_MANAGER_ADDRESS=0x709cbad88162b999882788155cde79ade46a6d42
VITE_WALLETCONNECT_PROJECT_ID=   # optional; enables WalletConnect
```

Connect a wallet on Arc Testnet (chain `5042002`, RPC `https://rpc.testnet.arc.network`),
fund it with testnet USDC, then create a home or open an invite link.

## Demo Mode

Arc's public RPC is rate-limited and occasionally unreachable. If blockchain reads fail,
Nest automatically enters **Demo Mode**: a read-only sample home renders so the product
stays navigable, an amber banner appears, and every write action is disabled with the
message:

> Arc public RPC is temporarily unavailable. Live blockchain functionality will
> automatically resume when Arc public RPC becomes available.

No blockchain logic is removed or bypassed — polling continues in the background and live
onchain data resumes automatically on the next successful read.

## Arc RPC limitation

`https://rpc.testnet.arc.network` returns `429 request limit reached` under load. Nest
mitigates this with batched multicall reads, 20s polling intervals, and the Demo Mode
fallback above. A dedicated RPC endpoint removes the limitation entirely — set it as the
transport in `src/lib/wagmi.ts`.
