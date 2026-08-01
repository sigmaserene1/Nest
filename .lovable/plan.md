## Goal

Move every piece of Nest's shared app state — rooms, members, expenses, splits, settlements, payment status — out of localStorage and Supabase and into an `ExpenseManager` smart contract on Arc Testnet. USDC transfers keep using the existing Arc USDC contract, but they now happen *through* the contract so payment status is recorded onchain and every room member reads identical state.

## Current state (analysis)

| Layer | Today | After |
|---|---|---|
| Expenses, splits, edits | `nest-store.ts` — wallet-scoped localStorage | `ExpenseManager` contract |
| Roommates/members | localStorage + Supabase `roommates` table | contract room membership |
| Settlements | localStorage `settlementStore` | contract `settleSplit` (USDC transferFrom) |
| Transactions/activity | Supabase `transactions` + signature-verified server fns | contract events (indexed via viem logs) |
| Payment requests | Supabase `payment_requests` | contract expenses with a single participant |
| Profile names | Supabase `profiles` + rename-block trigger | onchain `displayName` per address |
| Seed/demo data | `nest-data.ts` seed members, palette, mock balances | deleted; empty states only |

## The contract

`contracts/ExpenseManager.sol` — single contract, USDC address fixed at deploy.

```text
Room     { id, name, creator, createdAt, address[] members }
Expense  { id, roomId, payer, token(USDC), totalAmount, category,
           description, createdAt, address[] participants,
           uint256[] shares, mapping(address => bool) settled }

createRoom(name) / joinRoom(id) / inviteMember(roomId, addr)
setDisplayName(name)                      -- write-once, permanent
addExpense(roomId, participants[], shares[], category, description, amount)
settleSplit(expenseId)                    -- pulls USDC from caller to payer
settleAll(roomId)                         -- batch settle caller's open shares
directTransfer(roomId, to, amount, note)  -- Send / Request-pay flow

Events: RoomCreated, MemberJoined, DisplayNameSet, ExpenseAdded,
        SplitSettled, DirectTransfer

Views: getRooms(user), getRoomMembers, getExpenses(roomId),
       getBalances(roomId) -> (address[], int256[]), getActivity(roomId)
```

Balance math lives onchain in `getBalances` so every client shows the same numbers — no client-side recomputation.

USDC settlement requires an ERC-20 `approve` first; the UI shows a two-step "Approve → Settle" flow with allowance detection so approval is asked only once (max allowance).

## Deployment

There is no funded deployer key available in this environment, so the contract is deployed from the connected wallet:

1. I compile `ExpenseManager.sol` with solc in the sandbox and commit ABI + bytecode to `src/contracts/expense-manager.ts`.
2. A one-time `/app/deploy` screen lets you deploy it from your Arc wallet (needs a little testnet USDC for gas).
3. The resulting address goes into `VITE_EXPENSE_MANAGER_ADDRESS`; after that every user of the app reads/writes the same contract. If you'd rather deploy it yourself outside the app, I'll just wire the address in.

## Frontend changes

New `src/lib/contract/` layer:
- `expense-manager.ts` — address, ABI, typed helpers
- `use-rooms.ts`, `use-expenses.ts`, `use-balances.ts`, `use-activity.ts` — wagmi `useReadContract` + React Query, invalidated on every relevant event via `useWatchContractEvent`, so a member adding an expense appears for everyone within one block
- `use-onchain-write.ts` — shared write helper: simulate → write → wait for receipt → invalidate → toast, reusing the existing Confirming/Pending/Done modal UI

Rewired screens (UI/design unchanged): dashboard, expenses, settle, activity, members, analytics, action-modal, expense-form, invite-modal, profile-modal.

Deleted: `nest-store.ts`, `nest-data.ts` seeds, `nest-remote.ts`, `nest-writes.*`, `nest-sign.ts`, `tx-remote.*`, `profile-store.ts` (Supabase-backed parts), and the `roommates` / `payment_requests` / `profiles` / `transactions` tables. Supabase drops out of the app entirely.

## Tradeoffs you should know about

- Every expense write is a gas-paying transaction, so adding an expense takes a confirmation and a few seconds instead of being instant.
- Descriptions and names are public onchain — no private notes.
- Receipt image upload can't go onchain; I'll drop it unless you want it kept off-chain.
- Existing localStorage/Supabase history will not be migrated; everyone starts fresh onchain.

## Build order

1. Write + compile `ExpenseManager.sol`, emit ABI/bytecode module.
2. Deploy flow + address config.
3. Contract read/write hook layer with event-driven invalidation.
4. Migrate rooms/members/profile, then expenses/splits, then settle/activity/analytics.
5. Delete all local + Supabase state, drop tables, full empty-state and error-state pass.
