# Nest

Nest is an onchain group-treasury and net-settlement application for Arc. Each workspace deploys its own `NestTreasuryV2` contract, which becomes the source of truth for membership, obligations, signed net positions, USDC settlements, agent policies, and execution receipts.

**Live application:** [nestarc.xyz](https://nestarc.xyz)

## What Treasury V2 does

- Deploys one independent treasury contract from the connected wallet.
- Adds members and administrators through onchain permissions.
- Records shared obligations and exact participant shares.
- Updates signed net positions inside the obligation transaction.
- Previews a deterministic debtor-to-creditor settlement route.
- Transfers approved USDC directly between member wallets in one atomic settlement.
- Attaches Arc transaction memos to wallet and agent settlements.
- Stores settlement routes and receipts in the treasury contract.
- Registers optional ERC-8004 agent identities on Arc.
- Enforces agent executor, per-run cap, 30-day cap, expiry, cooldown, and allowance onchain.
- Funds Arc from supported EVM testnets through Circle App Kit and CCTP V2.

No financial or agent state is reconstructed from `localStorage`, and RPC failures never fall back to sample balances. The browser only remembers UI preferences such as the last treasury address opened.

## Contract model

The source is [`contracts/NestTreasuryV2.sol`](contracts/NestTreasuryV2.sol). There is no hidden canonical workspace: a member either deploys a new treasury in the app or opens an existing V2 address or invite.

The contract is non-custodial in the product sense: Nest does not operate a pooled customer balance. During settlement, the contract uses the debtor's capped ERC-20 allowance to transfer USDC directly to wallets with positive treasury positions. The full transaction reverts if any transfer fails.

The previous `ExpenseManager` deployment remains on Arc Testnet as immutable V1 history. Treasury V2 does not silently migrate its data or allowances.

## Arc integrations

| Primitive              | Use in Nest                                       |
| ---------------------- | ------------------------------------------------- |
| Native USDC            | Accounting, gas, allowance, and direct settlement |
| Circle App Kit         | Browser-owned crosschain funding flow             |
| CCTP V2                | Native USDC burn-and-mint route into Arc          |
| Transaction Memo       | Machine-readable settlement and agent references  |
| ERC-8004               | Optional onchain agent identity                   |
| Deterministic finality | Final state after one successful confirmation     |

### Arc Testnet configuration

| Property                   | Value                                        |
| -------------------------- | -------------------------------------------- |
| Chain ID                   | `5042002`                                    |
| RPC                        | `https://rpc.testnet.arc.io`                 |
| Native gas asset           | `USDC`                                       |
| USDC ERC-20 interface      | `0x3600000000000000000000000000000000000000` |
| Transaction Memo           | `0x5294E9927c3306DcBaDb03fe70b92e01cCede505` |
| ERC-8004 Identity Registry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| CCTP domain                | `26`                                         |
| Explorer                   | `https://testnet.arcscan.app`                |

Arc represents native USDC internally with 18 decimals while the ERC-20 USDC interface uses 6 decimals. Nest's contract amounts always use the 6-decimal ERC-20 interface.

## Agent execution

An owner can set one executor wallet and an optional ERC-8004 agent ID. The contract, not the browser, enforces the execution policy and routes funds only toward current positive treasury balances.

The web interface can trigger a self-executing policy. Continuous autonomous execution still requires a separately operated keeper or developer-controlled EOA using the same public `runAgent` function. Nest does not create, receive, or store an executor private key.

Arc's Memo predeploy currently requires a direct EOA caller, so memo-wrapped actions are not advertised as smart-contract-wallet compatible.

The repository includes a one-shot keeper command. Start with a simulation:

```bash
NEST_TREASURY_ADDRESS=0x... \
NEST_AGENT_ACCOUNT=0x... \
NEST_AGENT_PRIVATE_KEY=0x... \
NEST_AGENT_AMOUNT=25 \
npm run agent:run -- --dry-run
```

Remove `--dry-run` only after reviewing the exact creditor route printed by the simulation. Keep the executor key in a secret manager when scheduling this command; never commit it or paste it into the browser.

## Development

```bash
git clone https://github.com/sigmaserene1/Nest.git
cd Nest
npm install
npm run build:contract
npm run dev
```

Useful release checks:

```bash
npm run build:contract
npx tsc --noEmit
npm run build
npm run verify:contract -- --address 0xYourTreasuryAddress
```

`npm run build:contract` compiles with Solidity `0.8.28`, IR optimization, and 200 optimizer runs, then regenerates the typed ABI and deployment bytecode used by the app. The script also fails if runtime bytecode exceeds the EIP-170 size limit.

## Mainnet and security posture

Treasury V2 is new, unaudited testnet code. Do not use it with assets of real-world value. Mainnet requires, at minimum, independent review, invariant and integration testing, verified deployments, monitoring, an incident plan, and an explicit V1/V2 migration policy. Mainnet is not treated as a configuration change.

## Stack

| Layer         | Technology                                |
| ------------- | ----------------------------------------- |
| Application   | TanStack Start, TanStack Router, React 19 |
| Chain clients | Wagmi and Viem                            |
| Arc funding   | Circle App Kit and Viem adapter           |
| Contracts     | Solidity 0.8.28                           |
| UI            | Tailwind CSS 4, Radix UI, Lucide          |
| Output        | Vite, Nitro, Cloudflare module            |

## License

MIT
