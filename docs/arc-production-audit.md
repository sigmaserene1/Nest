# Arc production readiness audit

Audit started: 2026-11-17 UTC; final verification 2026-11-20 11:45 UTC. Status: **not production-certified**. No funds moved by this audit.

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

## Additional contract and governance blockers

- `NestTreasuryV3.ownerWithdraw` (lines 223–230) lets the owner withdraw available funds without N-of-M approval. It is an explicit emergency escape hatch, not a fully multisig-controlled treasury.
- `createRecurringPayment` and `setBudgetPolicy` allow any single manager to authorize recurring spending or reset delegated limits even where the payment approval threshold is higher. These paths bypass a claim of universal multi-approval control.
- Proposal/milestone approvals count historical approvals; revoking a manager does not remove their existing counted approval. Threshold changes also affect outstanding proposals. Decide the intended governance semantics before production deployment.
- `NestBridgeRegistry.recordCompletedBridge` accepts caller-supplied hashes without cross-chain proof; its globally keyed source hash can be claimed first by another caller. It must not be treated as proof of delivery or custody authorization.
- Registry-derived history is currently labeled completed without independently re-verifying remote receipts. The new transport completion checks prevent new false-positive execution results, but do not certify historic caller-supplied registry entries.
- The public relay now has per-transaction policy controls but no durable rate limiter, idempotent queue or daily gas budget. Keep production sponsorship off until those controls exist.
- No independent contract security audit or Foundry execution was completed; the installed environment has no `forge` executable. Existing Solidity suites remain in `test/contracts` and must be run with Arc-compatible Foundry before production activation.

## Implemented safely

1. ExpenseManager writes/approval and treasury writes now check provider chain and contract code; treasury and generic ExpenseManager calls simulate before broadcast. Explicit selected chains accompany simulated write requests. Reverted treasury approvals stop the deposit.
2. New invitation codes carry Mainnet/Testnet identity; old unversioned codes resolve only to Testnet. Joining a mismatched network is rejected.
3. Bridge local keys and remote cache scope are environment-specific; unknown/mixed-environment history is excluded. Existing wallet-specific legacy local rows are filtered, not destroyed.
4. LI.FI responses must match requested chains, token addresses and amount. `DONE` requires `COMPLETED` plus destination hash; refunded, partial and missing-destination results cannot be called delivered.
5. Circle route helpers reject Mainnet↔Testnet pairs; bridge return state must be success with actual burn and mint hashes. Approval hashes are no longer substituted for burn evidence.
6. Gasless sponsorship defaults off and uses isolated network-specific relay keys and explicit recipient/value/gas policies, not the deployment key. Authorization expiry, simulated validity, RPC identity and gas cap are checked.
7. Business V2 read helpers now resolve network-specific configuration and explorers rather than showing Testnet values on Mainnet. Experimental status is unchanged.
8. The Mainnet deployment workflow no longer redeploys ExpenseManager unless an operator explicitly requests a replacement.
9. README corrected and [deployment/acceptance instructions](arc-mainnet-deployment.md) supplied, along with a repeatable read-only network audit script.

## Verification and remaining work

- Network regression tests initially passed 27/27 across 7 files; wallet identity and documentation redirect tests are retained. Final suite output is recorded below when rerun.
- Platform-managed build log showed `build OK` after implementation. Manual production build/TypeScript invocation is prohibited in this environment; this is **not** a claim that a separate release build was run.
- Full repository lint was run: **failed**, 2,332 errors and 23 warnings at the sampled run, mostly existing formatting (2,323 auto-fixable). A global rewrite was intentionally not applied to unrelated pages. Clean lint remains an acceptance blocker.
- Public homepage loaded in Chromium at 1280×1800 with correct title, one heading and no page errors. A click did not establish sign-in popup visibility in that check, so sign-in and all authenticated financial UI checks remain unverified. A signed-out browser is not a verified payment flow.
- Official Mainnet/Testnet RPC contract reads passed for the present deployments. Mainnet V3/Registry remain unconfigured. Code equality against compiler artifacts, explorer source verification and every safe funded write remain outstanding.
- GitHub was publicly readable but this checkout uses the Lovable-connected repository. No direct GitHub push, workflow run, contract deployment or published-app update occurred.

### Final check results

- **34 tests passed, 0 failed**, 9 test files, 44 assertions (network boundaries, invites, bridge status and cache isolation, sponsorship policy, wallet identity, Docs redirects).
- Targeted ESLint on all changed financial library modules: **passed**. Full-repository lint remains failed as above; unrelated formatting was not rewritten.
- Platform-managed latest build entry: **build OK**, 2026-11-20 11:45 UTC. No separate manual TypeScript or production build invocation.
- Repeatable read-only audit, 2026-11-20: Testnet block **73,182,774**, Mainnet block **32,217,469**. USDC decimals 6 on both; ExpenseManager rooms 20 Testnet / 1 Mainnet; Testnet V3 workspaces 3; Testnet Registry records 0. Mainnet V3 and Registry returned `NOT_CONFIGURED`, so the audit script correctly exited 1 rather than claiming readiness.
- Mainnet ExpenseManager runtime hash: `0x0f912f3e4a188a94f7ece3b0b2e3762eb182ab72f189f73e021f6ed8b2edd8e1`.
- Testnet ExpenseManager runtime hash: `0x662e127362037fb1c3c1332b802bd690a6250fa4e3d61635461587365e178100`.
- Testnet V3 runtime hash: `0x7cb993119c378fe2d754b96b11c1624e2594ad30c2178693d65b126298a904cc`.
- Testnet Registry runtime hash: `0x7dfcba7da99127b173334384c6bff830ca391ce487f5d9413624bcf6270a84bd`.

**Not complete:** production treasury custody, real Mainnet payments, provider sponsorship, multisig governance acceptance, bridge end-to-end delivery, full lint, independent contract tests/audit and direct GitHub synchronization. These require missing deployments, operator decisions, provider access and authorized funds; no feature is represented as transaction-verified solely from this implementation. Further inspection is also needed for every receipt/agent cache and individual business-write path; the audit is not exhaustive transaction certification.