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

Nest does not claim a global minimum-transfer algorithm, autonomous custody, an independent security audit, or a production SDK. Circle Gateway/Unified Balance support is testnet-only in the current build, and Gas Station sponsorship depends on a matching policy being enabled in Circle Console.

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
| Contracts            | Solidity 0.8.24 / solc 0.8.28            |
| Circle               | User-Controlled Wallets, App Kit, CCTP-preferred routing, Unified Balance (testnet) |
| Build/runtime        | Vite, Nitro, Cloudflare module output     |

## Run locally

Bun is the canonical package manager used by CI:

```bash
git clone https://github.com/sigmaserene1/Nest.git
cd Nest
bun install --frozen-lockfile
bun run dev
```

Useful checks:

```bash
bunx tsc --noEmit
bun run build
forge test -vvv
```

`bun run preview` currently starts the same development server. A production-like Cloudflare Worker preview must run in a Worker-compatible runtime; `vite preview` is not the production deployment path for this Nitro build.

## Runtime configuration

### Circle authentication and wallets

These are server-side secrets/config values for Circle User-Controlled Wallets:

| Variable | Required | Purpose |
| --- | --- | --- |
| `CIRCLE_API_KEY` | Yes for Circle email/Google wallets | Circle server API authentication; never expose through `VITE_` |
| `CIRCLE_APP_ID` | Yes for Circle web SDK login | Circle application ID |
| `CIRCLE_GOOGLE_CLIENT_ID` | Required for Google login | Google OAuth client used by Circle social login |

Circle email OTP and Google sign-in create or restore the same user-controlled Arc wallet. New Circle users are initialized as SCAs. Gas sponsorship is only available when a matching Circle Gas Station policy is enabled in Circle Console.

### Browser/network variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_WALLETCONNECT_PROJECT_ID` | Optional | Enables external WalletConnect-compatible wallets |
| `VITE_ARC_DEFAULT_NETWORK` | Optional | `testnet` by default; set to `mainnet` only when production contracts are configured |
| `VITE_NEST_BUSINESS_V2_ADDRESS` | Optional | Enables the experimental Business V2 UI when deployed |
| `VITE_NEST_BRIDGE_REGISTRY_ADDRESS` | Optional on testnet | Overrides the checked-in verified Bridge Registry address |
| `VITE_NEST_TREASURY_V3_ADDRESS` | Optional on testnet | Overrides the checked-in verified Treasury V3 address |
| `VITE_NEST_EXPENSE_MANAGER_MAINNET_ADDRESS` | Mainnet only | ExpenseManager deployment for Arc Mainnet |
| `VITE_NEST_EXPENSE_MANAGER_MAINNET_BLOCK` | Mainnet only | ExpenseManager deployment block for indexed history |
| `VITE_NEST_BRIDGE_REGISTRY_MAINNET_ADDRESS` | Mainnet only | Bridge Registry deployment for Arc Mainnet |
| `VITE_NEST_TREASURY_V3_MAINNET_ADDRESS` | Mainnet only | Treasury V3 deployment for Arc Mainnet |

Arc Testnet ExpenseManager, Bridge Registry and Treasury V3 addresses are already checked into the application. There is currently no configured production Treasury V3 or Bridge Registry mainnet address.

### Optional account cache

For fast cross-device restore, apply:

```text
supabase/migrations/202610080001_nest_account_cache.sql
```

and configure these **server-side** values:

```bash
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `VITE_` variable.

## Circle and cross-chain flows

Nest currently uses Circle across several separate flows:

- Circle User-Controlled Wallets for email OTP and Google authentication.
- Arc SCA initialization for new Circle wallet users.
- Circle Gas Station-compatible transactions when sponsorship policy is enabled.
- Circle App Kit for supported swap flows.
- Circle Unified Balance / Gateway-style testnet funding from Base Sepolia and Avalanche Fuji into Arc Testnet.
- LI.FI for broader bridge routing, preferring Circle CCTP/native-USDC routes where available.
- NestBridgeRegistry as a Nest-side onchain record of completed Arc-involved bridge receipts; source and destination chain transactions remain the execution truth.

## GitHub Actions workflows

| Workflow | Trigger | What it does | Secrets |
| --- | --- | --- | --- |
| `CI` | Every push to `main` and pull request | Runs `bunx tsc --noEmit`, frontend build, and `forge test -vvv` | None |
| `Deploy Nest Bridge Registry` | Manual, or an eligible push with `[deploy-bridge-registry]` | Deploys `NestBridgeRegistry` to Arc Testnet | `DEPLOYER_PRIVATE_KEY`; optional `ARC_RPC_URL` |
| `Deploy Nest Treasury V3` | Manual, or an eligible push with `[deploy-treasury-v3]` | Deploys `NestTreasuryV3` to Arc Testnet | `DEPLOYER_PRIVATE_KEY`; optional `ARC_RPC_URL` |
| `Verify Nest Bridge Registry` | Relevant source/workflow changes or manual | Verifies the checked-in Bridge Registry deployment on the Arc Testnet explorer | None |
| `Verify Nest Treasury V3` | Relevant source/workflow changes or manual | Verifies the checked-in Treasury V3 deployment on the Arc Testnet explorer | None |
| `Nest Business agent` | Manual only | Runs the experimental Business V2 settlement agent if its secrets are configured | `NEST_BUSINESS_V2_ADDRESS`, `NEST_AGENT_PRIVATE_KEY`; optional `NEST_AGENT_ROOM_ID`, `ARC_RPC_URL` |

Deployment private keys belong only in GitHub Actions/Codespaces secrets. Never commit them, put them in a public `.env`, or paste them into issues/logs.

The repository currently has **no GitHub Actions workflow that publishes the public website**. CI success means the code builds and tests pass; it does not by itself mean `nestarc.xyz` has been republished by the hosting platform.

## Contract commands

```bash
# Deploy (testnet by default; requires DEPLOYER_PRIVATE_KEY)
bun run deploy:bridge-registry
bun run deploy:treasury-v3

# Verify the currently checked-in Arc Testnet deployments
bun run verify:bridge-registry
bun run verify:treasury-v3

# Legacy / experimental contracts
bun run deploy:expense-manager
bun run deploy:business-v2
```

The deployment scripts verify the RPC chain ID before broadcasting. Mainnet deployment paths require explicit production configuration and should not be run against real-value funds without a separate security and deployment review.

## Fast account restore and cross-device cache

Arc remains the source of truth for rooms, members, expenses, balances and settlements. The optional Supabase layer stores only rebuildable app/index data such as verified snapshots, bridge history, receipt history, preferences and agent settings.

It does **not** store wallet private keys or replace onchain financial state. Server functions validate the current short-lived Circle user token and resolve that user's Circle wallet before reading or updating the matching cache row.

If Supabase is not configured, Nest continues to work from Arc and local verified snapshots; only cross-device cache restore is unavailable.

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

The checked-in `Nest Business agent` workflow is **manual-only**. It runs only
when explicitly dispatched and only when the required agent secrets are configured:
`NEST_BUSINESS_V2_ADDRESS`, `NEST_AGENT_PRIVATE_KEY`, and optionally
`NEST_AGENT_ROOM_ID` / `ARC_RPC_URL`. Use a dedicated funded session key,
not an owner wallet. The runner can also be started directly with
`bun scripts/run-business-agent.mjs`.

Business V2 is testnet code, not an audited lending product. It must receive an
independent security review, including economic and liquidation design review,
before any mainnet or real-value deployment.

## License

MIT
