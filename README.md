# Nest

Nest is a shared USDC treasury and settlement app on Arc Testnet. Workspaces can pool USDC, coordinate approval-controlled payments, manage recurring payouts and delegated budgets, record shared obligations, and settle balances onchain.

The original household expense experience remains supported. Treasury V3 adds a separate programmable shared-treasury layer for teams, collectives, and project groups without migrating or mutating legacy ExpenseManager state.

**Live application:** [nestarc.xyz](https://nestarc.xyz)

## What works today

- Create group workspaces and invite wallet addresses.
- Pool USDC into a shared Treasury V3 workspace balance.
- Create N-of-M approval-controlled treasury payments.
- Configure recurring payouts for retainers, subscriptions, payroll-style flows, or other scheduled payments.
- Reserve treasury funds in milestone escrow and release them after the configured approval threshold is met.
- Delegate capped member spending budgets with onchain period limits and revocation.
- Add treasury members, promote or remove managers, and configure approval thresholds.
- Record recurring or one-off shared expenses with equal or custom member allocations.
- Resolve each member's net position from the shared onchain ledger.
- Clear open shares owed to one counterparty with `settleWith`.
- Settle wallet-to-wallet through the USDC ERC-20 interface on Arc Testnet.
- Bridge USDC through LI.FI with Circle CCTP/native-USDC routes preferred where available.
- Persist completed Arc-involved bridge receipts in the Nest Bridge Registry after user confirmation.
- Provision new Circle email/social wallets as Arc Testnet SCAs for Circle Gas Station sponsorship when a matching policy is enabled in Circle Console. Existing legacy EOA wallets are preserved.
- Retain transaction-linked receipts and inspect activity on the Arc Testnet explorer.

Nest does not claim a global minimum-transfer algorithm, autonomous custody, Circle Gateway integration, or a production SDK. The deployed contract is callable directly; a typed SDK and embeddable interface remain roadmap work.

## Deployed Arc Testnet contracts

| Contract | Address | Explorer status | Purpose |
| --- | --- | --- | --- |
| `ExpenseManager` | `0x709cbAd88162b999882788155cde79aDe46A6D42` | Live | Legacy/shared-expense rooms, members, obligations, balances, settlements and activity |
| `NestBridgeRegistry` | `0x2dd392fc3f6b10e5520c309164216351f4f7c27b` | Verified | Permanent Nest-side index of completed Arc-involved cross-chain bridge receipts |
| `NestTreasuryV3` | `0x1173776512ae96af2a480a8a1898df8582489425` | Fully verified | Shared USDC treasury, N-of-M payments, recurring payouts, milestone escrow and delegated budgets |

### ExpenseManager

[Open ExpenseManager on the Arc Testnet explorer](https://explorer.testnet.arc.io/address/0x709cbAd88162b999882788155cde79aDe46A6D42).

ExpenseManager remains the canonical contract for existing Nest expense rooms. It stores rooms, membership, expenses, member shares, settlement status and activity. Expense settlement does not require Nest to pool customer funds: approved USDC moves from the caller to the expense payer.

### NestBridgeRegistry

[Open the verified Bridge Registry on the Arc Testnet explorer](https://explorer.testnet.arc.io/address/0x2dd392fc3f6b10e5520c309164216351f4f7c27b).

Deployment transaction:

```text
0xe811d4e8aee5a656ad4b0c65b1dfc9cf1cc2a53ce103eaadcdc3e09e9ec6c723
```

Deployment block: `66079022`.

The registry stores the Nest-side record for completed Arc-involved bridge transfers, including source/destination chain IDs, source/destination transaction hashes, amount, recipient and provider metadata. The external source and destination chain transactions remain the execution truth; the registry does not independently prove another chain's state.

### NestTreasuryV3

[Open the fully verified Treasury V3 contract on the Arc Testnet explorer](https://explorer.testnet.arc.io/address/0x1173776512ae96af2a480a8a1898df8582489425).

Deployment transaction:

```text
0x0dda929f9f6af4317c921ca01e913567cc2dc4c6bbb52fdb3f51e7fffe5bf720
```

Deployment block: `66613152`.

Treasury V3 is separate from ExpenseManager so legacy workspaces are not migrated implicitly. It provides shared USDC deposits, configurable manager approval thresholds, payment proposals, recurring payments, milestone escrow and delegated period-based spending budgets.

Treasury V3 and Bridge Registry are testnet contracts and are not represented as independently audited production contracts.

## Arc Testnet configuration

| Property              | Value                                        |
| --------------------- | -------------------------------------------- |
| Chain ID              | `5042002`                                    |
| Native gas asset      | `USDC`                                       |
| USDC ERC-20 interface | `0x3600000000000000000000000000000000000000` |
| CCTP domain           | `26`                                         |
| Primary RPC           | `https://rpc.testnet.arc.network`            |
| Explorer              | `https://explorer.testnet.arc.io`           |

All balances and transactions shown by the current deployment use testnet assets with no real-world monetary value.

## Stack

| Layer                | Technology                                |
| -------------------- | ----------------------------------------- |
| Application          | TanStack Start, TanStack Router, React 19 |
| Language             | TypeScript                                |
| UI                   | Tailwind CSS 4, Radix UI, Lucide          |
| Wallets              | Wagmi, Viem, RainbowKit                   |
| Contracts            | Solidity 0.8.x                            |
| Build and deployment | Vite, Nitro, Cloudflare module output     |

## Run locally

```bash
git clone https://github.com/sigmaserene1/Nest.git
cd Nest
npm install
npm run dev
```

Vite prints the local URL when the development server is ready.

`npm run preview` starts the same local development server. A production-like
Cloudflare Worker preview must run in a Worker runtime; `vite preview` is not
compatible with this Nitro Cloudflare build.

Useful checks:

```bash
npm run build
npx tsc --noEmit
npx eslint src/routes/index.tsx src/routes/__root.tsx
```

The repository currently contains pre-existing lint debt outside the landing page; a production build and TypeScript check are the reliable whole-app gates until that baseline is cleaned up.

## Fast account restore and cross-device cache

Arc remains the source of truth for rooms, members, expenses, balances and
settlements. Nest also supports a server-side Supabase cache so returning Circle
email/social users can paint their last verified account state immediately while
Arc refreshes in the background.

Apply the checked-in migration:

```text
supabase/migrations/202610080001_nest_account_cache.sql
```

Configure these **server-side** deployment secrets:

```bash
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `VITE_` variable.

The cache stores only rebuildable app/index data such as verified workspace
snapshots, bridge history, receipt history and preferences. It does not store
wallet private keys. Server functions validate the current short-lived Circle
user token, resolve that user's Circle wallet server-side, and then read/write
the matching cache row.

If Supabase is not configured, Nest keeps working from Arc and uses the local
verified snapshot for fast same-device reloads; only cross-device cache restore
is unavailable.

## Business V2 (experimental / not listed as a live core contract)

The repository also contains `NestBusinessV2.sol`. It is separate experimental testnet code and is not part of the live core-contract table above unless a deployment address is explicitly configured.



The deployed `ExpenseManager` cannot lend or grant an unattended settlement
authority. `NestBusinessV2.sol` is separate experimental contract source for
new business workspaces; it leaves every legacy Nest home unchanged when deployed.

It provides a 50%-LTV, USDC-collateral credit line and a revocable session-key
policy. A session key can settle only genuine open shares for the workspace
member who authorized it, within an onchain expiry plus per-run and per-period
USDC caps. It cannot create expenses or make arbitrary transfers.

Deploy only to Arc Testnet after a review:

```bash
# Store this only as a Codespaces secret; never put it in .env committed to git.
export DEPLOYER_PRIVATE_KEY=0x...
npm run deploy:business-v2
```

Set the emitted contract address in the app environment before publishing:

```bash
VITE_NEST_BUSINESS_V2_ADDRESS=0x...
```

The checked-in GitHub workflow can run the capped settlement key hourly after
these GitHub Actions secrets are added: `NEST_BUSINESS_V2_ADDRESS`,
`NEST_AGENT_ROOM_ID`, `NEST_AGENT_PRIVATE_KEY`, and optionally `ARC_RPC_URL`.
Use a dedicated funded session key, not an owner wallet. The runner can also be
started directly with `node scripts/run-business-agent.mjs`.

Business V2 is testnet code, not an audited lending product. It must receive an
independent security review, including economic and liquidation design review,
before any mainnet or real-value deployment.

## License

MIT
