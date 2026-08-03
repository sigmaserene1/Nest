// Live onchain state for the active Nest room.
// Everything the UI renders (members, expenses, balances, activity) is read
// from the ExpenseManager contract on Arc Testnet — nothing is cached locally.

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { EXPENSE_MANAGER_ABI } from "@/contracts/expense-manager-artifact";
import { arcTestnet } from "@/lib/wagmi";
import { useActiveRoom, useContractAddress } from "./config";
import { demoActivity, demoExpenses, demoMembers, demoRoom, RPC_DOWN_MESSAGE } from "./demo";
import {
  computeBalances,
  makeMember,
  normalizeCategory,
  setRuntimeMembers,
  type ActivityEvent,
  type Debt,
  type Expense,
  type Member,
} from "@/lib/nest-data";

const REFRESH_MS = 20_000;

export type RoomInfo = { id: number; name: string; creator: string; createdAt: number };

type ChainState = {
  contractAddress: `0x${string}` | null;
  me: string | null;
  myName: string | null;
  rooms: RoomInfo[];
  roomId: number | null;
  room: RoomInfo | null;
  selectRoom: (id: number | null) => void;
  members: Member[];
  expenses: Expense[];
  activity: ActivityEvent[];
  net: Record<string, number>;
  debts: Debt[];
  isLoading: boolean;
  /** True when Arc's public RPC is unreachable and the UI is showing sample data. */
  isDemo: boolean;
  rpcMessage: string;
  refresh: () => Promise<void>;
};


const Ctx = createContext<ChainState | null>(null);

const toNum = (v: bigint) => Number(formatUnits(v, 6));

