// Server-only Nest write handler: verifies a wallet signature, then performs the
// write with the service-role client. Browsers cannot write these tables directly.

import { verifyMessage } from "viem";
import { buildNestMessage, type NestAction } from "./nest-message";

type Input = {
  action: NestAction;
  wallet: string;
  ts: number;
  signature: string;
  payload: Record<string, unknown>;
};

type Json = string | number | null;
type Result = { ok: true; data?: Record<string, Json> } | { ok: false; error: string };

const MAX_AGE_MS = 5 * 60 * 1000;

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function handleNestWrite(input: Input): Promise<Result> {
  const wallet = input.wallet.toLowerCase();

  if (Math.abs(Date.now() - input.ts) > MAX_AGE_MS) {
    return { ok: false, error: "Signature expired. Please try again." };
  }

  let valid = false;
  try {
    valid = await verifyMessage({
      address: wallet as `0x${string}`,
      message: buildNestMessage({
        action: input.action,
        wallet,
        ts: input.ts,
        payload: input.payload,
      }),
      signature: input.signature as `0x${string}`,
    });
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, error: "Wallet signature could not be verified." };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  switch (input.action) {
    case "claim_profile": {
      const name = str(input.payload.name);
      if (name.length < 2 || name.length > 40) {
        return { ok: false, error: "Name must be 2–40 characters." };
      }
      // A wallet keeps exactly one permanent name: re-claiming is idempotent.
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("wallet,name,created_at")
        .eq("wallet", wallet)
        .maybeSingle();
      if (existing) return { ok: true, data: existing };

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .upsert({ wallet, name }, { onConflict: "wallet", ignoreDuplicates: true })
        .select("wallet,name,created_at")
        .maybeSingle();
      if (error) {
        if (error.code === "23505") {
          return { ok: false, error: "That name is already claimed by another wallet. Pick another." };
        }
        return { ok: false, error: "Could not claim that name." };
      }
      if (data) return { ok: true, data };

      // Raced with a parallel claim from the same wallet — return the stored row.
      const { data: current } = await supabaseAdmin
        .from("profiles")
        .select("wallet,name,created_at")
        .eq("wallet", wallet)
        .maybeSingle();
      return current
        ? { ok: true, data: current }
        : { ok: false, error: "Could not claim that name." };
    }

    case "add_roommate": {
      const target = str(input.payload.wallet).toLowerCase();
      const name = str(input.payload.name);
      if (!/^0x[0-9a-f]{40}$/.test(target)) return { ok: false, error: "Invalid wallet address." };
      if (target === wallet) return { ok: false, error: "That's your own wallet." };
      if (!name) return { ok: false, error: "Name is required." };
      const { error } = await supabaseAdmin.from("roommates").insert({
        owner_wallet: wallet,
        owner_name: str(input.payload.ownerName) || null,
        wallet: target,
        name,
      });
      if (error) {
        if (error.code === "23505") return { ok: false, error: "That wallet is already a roommate." };
        return { ok: false, error: "Could not add roommate." };
      }
      return { ok: true };
    }

    case "delete_roommate": {
      const id = str(input.payload.id);
      if (!id) return { ok: false, error: "Missing roommate id." };
      const { error } = await supabaseAdmin
        .from("roommates")
        .delete()
        .eq("id", id)
        .eq("owner_wallet", wallet);
      if (error) return { ok: false, error: "Could not remove roommate." };
      return { ok: true };
    }

    case "create_request": {
      const to = str(input.payload.toWallet).toLowerCase();
      const amount = Number(input.payload.amount);
      if (!/^0x[0-9a-f]{40}$/.test(to)) return { ok: false, error: "Invalid wallet address." };
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
        return { ok: false, error: "Invalid amount." };
      }
      const note = str(input.payload.note).slice(0, 200);
      const { data, error } = await supabaseAdmin
        .from("payment_requests")
        .insert({
          from_wallet: wallet,
          from_name: str(input.payload.fromName) || null,
          to_wallet: to,
          to_name: str(input.payload.toName) || null,
          amount,
          note: note || null,
        })
        .select("id")
        .single();
      if (error) return { ok: false, error: "Could not create request." };
      return { ok: true, data };
    }

    case "update_request": {
      const id = str(input.payload.id);
      const status = str(input.payload.status);
      if (!["paid", "declined", "cancelled"].includes(status)) {
        return { ok: false, error: "Invalid status." };
      }
      const { data: row } = await supabaseAdmin
        .from("payment_requests")
        .select("id,from_wallet,to_wallet,status")
        .eq("id", id)
        .maybeSingle();
      if (!row) return { ok: false, error: "Request not found." };
      if (row.status !== "pending") return { ok: false, error: "Request is already resolved." };

      const allowed =
        status === "cancelled" ? row.from_wallet === wallet : row.to_wallet === wallet;
      if (!allowed) return { ok: false, error: "You cannot change this request." };

      const txHash = str(input.payload.txHash);
      if (status === "paid" && !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
        return { ok: false, error: "Invalid transaction hash." };
      }

      const { error } = await supabaseAdmin
        .from("payment_requests")
        .update({
          status,
          tx_hash: status === "paid" ? txHash : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "pending");
      if (error) return { ok: false, error: "Could not update request." };
      return { ok: true };
    }
  }
}
