# Nest

Nest is programmable group finance on Arc Testnet. A workspace records shared obligations, resolves exact balances, and lets members settle open shares peer-to-peer in native USDC.

The original household experience remains supported. The same contract-backed workflow also serves distributed teams, collectives, and project syndicates that need one transparent state for shared money.

**Live application:** [nestarc.xyz](https://nestarc.xyz)

## What works today

- Create group workspaces and invite wallet addresses.
- Record recurring or one-off expenses with equal or custom member allocations.
- Resolve each member's net position from the shared onchain ledger.
- Group open shares by debtor and creditor.
- Clear every open share owed to one counterparty with `settleWith`.
- Settle wallet-to-wallet through the USDC ERC-20 interface on Arc Testnet.
- Fund Arc from six EVM testnets through Circle CCTP v2.
- Plan weighted syndicate payouts and send them directly in USDC.
- Queue client-side assisted settlements with dust filters and per-run caps.
- Retain transaction-linked receipts and inspect activity in Arcscan.

Nest does not claim a global minimum-transfer algorithm, autonomous custody, Circle Gateway integration, or a production SDK. The deployed contract is callable directly; a typed SDK and embeddable interface remain roadmap work.

## Deployed contract

`ExpenseManager`

```text
0x709cbAd88162b999882788155cde79aDe46A6D42
```

[Inspect the deployment on Arcscan](https://testnet.arcscan.app/address/0x709cbAd88162b999882788155cde79aDe46A6D42).

The contract stores rooms, membership, expenses, member shares, settlement status, and activity. Expense settlement does not require Nest to pool customer funds: approved USDC moves from the caller to the expense payer.

## Arc Testnet configuration

| Property              | Value                                        |
| --------------------- | -------------------------------------------- |
| Chain ID              | `5042002`                                    |
| Native gas asset      | `USDC`                                       |
| USDC ERC-20 interface | `0x3600000000000000000000000000000000000000` |
| CCTP domain           | `26`                                         |
| Primary RPC           | `https://rpc.testnet.arc.network`            |
| Explorer              | `https://testnet.arcscan.app`                |

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

## Business V2 (new workspaces)

The deployed `ExpenseManager` cannot lend or grant an unattended settlement
authority. `NestBusinessV2.sol` is a separate Arc Testnet contract for new
business workspaces; it leaves every legacy Nest home unchanged.

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

## Mainnet posture

Nest currently runs on Arc Testnet. Mainnet deployment is not treated as a configuration switch: it requires independent contract review, verified deployment, production monitoring, and a deliberate migration plan.

## License

MIT

## Known accepted risk — `ws` transitive dependency

`npm audit` flags a high-severity advisory in `ws` (GHSA-58qx-3vcg-4xpx,
GHSA-96hv-2xvq-fx4p), pulled in transitively via `@reown/appkit` /
`@walletconnect/utils`. The only fix path is a semver-major bump to
`wagmi@3.7.7`, which would cascade into breaking upgrades across
`@rainbow-me/rainbowkit` and the WalletConnect/Reown stack — a combined
~5 MB of the server bundle (see build output from 2026-09-01).

Accepted for now because: `ws` is a Node.js-only WebSocket implementation;
browser wallet-connect sessions use the native `WebSocket` API instead, so
the vulnerable code path is only reachable if invoked server-side, which
Nest's wallet flows do not do.

Revisit after the Arc mainnet launch (Sep 16, 2026) once wallet libraries
have stabilized against the new network, and re-run `npm audit --omit=dev`
to confirm this is still the only high-severity item outstanding.

Reviewed: 2026-09-01.
