// Cloud-backed transaction history (replaces the old localStorage tx store).
// Rows are written server-side after being verified against Arc Testnet, and
// read straight from the database so history survives refresh, logout and
// device changes.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { recordTx, finalizeTx } from "./tx-remote.functions";
import type { ActionMode } from "@/components/nest/action-modal-types";

export type TxStatus = "pending" | "confirmed" | "failed";

export type StoredTx = {
  hash: string;
  from: string;
  to: string;
  amount: number;
  mode: ActionMode;
  note?: string;
  recipientName?: string;
  createdAt: string;
  status: TxStatus;
  error?: string;
};

type TxRow = {
  tx_hash: string;
  from_wallet: string;
  to_wallet: string;
  to_name: string | null;
  amount: number | string;
  mode: string;
  note: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

function toStoredTx(r: TxRow): StoredTx {
  return {
    hash: r.tx_hash,
    from: r.from_wallet,
    to: r.to_wallet,
    amount: Number(r.amount),
    mode: (r.mode as ActionMode) ?? "send",
    note: r.note ?? undefined,
    recipientName: r.to_name ?? undefined,
    createdAt: r.created_at,
    status: (r.status as TxStatus) ?? "pending",
    error: r.error ?? undefined,
  };
}

/** Save a freshly broadcast transfer. Never throws — history must not break payments. */
export async function saveTransaction(input: {
  txHash: string;
  fromWallet: string;
  toWallet: string;
  toName?: string;
  amount: number;
  mode: ActionMode;
  note?: string;
}) {
  try {
    await recordTx({
      data: {
        txHash: input.txHash,
        fromWallet: input.fromWallet,
        toWallet: input.toWallet,
        toName: input.toName ?? null,
        amount: input.amount,
        mode: input.mode,
        note: input.note ?? null,
      },
    });
  } catch {
    /* history is best-effort */
  }
}

/** Settle a stored transaction's status from the onchain receipt. */
export async function finalizeTransactionStatus(txHash: string) {
  // The insert may still be in flight when the receipt lands, so retry once.
  for (let i = 0; i < 3; i++) {
    try {
      const res = (await finalizeTx({ data: { txHash } })) as { ok: boolean };
      if (res?.ok) return;
    } catch {
      /* history is best-effort */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

/** Live transaction history for the connected wallet (sent + received). */
export function useTxHistory(): StoredTx[] {
  const { address } = useArcWallet();
  const me = address?.toLowerCase() ?? null;
  const [rows, setRows] = useState<StoredTx[]>([]);

  const refetch = useCallback(async () => {
    if (!me) {
      setRows([]);
      return;
    }
    const { data } = await supabase
      .from("transactions")
      .select("tx_hash,from_wallet,to_wallet,to_name,amount,mode,note,status,error,created_at")
      .or(`from_wallet.ilike.${me},to_wallet.ilike.${me}`)
      .order("created_at", { ascending: false })
      .limit(1000);
    const next = ((data as TxRow[]) ?? []).map(toStoredTx);
    setRows(next);

    // Self-heal: a tab that closed mid-payment can leave rows stuck on
    // "pending". Settle them from the chain so a re-login shows the truth.
    for (const tx of next) {
      if (tx.status === "pending" && tx.from.toLowerCase() === me) {
        void finalizeTx({ data: { txHash: tx.hash } }).catch(() => {});
      }
    }
  }, [me]);

  useEffect(() => {
    void refetch();
    if (!me) return;

    // Realtime is the fast path; polling + focus refetch guarantee that
    // everything already onchain shows up immediately after a re-login.
    const ch = supabase
      .channel(`transactions-${me}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        void refetch();
      })
      .subscribe();

    const poll = setInterval(() => void refetch(), 8000);
    const onFocus = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      supabase.removeChannel(ch);
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [me, refetch]);

  return rows;
}

