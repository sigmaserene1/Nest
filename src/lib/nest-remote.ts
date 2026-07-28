// Shared (onchain-identity) household data backed by Lovable Cloud.
// Roommates and payment requests are keyed by wallet address so two people
// who connect different wallets see each other and each other's requests.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import type { Member } from "./nest-data";

export type RoommateRow = {
  id: string;
  owner_wallet: string;
  owner_name: string | null;
  wallet: string;
  name: string;
  created_at: string;
};

export type PaymentRequestRow = {
  id: string;
  from_wallet: string;
  from_name: string | null;
  to_wallet: string;
  to_name: string | null;
  amount: number;
  note: string | null;
  status: "pending" | "paid" | "declined" | "cancelled";
  tx_hash: string | null;
  created_at: string;
  updated_at: string;
};

const PALETTE = [
  { color: "#EC4899", gradient: "linear-gradient(135deg,#f9a8d4,#ec4899)", emoji: "🌸" },
  { color: "#0EA5E9", gradient: "linear-gradient(135deg,#7dd3fc,#0284c7)", emoji: "🌊" },
  { color: "#8B5CF6", gradient: "linear-gradient(135deg,#c4b5fd,#7c3aed)", emoji: "🪐" },
  { color: "#14B8A6", gradient: "linear-gradient(135deg,#5eead4,#0d9488)", emoji: "🍀" },
  { color: "#F97316", gradient: "linear-gradient(135deg,#fdba74,#ea580c)", emoji: "🔥" },
  { color: "#6366F1", gradient: "linear-gradient(135deg,#a5b4fc,#4f46e5)", emoji: "🛰️" },
];

function skinFor(wallet: string) {
  let h = 0;
  for (let i = 2; i < wallet.length; i++) h = (h * 31 + wallet.charCodeAt(i)) % 9973;
  return PALETTE[h % PALETTE.length];
}

export function remoteMemberId(wallet: string) {
  return `rw-${wallet.toLowerCase()}`;
}

function toMember(wallet: string, name: string): Member {
  return {
    id: remoteMemberId(wallet),
    name,
    handle: `@${name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "roommate"}`,
    wallet,
    ...skinFor(wallet),
  };
}

/* ------------------------------- roommates ------------------------------- */

