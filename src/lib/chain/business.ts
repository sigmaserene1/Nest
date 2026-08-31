// Nest Business V2 — the single active Nest contract on Arc Testnet.
//
// Every value exposed here is read from the deployed NestBusinessV2 contract or
// from Arc event logs. Nothing in this module fabricates balances, members,
// obligations, credit positions or transaction hashes, and no financial state is
// ever written to localStorage. The only browser-persisted value is the user's
// currently selected workspace id, which is a UI preference, not financial data.

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { NEST_BUSINESS_V2_ABI } from "@/contracts/nest-business-v2-artifact";
import { ERC20_ABI, USDC_ADDRESS, arcTestnet } from "@/lib/wagmi";

const raw = import.meta.env.VITE_NEST_BUSINESS_V2_ADDRESS as string | undefined;

/** The active Nest contract, or null until a real deployment address is configured. */
export const BUSINESS_V2_ADDRESS: Address | null =
  raw && isAddress(raw.trim()) ? (raw.trim() as Address) : null;

export const isBusinessV2Enabled = BUSINESS_V2_ADDRESS !== null;

export const MAX_BATCH_COUNTERPARTIES = 32;
export const MAX_LTV_PERCENT = 50;
export const BORROW_APR_PERCENT = 8;

export const POLL_MS = 15_000;

export const toUsdc = (value: bigint | undefined | null) => Number(formatUnits(value ?? 0n, 6));
export const toUnits = (value: number) => parseUnits(value.toFixed(6), 6);

export const explorerTx = (hash: string) => `${arcTestnet.blockExplorers.default.url}/tx/${hash}`;
export const explorerAddress = (address: string) =>
  `${arcTestnet.blockExplorers.default.url}/address/${address}`;

export const shortAddress = (value: string) =>
  value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "";

const base = {
  address: BUSINESS_V2_ADDRESS ?? undefined,
  abi: NEST_BUSINESS_V2_ABI,
  chainId: arcTestnet.id,
} as const;

/* ------------------------------------------------------------------ */
/* Workspace selection (UI preference only)                            */
/* ------------------------------------------------------------------ */

const KEY = (wallet: string) => `nest.v2.workspace.${wallet.toLowerCase()}`;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", listener);
  };
}

