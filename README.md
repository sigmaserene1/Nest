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

## Mainnet posture

Nest currently runs on Arc Testnet. Mainnet deployment is not treated as a configuration switch: it requires independent contract review, verified deployment, production monitoring, and a deliberate migration plan.

## License

MIT