export async function insertRoommate(input: {
  ownerWallet: string;
  ownerName: string;
  wallet: string;
  name: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from("roommates").insert({
    owner_wallet: input.ownerWallet.toLowerCase(),
    owner_name: input.ownerName,
    wallet: input.wallet.toLowerCase(),
    name: input.name,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That wallet is already a roommate." };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteRoommateRow(id: string) {
  await supabase.from("roommates").delete().eq("id", id);
}

/** Roommates visible to the connected wallet: people I added + people who added me. */
export function useRemoteRoommates() {
  const { address } = useArcWallet();
  const me = address?.toLowerCase() ?? null;
  const [rows, setRows] = useState<RoommateRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!me) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("roommates")
      .select("*")
      .or(`owner_wallet.eq.${me},wallet.eq.${me}`)
      .order("created_at", { ascending: true });
    setRows((data as RoommateRow[]) ?? []);
    setLoading(false);
  }, [me]);

  useEffect(() => {
    refetch();
    if (!me) return;
    const ch = supabase
      .channel(`roommates-${me}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "roommates" }, () => refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [me, refetch]);

  const members = useMemo(() => {
    if (!me) return [] as Member[];
    const out: Member[] = [];
    const seen = new Set<string>([me]);
    for (const r of rows) {
      // The "other side" of the row relative to me.
      const isOwner = r.owner_wallet === me;
      const wallet = isOwner ? r.wallet : r.owner_wallet;
      const name = (isOwner ? r.name : r.owner_name) || "Roommate";
      if (seen.has(wallet)) continue;
      seen.add(wallet);
      out.push(toMember(wallet, name));
    }
    return out;
  }, [rows, me]);

  /** Rows this wallet created (deletable by me). */
  const ownedIdByWallet = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) if (r.owner_wallet === me) map.set(remoteMemberId(r.wallet), r.id);
    return map;
  }, [rows, me]);

  return { rows, members, ownedIdByWallet, loading, refetch, myWallet: address ?? null };
}

/* ---------------------------- payment requests ---------------------------- */

export async function createPaymentRequest(input: {
  fromWallet: string;
  fromName: string;
  toWallet: string;
  toName?: string;
  amount: number;
  note?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const res = await signedNestWrite("create_request", input.fromWallet, {
    fromName: input.fromName,
    toWallet: input.toWallet,
    toName: input.toName ?? "",
    amount: input.amount,
    note: input.note ?? "",
  });
  if (!res.ok) return res;
  return { ok: true, id: String(res.data?.id ?? "") };
}

function connectedWallet() {
  return getAccount(wagmiConfig).address ?? null;
}

export async function markRequestPaid(id: string, txHash: string) {
  const me = connectedWallet();
  if (!me) return { ok: false as const, error: "Connect your wallet first." };
  return signedNestWrite("update_request", me, { id, status: "paid", txHash });
}

export async function setRequestStatus(id: string, status: "declined" | "cancelled") {
  const me = connectedWallet();
  if (!me) return { ok: false as const, error: "Connect your wallet first." };
  return signedNestWrite("update_request", me, { id, status });
}


export function usePaymentRequests() {
  const { address } = useArcWallet();
  const me = address?.toLowerCase() ?? null;
  const [rows, setRows] = useState<PaymentRequestRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!me) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("payment_requests")
      .select("*")
      .or(`to_wallet.eq.${me},from_wallet.eq.${me}`)
      .order("created_at", { ascending: false });
    setRows(
      ((data as PaymentRequestRow[]) ?? []).map((r) => ({ ...r, amount: Number(r.amount) })),
    );
    setLoading(false);
  }, [me]);

  useEffect(() => {
    refetch();
    if (!me) return;
    const ch = supabase
      .channel(`requests-${me}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_requests" }, () =>
        refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [me, refetch]);

  const incoming = useMemo(() => rows.filter((r) => r.to_wallet === me), [rows, me]);
  const outgoing = useMemo(() => rows.filter((r) => r.from_wallet === me), [rows, me]);

  return {
    rows,
    incoming,
    incomingPending: incoming.filter((r) => r.status === "pending"),
    outgoing,
    outgoingPending: outgoing.filter((r) => r.status === "pending"),
    loading,
    refetch,
    myWallet: address ?? null,
  };
}

/* -------------------------------- profiles ------------------------------- */
// A wallet claims exactly one display name, forever. Names are globally unique,
// so a Nest name always maps back to one real Arc wallet.

export type ProfileRow = { wallet: string; name: string; created_at: string };

export async function fetchProfile(wallet: string): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from("profiles")
    .select("wallet,name,created_at")
    .eq("wallet", wallet.toLowerCase())
    .maybeSingle();
  return (data as ProfileRow) ?? null;
}

export async function claimProfileName(
  wallet: string,
  name: string,
): Promise<{ ok: true; profile: ProfileRow } | { ok: false; error: string }> {
  const existing = await fetchProfile(wallet);
  if (existing) return { ok: false, error: `This wallet is already registered as "${existing.name}".` };

  const res = await signedNestWrite("claim_profile", wallet, { name: name.trim() });
  if (!res.ok) return res;
  return { ok: true, profile: res.data as unknown as ProfileRow };
}

/** The permanent Nest identity for the connected wallet (null until claimed). */
export function useMyProfile() {
  const { address } = useArcWallet();
  const me = address?.toLowerCase() ?? null;
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!me) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setProfile(await fetchProfile(me));
    setLoading(false);
  }, [me]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { profile, loading, refetch, locked: !!profile, myWallet: address ?? null };
}