export function NestChainProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const contractAddress = useContractAddress();
  const { roomId: storedRoom, select } = useActiveRoom(address);

  const base = { address: contractAddress ?? undefined, abi: EXPENSE_MANAGER_ABI, chainId: arcTestnet.id } as const;
  const enabled = !!contractAddress;

  const roomsQ = useReadContract({
    ...base,
    functionName: "getRooms",
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!address, refetchInterval: REFRESH_MS },
  });

  const rooms: RoomInfo[] = useMemo(
    () =>
      ((roomsQ.data as readonly any[] | undefined) ?? []).map((r) => ({
        id: Number(r.id),
        name: r.name as string,
        creator: (r.creator as string).toLowerCase(),
        createdAt: Number(r.createdAt),
      })),
    [roomsQ.data],
  );

  // An invited wallet may not be a member yet — honour the stored room anyway so
  // the invite link resolves straight into the right home.
  const roomId = storedRoom ?? rooms[0]?.id ?? null;

  useEffect(() => {
    if (address && roomId && roomId !== storedRoom) select(roomId);
  }, [address, roomId, storedRoom, select]);

  const roomArgs = roomId ? ([BigInt(roomId)] as const) : undefined;

  const roomQ = useReadContracts({
    contracts: [
      { ...base, functionName: "getRoomMembers", args: roomArgs },
      { ...base, functionName: "getExpenses", args: roomArgs },
      { ...base, functionName: "getActivity", args: roomId ? ([BigInt(roomId), 200n] as const) : undefined },
    ],
    query: { enabled: enabled && !!roomId, refetchInterval: REFRESH_MS },
  });

  const memberAddresses = useMemo(
    () => ((roomQ.data?.[0]?.result as readonly string[] | undefined) ?? []).map((a) => a) as string[],
    [roomQ.data],
  );

  const namesQ = useReadContract({
    ...base,
    functionName: "getDisplayNames",
    args: memberAddresses.length ? [memberAddresses as `0x${string}`[]] : undefined,
    query: { enabled: enabled && memberAddresses.length > 0, refetchInterval: REFRESH_MS * 4 },
  });

  const liveMembers: Member[] = useMemo(() => {
    const names = (namesQ.data as readonly string[] | undefined) ?? [];
    return memberAddresses.map((a, i) => makeMember(a, names[i]));
  }, [memberAddresses, namesQ.data]);

  const liveExpenses: Expense[] = useMemo(() => {
    const raw = (roomQ.data?.[1]?.result as readonly any[] | undefined) ?? [];
    return raw
      .map((e) => {
        const participants = (e.participants as readonly string[]).map((p) => p.toLowerCase());
        const shares: Record<string, number> = {};
        const settled: Record<string, boolean> = {};
        participants.forEach((p, i) => {
          shares[p] = toNum((e.shares as readonly bigint[])[i]);
          settled[p] = (e.settled as readonly boolean[])[i];
        });
        return {
          id: String(e.id),
          title: (e.description as string) || "Expense",
          category: normalizeCategory(e.category as string),
          amount: toNum(e.totalAmount as bigint),
          payerId: (e.payer as string).toLowerCase(),
          splitAmong: participants,
          shares,
          settled,
          date: new Date(Number(e.createdAt) * 1000).toISOString(),
        } satisfies Expense;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [roomQ.data]);

  const liveActivity: ActivityEvent[] = useMemo(() => {
    const raw = (roomQ.data?.[2]?.result as readonly any[] | undefined) ?? [];
    return raw.map((a, i) => {
      const kindNum = Number(a.kind);
      const actor = (a.actor as string).toLowerCase();
      const counterparty = (a.counterparty as string).toLowerCase();
      const amount = toNum(a.amount as bigint);
      const date = new Date(Number(a.timestamp) * 1000).toISOString();
      const kind: ActivityEvent["kind"] =
        kindNum === 0 ? "expense" : kindNum === 1 ? "settlement" : kindNum === 2 ? "transfer" : "member";
      const text =
        kindNum === 0
          ? `added ${a.text as string}`
          : kindNum === 1
            ? "settled a share onchain"
            : kindNum === 2
              ? "sent USDC onchain"
              : "joined the home";
      return {
        id: `${kindNum}-${String(a.refId)}-${Number(a.timestamp)}-${i}`,
        kind,
        actorId: actor,
        counterpartyId: counterparty === "0x0000000000000000000000000000000000000000" ? undefined : counterparty,
        text,
        amount: amount > 0 ? amount : undefined,
        date,
      } satisfies ActivityEvent;
    });
  }, [roomQ.data]);

  const me = address ? address.toLowerCase() : null;

  // Arc's public RPC rate-limits aggressively and occasionally drops requests.
  // When reads fail outright we fall back to a read-only sample home so the
  // product stays navigable; live data resumes on the next successful poll.
  const isDemo = Boolean(contractAddress) && (roomsQ.isError || (Boolean(roomId) && roomQ.isError));

  const members = useMemo(() => (isDemo ? demoMembers(me) : liveMembers), [isDemo, me, liveMembers]);
  const expenses = useMemo(() => (isDemo ? demoExpenses(me) : liveExpenses), [isDemo, me, liveExpenses]);
  const activity = useMemo(() => (isDemo ? demoActivity(me) : liveActivity), [isDemo, me, liveActivity]);

  useEffect(() => {
    if (members.length > 0) setRuntimeMembers(members);
  }, [members]);

  const { net, debts } = useMemo(() => computeBalances(expenses), [expenses, members]);

  const myName = useMemo(() => {
    const found = liveMembers.find((m) => m.id === me);
    return found && found.name !== found.handle ? found.name : null;
  }, [liveMembers, me]);

  const refresh = useCallback(async () => {
    await Promise.all([roomsQ.refetch(), roomQ.refetch(), namesQ.refetch()]);
  }, [roomsQ.refetch, roomQ.refetch, namesQ.refetch]);

  const value: ChainState = {
    contractAddress,
    me,
    myName,
    rooms: isDemo && rooms.length === 0 ? [demoRoom] : rooms,
    roomId,
    room: rooms.find((r) => r.id === roomId) ?? (isDemo ? demoRoom : null),
    selectRoom: select,
    members,
    expenses,
    activity,
    net,
    debts,
    isLoading: !isDemo && (roomsQ.isLoading || roomQ.isLoading),
    isDemo,
    rpcMessage: RPC_DOWN_MESSAGE,
    refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNestChain(): ChainState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNestChain must be used inside <NestChainProvider>");
  return ctx;
}

// Convenience selectors used across screens.
export const useMembers = () => useNestChain().members;
export const useExpenses = () => useNestChain().expenses;
export const useHouseholdActivity = () => useNestChain().activity;
export const useComputedBalances = () => {
  const { net, debts } = useNestChain();
  return { net, debts };
};
export const useMe = () => useNestChain().me ?? "";