function readSelection(wallet?: string | null): number | null {
  if (typeof window === "undefined" || !wallet) return null;
  const value = Number(window.localStorage.getItem(KEY(wallet)));
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function selectWorkspace(wallet: string | null | undefined, id: number | null) {
  if (typeof window === "undefined" || !wallet) return;
  if (id) window.localStorage.setItem(KEY(wallet), String(id));
  else window.localStorage.removeItem(KEY(wallet));
  notify();
}

/* ------------------------------------------------------------------ */
/* Contract reads                                                      */
/* ------------------------------------------------------------------ */

export type Workspace = { id: number; name: string; owner: string; createdAt: number };

export type ObligationView = {
  id: number;
  payer: string;
  description: string;
  category: string;
  total: number;
  createdAt: number;
  participants: string[];
  shares: Record<string, number>;
  settled: Record<string, boolean>;
};

export type CreditPosition = {
  supplied: number;
  borrowed: number;
  interest: number;
  debt: number;
  limit: number;
  available: number;
  liquidity: number;
};

export type AgentPolicy = {
  active: boolean;
  validAfter: number;
  validUntil: number;
  periodSeconds: number;
  periodStartedAt: number;
  maxPerRun: number;
  maxPerPeriod: number;
  spentThisPeriod: number;
  remainingThisPeriod: number;
};

type RawRoom = { id: bigint; name: string; creator: string; createdAt: bigint };
type RawExpense = {
  id: bigint;
  roomId: bigint;
  payer: string;
  totalAmount: bigint;
  category: string;
  description: string;
  createdAt: bigint;
  participants: readonly string[];
  shares: readonly bigint[];
  settled: readonly boolean[];
};

export function useWorkspaces() {
  const { address } = useAccount();
  const query = useReadContract({
    ...base,
    functionName: "getRooms",
    args: address ? [address] : undefined,
    query: { enabled: isBusinessV2Enabled && !!address, refetchInterval: POLL_MS },
  });

  const workspaces: Workspace[] = useMemo(
    () =>
      ((query.data as readonly RawRoom[] | undefined) ?? []).map((room) => ({
        id: Number(room.id),
        name: room.name,
        owner: room.creator.toLowerCase(),
        createdAt: Number(room.createdAt),
      })),
    [query.data],
  );

  const stored = useSyncExternalStore(
    subscribe,
    () => readSelection(address),
    () => null,
  );
  const selectedId = workspaces.some((w) => w.id === stored) ? stored : (workspaces[0]?.id ?? null);
  const select = useCallback((id: number | null) => selectWorkspace(address, id), [address]);

  return {
    workspaces,
    selectedId,
    selected: workspaces.find((w) => w.id === selectedId) ?? null,
    select,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useWorkspaceDetail(roomId: number | null) {
  const args = roomId ? ([BigInt(roomId)] as const) : undefined;
  const query = useReadContracts({
    contracts: [
      { ...base, functionName: "getRoomMembers", args },
      { ...base, functionName: "getExpenses", args },
    ],
    query: { enabled: isBusinessV2Enabled && !!roomId, refetchInterval: POLL_MS },
  });

  const members = useMemo(
    () =>
      ((query.data?.[0]?.result as readonly string[] | undefined) ?? []).map((m) =>
        m.toLowerCase(),
      ),
    [query.data],
  );

  const obligations: ObligationView[] = useMemo(() => {
    const rows = (query.data?.[1]?.result as readonly RawExpense[] | undefined) ?? [];
    return rows
      .map((row) => {
        const participants = row.participants.map((p) => p.toLowerCase());
        const shares: Record<string, number> = {};
        const settled: Record<string, boolean> = {};
        participants.forEach((p, i) => {
          shares[p] = toUsdc(row.shares[i]);
          settled[p] = row.settled[i];
        });
        return {
          id: Number(row.id),
          payer: row.payer.toLowerCase(),
          description: row.description,
          category: row.category,
          total: toUsdc(row.totalAmount),
          createdAt: Number(row.createdAt),
          participants,
          shares,
          settled,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [query.data]);

  return {
    members,
    obligations,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useManagerFlags(roomId: number | null, members: string[]) {
  const query = useReadContracts({
    contracts: members.map((member) => ({
      ...base,
      functionName: "isManager" as const,
      args: roomId ? ([BigInt(roomId), member as Address] as const) : undefined,
    })),
    query: { enabled: isBusinessV2Enabled && !!roomId && members.length > 0, refetchInterval: POLL_MS },
  });

  return useMemo(() => {
    const map: Record<string, boolean> = {};
    members.forEach((member, i) => {
      map[member] = Boolean(query.data?.[i]?.result);
    });
    return map;
  }, [members, query.data]);
}

/** Exact open amount the connected wallet owes each other member, straight from the contract. */
export function useOwedTo(roomId: number | null, debtor: string | null, creditors: string[]) {
  const query = useReadContracts({
    contracts: creditors.map((creditor) => ({
      ...base,
      functionName: "owedBetween" as const,
      args:
        roomId && debtor
          ? ([BigInt(roomId), debtor as Address, creditor as Address] as const)
          : undefined,
    })),
    query: {
      enabled: isBusinessV2Enabled && !!roomId && !!debtor && creditors.length > 0,
      refetchInterval: POLL_MS,
    },
  });

  const units = useMemo(() => {
    const map: Record<string, bigint> = {};
    creditors.forEach((creditor, i) => {
      map[creditor] = (query.data?.[i]?.result as bigint | undefined) ?? 0n;
    });
    return map;
  }, [creditors, query.data]);

  return { units, isLoading: query.isLoading, refetch: query.refetch };
}

export function useCreditPosition(account?: string | null) {
  const query = useReadContract({
    ...base,
    functionName: "getCreditPosition",
    args: account ? [account as Address] : undefined,
    query: { enabled: isBusinessV2Enabled && !!account, refetchInterval: POLL_MS },
  });

  const data = query.data as
    | {
        supplied: bigint;
        borrowed: bigint;
        borrowInterest: bigint;
        debt: bigint;
        borrowLimit: bigint;
        available: bigint;
        poolLiquidity: bigint;
      }
    | undefined;

  const position: CreditPosition | null = data
    ? {
        supplied: toUsdc(data.supplied),
        borrowed: toUsdc(data.borrowed),
        interest: toUsdc(data.borrowInterest),
        debt: toUsdc(data.debt),
        limit: toUsdc(data.borrowLimit),
        available: toUsdc(data.available),
        liquidity: toUsdc(data.poolLiquidity),
      }
    : null;

  return { position, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch };
}

export function useAgentPolicy(roomId: number | null, owner?: string | null, agent?: string | null) {
  const enabled =
    isBusinessV2Enabled && !!roomId && !!owner && !!agent && isAddress(agent ?? "");
  const query = useReadContract({
    ...base,
    functionName: "getAgentPolicy",
    args: enabled ? [BigInt(roomId!), owner as Address, agent as Address] : undefined,
    query: { enabled, refetchInterval: POLL_MS },
  });

  const raw = query.data as
    | {
        active: boolean;
        validAfter: bigint;
        validUntil: bigint;
        periodSeconds: bigint;
        periodStartedAt: bigint;
        maxPerRun: bigint;
        maxPerPeriod: bigint;
        spentThisPeriod: bigint;
      }
    | undefined;

  const policy: AgentPolicy | null =
    raw && raw.active
      ? {
          active: raw.active,
          validAfter: Number(raw.validAfter),
          validUntil: Number(raw.validUntil),
          periodSeconds: Number(raw.periodSeconds),
          periodStartedAt: Number(raw.periodStartedAt),
          maxPerRun: toUsdc(raw.maxPerRun),
          maxPerPeriod: toUsdc(raw.maxPerPeriod),
          spentThisPeriod: toUsdc(raw.spentThisPeriod),
          remainingThisPeriod: Math.max(0, toUsdc(raw.maxPerPeriod - raw.spentThisPeriod)),
        }
      : null;

  return { policy, isLoading: query.isLoading, refetch: query.refetch };
}

export function useUsdcBalance(account?: string | null) {
  const query = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    chainId: arcTestnet.id,
    functionName: "balanceOf",
    args: account ? [account as Address] : undefined,
    query: { enabled: !!account, refetchInterval: POLL_MS },
  });
  return {
    balance: toUsdc(query.data as bigint | undefined),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Maps a raw viem/contract error onto plain financial language. */
export function readableError(error: unknown): string {
  const message = (error as Error)?.message ?? "Transaction failed.";
  const known: Record<string, string> = {
    EmptyBatch: "Select at least one counterparty.",
    BatchTooLarge: `A batch can settle at most ${MAX_BATCH_COUNTERPARTIES} counterparties.`,
    DuplicateCreditor: "The same counterparty was selected twice.",
    NothingToSettle: "There is nothing outstanding with the selected counterparties.",
    TransferFailed: "The USDC transfer failed. Check your balance and approval.",
    DuplicateParticipant: "A participant was listed twice.",
    SharesMismatch: "Shares must add up to the total amount.",
    NotAMember: "That address is not a member of this workspace.",
    TooManyParticipants: "Too many participants on a single obligation.",
    InvalidExpense: "Enter a description and a positive amount.",
    InvalidSplits: "Each participant needs exactly one share.",
    "exceeds credit limit": "That exceeds your 50% credit limit.",
    "insufficient pool liquidity": "The credit pool does not hold enough USDC right now.",
    "would exceed credit limit": "Withdrawing that much would push you past your credit limit.",
    "nothing to repay": "You have no outstanding debt.",
    "amount exceeds supply": "You have not supplied that much collateral.",
    "agent not authorised": "This agent has no active policy for that workspace.",
    "outside run cap": "The amount is outside the agent's per-run limit.",
    "outside period cap": "The agent has used its allowance for this period.",
  };
  for (const [needle, friendly] of Object.entries(known)) {
    if (message.includes(needle)) return friendly;
  }
  if (/User rejected|denied transaction/i.test(message)) return "Wallet request rejected.";
  return message.split("\n")[0];
}
