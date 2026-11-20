# Arc Mainnet deployment and verification handoff

Do not deploy or enable production treasury custody until the governance findings in the audit have been accepted or fixed and tested. This audit did not broadcast any transaction.

## Existing vs missing deployments

- Existing Mainnet ExpenseManager: `0x709cbad88162b999882788155cde79ade46a6d42`, block `21213840`. Preserve this address and the existing rooms.
- Treasury V3 Mainnet: no verified/configured address. Testnet address must not be copied into Mainnet configuration.
- Bridge Registry Mainnet: no verified/configured address. Optional indexing is separate from bridge execution.

## Deployment scripts

Existing scripts use Solidity 0.8.28, optimizer 200 runs, verify the RPC chain ID and require explicit Mainnet confirmation. They are Node command-line tools, not hosted server handlers.

Supply a securely managed `DEPLOYER_PRIVATE_KEY` and sufficient native Mainnet USDC for gas. Never paste a key into chat, commit it, or use it as a public relay key.

```sh
ARC_NETWORK=mainnet CONFIRM_MAINNET_DEPLOY=YES bun scripts/deploy-bridge-registry.mjs
ARC_NETWORK=mainnet CONFIRM_MAINNET_DEPLOY=YES bun scripts/deploy-treasury-v3.mjs
```

`ARC_RPC_URL` optionally overrides the official RPC; scripts must return chain 5042 before broadcasting. Alternatively use the manually confirmed GitHub workflow, leaving ExpenseManager replacement false. Direct GitHub write/sync and workflow permissions were not verified here.

Record every emitted address, receipt status, transaction hash, deployment block, runtime code hash and compiler input. Verify source on the [Mainnet explorer](https://explorer.arc.io). Check immutable `usdc()` equals the official ERC-20 interface. Run `bun scripts/audit-arc-networks.mjs` for repeatable read-only evidence; missing deployments make it report `NOT_DEPLOYED`, never success.

## Public frontend variables

| Variable | Purpose |
| --- | --- |
| `VITE_ARC_DEFAULT_NETWORK` | `testnet` until funded Mainnet acceptance is complete |
| `VITE_NEST_EXPENSE_MANAGER_MAINNET_ADDRESS` | Optional override of verified existing Mainnet address |
| `VITE_NEST_EXPENSE_MANAGER_MAINNET_BLOCK` | Optional override of creation block 21213840 |
| `VITE_NEST_TREASURY_V3_MAINNET_ADDRESS` | Verified new Treasury V3 address only |
| `VITE_NEST_BRIDGE_REGISTRY_MAINNET_ADDRESS` | Verified new Registry address only |
| `VITE_NEST_TREASURY_V3_ADDRESS` | Testnet override, default existing Testnet deployment |
| `VITE_NEST_BRIDGE_REGISTRY_ADDRESS` | Testnet override, default existing Testnet deployment |
| `VITE_NEST_BUSINESS_V2_ADDRESS` / `VITE_NEST_BUSINESS_V2_MAINNET_ADDRESS` | Separate experimental deployments; not production-certified |
| `VITE_PRIVY_APP_ID` | Public current email-wallet app identifier |
| `VITE_LIFI_INTEGRATOR` | Optional LI.FI integrator name |

## Server credentials and policies

Existing legacy Circle operations require `CIRCLE_API_KEY`, `CIRCLE_APP_ID` and (for Google) `CIRCLE_GOOGLE_CLIENT_ID`; production network support requires a matching production Circle configuration. Privy server verification uses `PRIVY_APP_ID`/`PRIVY_APP_SECRET`. No values are included in this document. Provider policy access, SMTP, OAuth and production session execution remain unverified.

Relayer sponsorship is separate from Circle Gas Station. It is now **off by default on both networks** and must not use `DEPLOYER_PRIVATE_KEY`. For each prefix `GASLESS_MAINNET` or `GASLESS_TESTNET`, configure:

- `_PRIVATE_KEY`: isolated, minimally funded relay wallet.
- `_ENABLED=true`: explicit operator opt-in.
- `_RECIPIENTS`: comma-separated permitted recipient addresses.
- `_MAX_VALUE_UNITS`: positive transfer limit in six-decimal ERC-20 units.
- `_MAX_GAS_UNITS`: positive per-transaction gas-unit limit.

Authorizations must be unexpired and expire within 30 minutes. Simulation and gas estimation precede broadcast. Per-transaction policies are not a durable rate limit or daily budget: do not publicly fund the relay for general production until shared rate limiting, idempotent submission and daily sponsor budget enforcement are implemented. A matching Circle Gas Station policy must separately permit the wallet and target calls; installing App Kit does not configure it.

## Funded acceptance checklist (not executed)

Use explicitly authorized wallets with minimal real USDC, not arbitrary user accounts. Test every operation and read its confirmed result back through the actual UI:

1. Email OTP, existing-wallet restoration, disconnect, reconnect and session expiry on both networks.
2. Workspace creation/join/member permissions, expense shares and exact settlement amounts.
3. Treasury creation, contribution/deposit, approved payment execution, owner withdrawal, insufficient-funds failures.
4. Threshold changes, manager revocation and old approvals; confirm intended governance policy.
5. Due recurring payout and cancellation; milestone reserve/release/cancel; budget cap/reset/revoke and unauthorized callers.
6. Supported LI.FI/CCTP source→Arc and Arc→destination routes: quote, approval, burn, attestation, mint, destination receipt and optional registry record.
7. Refund/partial/failed/pending outcomes must not display completed delivery. Registry records alone are user assertions, not cross-chain proofs.
8. Switch networks during preparation/approval and verify no old wallet balance, invite, workspace, receipt or bridge history is applied to the new network.
9. Confirm production build/typechecks and repository lint are clean; publish only after these and funded verification pass.