// Canonical read model for a selected Nest Treasury V2 deployment.
// Financial state and agent state come from Arc; browser storage only remembers
// which treasury address the user opened.
/* eslint-disable react-refresh/only-export-components -- provider and its typed hook share one context */

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { formatUnits, zeroAddress } from "viem";
import { NEST_TREASURY_V2_ABI } from "@/contracts/nest-treasury-v2-artifact";
import { arcTestnet } from "@/lib/wagmi";
import { useContractAddress } from "./config";
import {
  computeNetDebts,
  makeMember,
  normalizeCategory,
  setRuntimeMembers,
  type ActivityEvent,
  type Debt,
  type Expense,
  type Member,
} from "@/lib/nest-data";

const REFRESH_MS = 12_000;
const toAmount = (value: bigint) => Number(formatUnits(value, 6));

type RawMember = {
  account: string;
  displayName: string;
  joinedAt: bigint;
  active: boolean;
  admin: boolean;
};

type RawObligation = {
  id: bigint;
  payer: string;
  totalAmount: bigint;
  category: string;
  title: string;
  referenceId: `0x${string}`;
  createdAt: bigint;
  participants: readonly string[];
  shares: readonly bigint[];
};

type RawActivity = {
  kind: number;
  refId: bigint;
  actor: string;
  counterparty: string;
  amount: bigint;
  memoId: `0x${string}`;
  timestamp: bigint;
};

type RawSettlement = {
  id: bigint;
  debtor: string;
  totalAmount: bigint;
  memoId: `0x${string}`;
  createdAt: bigint;
  executedByAgent: boolean;
  agentRunId: bigint;
  creditors: readonly string[];
  amounts: readonly bigint[];
};

type RawAgentPolicy = {
  executor: string;
  maxPerRun: bigint;
  maxPerPeriod: bigint;
  spentThisPeriod: bigint;
  periodIndex: bigint;
  validUntil: bigint;
  lastRunAt: bigint;
  minInterval: number;
  agentId: bigint;
  enabled: boolean;
};

type RawAgentRun = {
  id: bigint;
  agentId: bigint;
  executor: string;
  account: string;
  amount: bigint;
  paymentCount: bigint;
  memoId: `0x${string}`;
  createdAt: bigint;
};

const EMPTY_MEMBERS: readonly RawMember[] = [];
const EMPTY_OBLIGATIONS: readonly RawObligation[] = [];
const EMPTY_ACTIVITY: readonly RawActivity[] = [];
const EMPTY_SETTLEMENTS: readonly RawSettlement[] = [];
const EMPTY_AGENT_RUNS: readonly RawAgentRun[] = [];

export type RoomInfo = { id: number; name: string; creator: string; createdAt: number };

export type SettlementRecord = {
  id: string;
  debtorId: string;
  total: number;
  memoId: `0x${string}`;
  date: string;
  byAgent: boolean;
  agentRunId: string | null;
  payments: { creditorId: string; amount: number }[];
};

export type AgentPolicyRecord = {
  executor: string;
  agentId: string;
  enabled: boolean;
  maxPerRun: number;
  maxPerPeriod: number;
  spentThisPeriod: number;
  minInterval: number;
  validUntil: number | null;
  lastRunAt: number | null;
};

export type AgentRunRecord = {
  id: string;
  agentId: string;
  executor: string;
  account: string;
  amount: number;
  paymentCount: number;
  memoId: `0x${string}`;
  date: string;
};

type ChainState = {
  contractAddress: `0x${string}` | null;
  protocolVersion: number | null;
  owner: string | null;
  isMember: boolean;
  isAdmin: boolean;
  me: string | null;
  myName: string | null;
  rooms: RoomInfo[];
  roomId: number | null;
  room: RoomInfo | null;
  selectRoom: (id: number | null) => void;
  members: Member[];
  expenses: Expense[];
  activity: ActivityEvent[];
  settlements: SettlementRecord[];
  agentPolicy: AgentPolicyRecord | null;
  agentRuns: AgentRunRecord[];
  usdcAllowance: number;
  net: Record<string, number>;
  debts: Debt[];
  isLoading: boolean;
  isError: boolean;
  rpcMessage: string;
  refresh: () => Promise<void>;
};

const Ctx = createContext<ChainState | null>(null);

