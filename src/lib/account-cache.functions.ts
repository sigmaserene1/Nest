import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const BASE = "https://api.circle.com/v1/w3s";
const CIRCLE_BLOCKCHAIN = "ARC-TESTNET";

const scopeSchema = z.enum(["testnet", "mainnet", "global"]);
const tokenSchema = z.string().min(10).max(4000);

type CacheRow = {
  account_wallet: string;
  scope: "testnet" | "mainnet" | "global";
  snapshot: unknown;
  bridge_history: unknown;
  receipt_history: unknown;
  preferences: unknown;
  agent_config: unknown;
  agent_runs: unknown;
  updated_at: string;
};

function admin() {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"] ?? "";
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function walletForUserToken(userToken: string) {
  const apiKey = process.env["CIRCLE_API_KEY"];
  if (!apiKey) throw new Error("Circle is not configured.");

  const response = await fetch(
    `${BASE}/wallets?blockchain=${CIRCLE_BLOCKCHAIN}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-User-Token": userToken,
      },
    },
  );
  const json = (await response.json().catch(() => ({}))) as {
    data?: { wallets?: Array<{ address?: string }> };
    message?: string;
  };
  if (!response.ok) {
    throw new Error(json.message || "Could not verify Nest account.");
  }
  const address = json.data?.wallets?.[0]?.address?.toLowerCase();
  if (!address || !/^0x[0-9a-f]{40}$/.test(address)) {
    throw new Error("No Circle wallet is available for this account.");
  }
  return address;
}

function safeJsonSize(value: unknown) {
  try {
    return JSON.stringify(value).length;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

const patchSchema = z
  .object({
    snapshot: z.unknown().optional(),
    bridgeHistory: z.unknown().optional(),
    receiptHistory: z.unknown().optional(),
    preferences: z.unknown().optional(),
    agentConfig: z.unknown().optional(),
    agentRuns: z.unknown().optional(),
  })
  .refine((value) => safeJsonSize(value) <= 750_000, {
    message: "Account cache update is too large.",
  });

export const readNestAccountCache = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        userToken: tokenSchema,
        scope: scopeSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const db = admin();
    if (!db) return { configured: false as const, row: null };

    const wallet = await walletForUserToken(data.userToken);
    const { data: row, error } = await db
      .from("nest_account_cache")
      .select(
        "account_wallet,scope,snapshot,bridge_history,receipt_history,preferences,agent_config,agent_runs,updated_at",
      )
      .eq("account_wallet", wallet)
      .eq("scope", data.scope)
      .maybeSingle();

    if (error) throw new Error(`Could not load Nest account cache: ${error.message}`);

    return {
      configured: true as const,
      row: (row as CacheRow | null)
        ? {
            snapshot: row.snapshot ?? null,
            bridgeHistory: row.bridge_history ?? [],
            receiptHistory: row.receipt_history ?? [],
            preferences: row.preferences ?? {},
            agentConfig: row.agent_config ?? null,
            agentRuns: row.agent_runs ?? [],
            updatedAt: row.updated_at,
          }
        : null,
    };
  });

export const patchNestAccountCache = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        userToken: tokenSchema,
        scope: scopeSchema,
        patch: patchSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const db = admin();
    if (!db) return { configured: false as const };

    const wallet = await walletForUserToken(data.userToken);
    const { data: existing, error: readError } = await db
      .from("nest_account_cache")
      .select(
        "snapshot,bridge_history,receipt_history,preferences,agent_config,agent_runs",
      )
      .eq("account_wallet", wallet)
      .eq("scope", data.scope)
      .maybeSingle();

    if (readError) throw new Error(`Could not update Nest account cache: ${readError.message}`);

    const current = (existing ?? {}) as Record<string, unknown>;
    const next = {
      account_wallet: wallet,
      scope: data.scope,
      snapshot:
        data.patch.snapshot !== undefined
          ? data.patch.snapshot
          : (current.snapshot ?? null),
      bridge_history:
        data.patch.bridgeHistory !== undefined
          ? data.patch.bridgeHistory
          : (current.bridge_history ?? []),
      receipt_history:
        data.patch.receiptHistory !== undefined
          ? data.patch.receiptHistory
          : (current.receipt_history ?? []),
      preferences:
        data.patch.preferences !== undefined
          ? data.patch.preferences
          : (current.preferences ?? {}),
      agent_config:
        data.patch.agentConfig !== undefined
          ? data.patch.agentConfig
          : (current.agent_config ?? null),
      agent_runs:
        data.patch.agentRuns !== undefined
          ? data.patch.agentRuns
          : (current.agent_runs ?? []),
      updated_at: new Date().toISOString(),
    };

    const { error } = await db.from("nest_account_cache").upsert(next, {
      onConflict: "account_wallet,scope",
    });
    if (error) throw new Error(`Could not update Nest account cache: ${error.message}`);

    return { configured: true as const };
  });
