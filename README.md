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

Nest does not claim a global minimum-transfer algorithm, autonomous custody, an independent security audit, or a production SDK. Gas Station sponsorship depends on a matching policy being enabled in Circle Console.

## Live Arc Testnet contracts

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
| Circle               | User-Controlled Wallets, App Kit and CCTP-preferred routing |
| Build/runtime        | Vite, Nitro, Cloudflare module output     |

## Product architecture

Nest separates its core financial responsibilities across dedicated onchain components:

- **ExpenseManager** remains the canonical ledger for shared expenses, membership, balances and settlement activity.
- **NestTreasuryV3** manages pooled USDC, approval-controlled payments, recurring payouts, milestone escrow and delegated spending policies.
- **NestBridgeRegistry** records completed Arc-involved bridge receipts while the underlying source and destination chain transactions remain the execution truth.
- **Circle User-Controlled Wallets** provide email OTP and Google-based wallet access, with SCA initialization for new users.
- **Circle App Kit and CCTP-preferred routing** support swap and cross-chain USDC flows where available.
- **LI.FI** provides broader bridge routing with Circle-native paths preferred when supported.

This separation keeps legacy shared-expense state intact while allowing treasury and cross-chain capabilities to evolve independently.

## Security and state model

Nest is non-custodial at the account layer and relies on onchain contracts for financial state. Treasury actions are constrained by contract-level membership, manager permissions, approval thresholds and delegated spending limits.

The optional account cache is used only to improve loading speed and cross-device continuity. It does not replace onchain state, hold wallet private keys or act as the financial ledger.

Treasury V3 and Bridge Registry are deployed on Arc Testnet. Bridge Registry and Treasury V3 are verified on the Arc Testnet explorer. These contracts are not represented as independently audited production contracts, and the current deployment uses testnet assets only.

## Fast account restore and cross-device cache

Arc remains the source of truth for rooms, members, expenses, balances and settlements. The optional Supabase layer stores only rebuildable app/index data such as verified snapshots, bridge history, receipt history, preferences and agent settings.

It does **not** store wallet private keys or replace onchain financial state. Server functions validate the current short-lived Circle user token and resolve that user's Circle wallet before reading or updating the matching cache row.

If Supabase is not configured, Nest continues to work from Arc and local verified snapshots; only cross-device cache restore is unavailable.

## Business V2

`NestBusinessV2.sol` remains an experimental contract path for business-oriented workspaces. It is intentionally separate from the live core contracts and does not modify existing ExpenseManager workspaces.

The design includes a USDC-collateral credit model and revocable session-key settlement policies with expiry, per-run limits and period caps. It is not part of the primary Nest product positioning and should be treated as experimental until independently reviewed and explicitly deployed.

## License

MIT