export function NestChainProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const contractAddress = useContractAddress();
  const readAccount = address ?? zeroAddress;
  const enabled = Boolean(contractAddress && address);
  const base = {
    address: contractAddress ?? undefined,
    abi: NEST_TREASURY_V2_ABI,
    chainId: arcTestnet.id,
  } as const;

  const chainQ = useReadContracts({
    contracts: [
      { ...base, functionName: "VERSION" },
      { ...base, functionName: "treasuryName" },
      { ...base, functionName: "owner" },
      { ...base, functionName: "createdAt" },
      { ...base, functionName: "getMembers" },
      { ...base, functionName: "getBalances" },
      { ...base, functionName: "getRecentObligations", args: [100n] },
      { ...base, functionName: "getActivity", args: [150n] },
      { ...base, functionName: "getRecentSettlements", args: [50n] },
      { ...base, functionName: "getAgentPolicy", args: [readAccount] },
      { ...base, functionName: "getRecentAgentRuns", args: [25n] },
      { ...base, functionName: "usdcAllowance", args: [readAccount] },
      { ...base, functionName: "isMember", args: [readAccount] },
    ],
    allowFailure: true,
    query: { enabled, refetchInterval: REFRESH_MS },
  });

  const resultAt = useCallback(
    <T,>(index: number): T | undefined => {
      const entry = chainQ.data?.[index];
      return entry?.status === "success" ? (entry.result as T) : undefined;
    },
    [chainQ.data],
  );

  const versionRaw = resultAt<bigint>(0);
  const protocolVersion = versionRaw == null ? null : Number(versionRaw);
  const treasuryName = resultAt<string>(1) ?? "Onchain treasury";
  const owner = (resultAt<string>(2) ?? "").toLowerCase() || null;
  const createdAt = Number(resultAt<bigint>(3) ?? 0n);
  const rawMembers = resultAt<readonly RawMember[]>(4) ?? EMPTY_MEMBERS;
  const balanceTuple = resultAt<readonly [readonly string[], readonly bigint[]]>(5);
  const rawObligations = resultAt<readonly RawObligation[]>(6) ?? EMPTY_OBLIGATIONS;
  const rawActivity = resultAt<readonly RawActivity[]>(7) ?? EMPTY_ACTIVITY;
  const rawSettlements = resultAt<readonly RawSettlement[]>(8) ?? EMPTY_SETTLEMENTS;
  const rawPolicy = resultAt<RawAgentPolicy>(9);
  const rawAgentRuns = resultAt<readonly RawAgentRun[]>(10) ?? EMPTY_AGENT_RUNS;
  const allowanceRaw = resultAt<bigint>(11) ?? 0n;
  const membership = resultAt<boolean>(12) ?? false;

  const members = useMemo(
    () =>
      rawMembers
        .filter((member) => member.active)
        .map((member) => makeMember(member.account, member.displayName, member.admin)),
    [rawMembers],
  );

  useEffect(() => {
    if (members.length > 0) setRuntimeMembers(members);
  }, [members]);

  const expenses = useMemo<Expense[]>(
    () =>
      rawObligations.map((item) => {
        const participants = item.participants.map((participant) => participant.toLowerCase());
        const shares: Record<string, number> = {};
        const settled: Record<string, boolean> = {};
        participants.forEach((participant, index) => {
          shares[participant] = toAmount(item.shares[index] ?? 0n);
          settled[participant] = participant === item.payer.toLowerCase();
        });
        return {
          id: String(item.id),
          title: item.title,
          category: normalizeCategory(item.category),
          amount: toAmount(item.totalAmount),
          payerId: item.payer.toLowerCase(),
          splitAmong: participants,
          shares,
          settled,
          referenceId: item.referenceId,
          date: new Date(Number(item.createdAt) * 1000).toISOString(),
        } satisfies Expense;
      }),
    [rawObligations],
  );

  const net = useMemo(() => {
    const next: Record<string, number> = {};
    const accounts = balanceTuple?.[0] ?? [];
    const balances = balanceTuple?.[1] ?? [];
    accounts.forEach((account, index) => {
      next[account.toLowerCase()] = toAmount(balances[index] ?? 0n);
    });
    return next;
  }, [balanceTuple]);

  const debts = useMemo(() => computeNetDebts(members, net), [members, net]);

  const settlements = useMemo<SettlementRecord[]>(
    () =>
      rawSettlements.map((item) => ({
        id: String(item.id),
        debtorId: item.debtor.toLowerCase(),
        total: toAmount(item.totalAmount),
        memoId: item.memoId,
        date: new Date(Number(item.createdAt) * 1000).toISOString(),
        byAgent: item.executedByAgent,
        agentRunId: item.agentRunId > 0n ? String(item.agentRunId) : null,
        payments: item.creditors.map((creditor, index) => ({
          creditorId: creditor.toLowerCase(),
          amount: toAmount(item.amounts[index] ?? 0n),
        })),
      })),
    [rawSettlements],
  );

  const activity = useMemo<ActivityEvent[]>(() => {
    const expenseById = new Map(expenses.map((expense) => [expense.id, expense]));
    return rawActivity.map((item, index) => {
      const kindNumber = Number(item.kind);
      const expense = expenseById.get(String(item.refId));
      const kind: ActivityEvent["kind"] =
        kindNumber === 0
          ? "treasury"
          : kindNumber === 1 || kindNumber === 2
            ? "member"
            : kindNumber === 3
              ? "expense"
              : kindNumber === 4
                ? "settlement"
                : kindNumber === 5
                  ? "policy"
                  : "agent";
      const text =
        kindNumber === 0
          ? "launched this onchain treasury"
          : kindNumber === 1
            ? "added a treasury member"
            : kindNumber === 2
              ? "updated an onchain profile"
              : kindNumber === 3
                ? `recorded ${expense?.title ?? "an obligation"}`
                : kindNumber === 4
                  ? "settled a net balance in USDC"
                  : kindNumber === 5
                    ? "updated an onchain agent policy"
                    : "executed a spend-capped agent run";
      const counterparty = item.counterparty.toLowerCase();
      return {
        id: `${kindNumber}-${String(item.refId)}-${String(item.timestamp)}-${index}`,
        kind,
        actorId: item.actor.toLowerCase(),
        counterpartyId: counterparty === zeroAddress ? undefined : counterparty,
        text,
        amount: item.amount > 0n ? toAmount(item.amount) : undefined,
        category: expense?.category,
        memoId: item.memoId,
        date: new Date(Number(item.timestamp) * 1000).toISOString(),
      } satisfies ActivityEvent;
    });
  }, [expenses, rawActivity]);

  const agentPolicy = useMemo<AgentPolicyRecord | null>(
    () =>
      rawPolicy
        ? {
            executor: rawPolicy.executor.toLowerCase(),
            agentId: String(rawPolicy.agentId),
            enabled: rawPolicy.enabled,
            maxPerRun: toAmount(rawPolicy.maxPerRun),
            maxPerPeriod: toAmount(rawPolicy.maxPerPeriod),
            spentThisPeriod: toAmount(rawPolicy.spentThisPeriod),
            minInterval: Number(rawPolicy.minInterval),
            validUntil: rawPolicy.validUntil > 0n ? Number(rawPolicy.validUntil) : null,
            lastRunAt: rawPolicy.lastRunAt > 0n ? Number(rawPolicy.lastRunAt) : null,
          }
        : null,
    [rawPolicy],
  );

  const agentRuns = useMemo<AgentRunRecord[]>(
    () =>
      rawAgentRuns.map((run) => ({
        id: String(run.id),
        agentId: String(run.agentId),
        executor: run.executor.toLowerCase(),
        account: run.account.toLowerCase(),
        amount: toAmount(run.amount),
        paymentCount: Number(run.paymentCount),
        memoId: run.memoId,
        date: new Date(Number(run.createdAt) * 1000).toISOString(),
      })),
    [rawAgentRuns],
  );

  const me = address?.toLowerCase() ?? null;
  const myRawMember = rawMembers.find((member) => member.account.toLowerCase() === me);
  const myName = myRawMember?.displayName || null;
  const isAdmin = Boolean(myRawMember?.admin || (owner && owner === me));
  const isV2 = protocolVersion === 2;
  const hasAccess = Boolean(isV2 && membership);
  const room: RoomInfo | null = hasAccess
    ? { id: 1, name: treasuryName, creator: owner ?? zeroAddress, createdAt }
    : null;
  const invalidContract = Boolean(
    contractAddress && !chainQ.isLoading && !chainQ.isError && protocolVersion !== 2,
  );
  const isError = Boolean(chainQ.isError || invalidContract);
  const rpcMessage = invalidContract
    ? "This address is not a Nest Treasury V2 contract. Open a V2 invite or launch a new treasury."
    : "Arc reads are temporarily unavailable. No sample balances are shown; retry to restore live state.";

  const refresh = useCallback(async () => {
    await chainQ.refetch();
  }, [chainQ]);

  const value: ChainState = {
    contractAddress,
    protocolVersion,
    owner,
    isMember: hasAccess,
    isAdmin,
    me,
    myName,
    rooms: room ? [room] : [],
    roomId: room ? 1 : null,
    room,
    selectRoom: () => undefined,
    members,
    expenses,
    activity,
    settlements,
    agentPolicy,
    agentRuns,
    usdcAllowance: toAmount(allowanceRaw),
    net,
    debts,
    isLoading: enabled && chainQ.isLoading,
    isError,
    rpcMessage,
    refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNestChain(): ChainState {
  const context = useContext(Ctx);
  if (!context) throw new Error("useNestChain must be used inside <NestChainProvider>");
  return context;
}
