// Server-only transaction recorder.
// Every write is validated against the Arc Testnet chain itself: we look the
// transaction up by hash and only trust what the RPC reports. No wallet
// signature prompt is needed, so the client payment flow stays untouched.

import { createPublicClient, http } from "viem";
import { arcTestnet } from "./wagmi";

type RecordInput = {
  txHash: string;
  fromWallet: string;
  toWallet: string;
  toName?: string | null;
  amount: number;
  mode: string;
  note?: string | null;
};

type FinalizeInput = { txHash: string };

type Result = { ok: true; status?: string } | { ok: false; error: string };

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(arcTestnet.rpcUrls.default.http[0]),
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The chain is the source of truth for "who sent this tx". */
async function senderOf(hash: `0x${string}`, attempts = 4): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const tx = await publicClient.getTransaction({ hash });
      if (tx?.from) return tx.from.toLowerCase();
    } catch {
      /* not propagated yet */
    }
    if (i < attempts - 1) await sleep(700);
  }
  return null;
}

export async function recordTransaction(input: RecordInput): Promise<Result> {
  const hash = input.txHash.toLowerCase() as `0x${string}`;
  const from = input.fromWallet.toLowerCase();
  const to = input.toWallet.toLowerCase();

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, error: "Invalid amount." };
  }

  const chainSender = await senderOf(hash);
  if (!chainSender) return { ok: false, error: "Transaction not found on Arc Testnet." };
  if (chainSender !== from) return { ok: false, error: "Sender does not match this transaction." };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("transactions").upsert(
    {
      tx_hash: hash,
      from_wallet: from,
      to_wallet: to,
      to_name: input.toName?.slice(0, 80) || null,
      amount: input.amount,
      mode: input.mode.slice(0, 20),
      note: input.note?.slice(0, 200) || null,
      status: "pending",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tx_hash", ignoreDuplicates: true },
  );
  if (error) return { ok: false, error: "Could not save transaction." };
  return { ok: true, status: "pending" };
}

export async function finalizeTransaction(input: FinalizeInput): Promise<Result> {
  const hash = input.txHash.toLowerCase() as `0x${string}`;

  let status: "confirmed" | "failed";
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash });
    status = receipt.status === "success" ? "confirmed" : "failed";
  } catch {
    return { ok: false, error: "Receipt not available yet." };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .update({
      status,
      error: status === "failed" ? "Transaction reverted onchain." : null,
      updated_at: new Date().toISOString(),
    })
    .eq("tx_hash", hash)
    .select("tx_hash");
  if (error) return { ok: false, error: "Could not update transaction." };
  if (!data?.length) return { ok: false, error: "Transaction not recorded yet." };
  return { ok: true, status };
}
