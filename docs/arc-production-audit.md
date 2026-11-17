# Arc production readiness audit

Audit date: 2026-11-17 UTC. Status: **not production-certified**. No funds moved by this audit.

## Verified network and deployment evidence

Official sources: [network configuration](https://docs.arc.io/arc/references/connect-to-arc), [contract addresses](https://docs.arc.io/arc/references/contract-addresses), [EVM differences](https://docs.arc.io/arc/references/evm-differences).

Direct JSON-RPC checks on both official RPCs returned chain IDs 5042 and 5042002. USDC ERC-20 at `0x3600000000000000000000000000000000000000` returned decimals 6 on both; native gas accounting uses 18 decimals. Identical numeric token addresses do not imply shared network state.

| Contract | Mainnet | Testnet |
| --- | --- | --- |
| ExpenseManager | `0x709cbad88162b999882788155cde79ade46a6d42`: 12,653 runtime bytes; `usdc()` correct; `roomCount()` = 1 | Same numeric address: separate deployed code, 20 rooms |
| NestTreasuryV3 | No configured production address; **no code at the Testnet address on Mainnet** | `0x1173776512ae96af2a480a8a1898df8582489425`: 17,465 bytes; `usdc()` correct; 3 workspaces |
| NestBridgeRegistry | No configured production address; **no code at the Testnet address on Mainnet** | `0x2dd392fc3f6b10e5520c309164216351f4f7c27b`: 4,638 bytes; registry does not expose `usdc()` |

Mainnet evidence sampled at block 31,689,926; Testnet at block 72,663,026. Code presence and read success are not proof of transaction success, verified-source equivalence, permissions, or an independent audit.

## Blocking findings before implementation

1. Treasury V3 Mainnet deployment/configuration is missing: pooled deposits, approval payments, recurring payouts, milestone escrow, delegated budgets and treasury permissions cannot be called production-live.
2. Bridge Registry Mainnet deployment/configuration is missing; bridge transport can operate without this optional Nest index but onchain indexing cannot.
3. No authorized funded Mainnet wallet transaction was exercised. ExpenseManager reads work, but creation, contribution/payment, settlement and receipt readback remain unverified end to end.
4. `useNestWrites` does not reject a wallet on another chain; several simulated writes omit an explicit selected chain. Treasury approvals are awaited without checking receipt status.
5. Legacy expense invite codes contain only contract address and room ID. Both deployments use the same numeric address, so an invite may target the wrong network.
6. Bridge local history and its remote `global` cache are wallet-scoped but not environment-scoped. Switching networks can display another network's history.
7. LI.FI considers every `DONE` successful, including refunded/partial outcomes; quote validation does not bind response to the requested tokens, amount and chains.
8. Gasless EIP-3009 relay reuses the deployer key and automatically offers real-money Mainnet sponsorship with no explicit policy, recipient allowlist or amount cap. This is not a Circle Paymaster/Gas Station policy.
9. Legacy Business V2 helper reads are hardcoded to Testnet; experimental modules require a separate audit and verified deployment before production activation.
10. Circle Gas Station/Paymaster policies, production credentials, SMTP/Google provider settings and real OTP completion are not verified by repository inspection. Preserve existing Circle identities; current new-email path is Privy EVM, not Circle.
11. README incorrectly says no Mainnet addresses are committed and every financial write is blocked; it also implies all listed features are live despite missing Mainnet treasury deployment.
12. Existing deployment workflow redeploys all three contracts, including an already-present ExpenseManager; deploying replacements would not migrate legacy rooms.
13. The provided GitHub repository is publicly readable, but this working checkout is connected to Lovable's repository, not directly to that GitHub remote. Direct GitHub write access/sync is unverified; do not claim a GitHub push occurred.
14. Production build/typecheck are platform-managed and cannot be manually invoked in this environment. Report the latest platform result separately from tests/lint and never imply a manual production build was run.

## Feature status before fixes

| Feature | Mainnet status |
| --- | --- |
| Network/RPC/explorer and ERC-20 USDC | Official settings and live reads verified |
| ExpenseManager rooms/members/expense/settlement | Deployed, reads verified; financial writes unverified |
| Treasury deposits/withdrawal proposals/multisig | Blocked by missing verified deployment |
| Recurring payouts | Blocked by missing deployment; execution requires a caller, not an autonomous timer |
| Milestone escrow and delegated budgets | Blocked by missing deployment and funded permission tests |
| Circle/Privy wallet restoration | Code exists; real provider session tests still required |
| LI.FI/CCTP bridging | Route availability and completion depend on provider and supported chain pair; no real transfer exercised |
| Bridge receipts | Mainnet registry missing; user-reported index is not proof of destination chain execution |
| Gas sponsorship | Must require explicit sponsor configuration and policy; no provider sponsorship attested |

Implementation results, exact variables, deployment instructions and verification evidence follow in the final report. Nothing here authorizes using a private key or executing real-money transactions.