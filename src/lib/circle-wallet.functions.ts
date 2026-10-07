import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Circle User-Controlled Wallets (email + social login) — server side.
 * The Circle API key never leaves the server; the browser only ever holds the
 * short-lived per-user token Circle issues after the email code is verified.
 */
const BASE = "https://api.circle.com/v1/w3s";
export const CIRCLE_BLOCKCHAIN = "ARC-TESTNET";

async function circle(path: string, init: { method?: string; body?: unknown; userToken?: string } = {}) {
  const key = process.env["CIRCLE_API_KEY"];
  if (!key) throw new Error("Circle is not configured.");
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.userToken ? { "X-User-Token": init.userToken } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as { data?: any; code?: number; message?: string };
  if (!res.ok) {
    const err = new Error(json.message || `Circle request failed (${res.status})`) as Error & { code?: number };
    err.code = json.code;
    throw err;
  }
  return json.data;
}

const token = z.string().min(10).max(4000);

export const circleConfig = createServerFn({ method: "GET" }).handler(async () => ({
  appId: process.env["CIRCLE_APP_ID"] ?? "",
  googleClientId:
    process.env["CIRCLE_GOOGLE_CLIENT_ID"] ??
    process.env["GOOGLE_CLIENT_ID"] ??
    process.env["VITE_CIRCLE_GOOGLE_CLIENT_ID"] ??
    process.env["VITE_GOOGLE_CLIENT_ID"] ??
    "",
}));

export const circleEmailToken = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email().max(255), deviceId: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data }) => {
    const r = await circle("/users/email/token", {
      body: { idempotencyKey: crypto.randomUUID(), email: data.email, deviceId: data.deviceId },
    });
    return { deviceToken: r.deviceToken as string, deviceEncryptionKey: r.deviceEncryptionKey as string, otpToken: r.otpToken as string };
  });

/** Creates the device credentials required by Circle before Google OAuth starts. */
export const circleSocialToken = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ deviceId: z.string().min(1).max(500) }).parse(d),
  )
  .handler(async ({ data }) => {
    const r = await circle("/users/social/token", {
      body: { idempotencyKey: crypto.randomUUID(), deviceId: data.deviceId },
    });
    return {
      deviceToken: r.deviceToken as string,
      deviceEncryptionKey: r.deviceEncryptionKey as string,
    };
  });

/**
 * Creates the user's Arc wallet on first login as an ERC-4337 SCA.
 *
 * Circle Gas Station sponsorship applies to Circle SCA wallets when the
 * matching sponsorship policy is enabled in Circle Console. Existing users
 * that were previously initialized with an EOA are intentionally left on that
 * wallet so Nest does not silently change their onchain identity/address.
 */
export const circleInitUser = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ userToken: token }).parse(d))
  .handler(async ({ data }) => {
    try {
      const r = await circle("/user/initialize", {
        userToken: data.userToken,
        body: { idempotencyKey: crypto.randomUUID(), accountType: "SCA", blockchains: [CIRCLE_BLOCKCHAIN] },
      });
      return { challengeId: r.challengeId as string };
    } catch (e) {
      if ((e as { code?: number }).code === 155106) return { challengeId: null };
      throw e;
    }
  });

export const circleWallet = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ userToken: token }).parse(d))
  .handler(async ({ data }) => {
    const r = await circle(`/wallets?blockchain=${CIRCLE_BLOCKCHAIN}`, { userToken: data.userToken });
    const w = (r.wallets ?? [])[0];
    return w ? { walletId: w.id as string, address: w.address as string } : null;
  });

export const circleContractCall = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      userToken: token,
      walletId: z.string().min(1).max(100),
      to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
      data: z.string().regex(/^0x[0-9a-fA-F]*$/).max(200000),
      value: z.string().regex(/^\d+$/).default("0"),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const amount = BigInt(data.value) > 0n ? (Number(data.value) / 1e18).toString() : undefined;
    const r = await circle("/user/transactions/contractExecution", {
      userToken: data.userToken,
      body: {
        idempotencyKey: crypto.randomUUID(),
        walletId: data.walletId,
        contractAddress: data.to,
        callData: data.data === "0x" ? undefined : data.data,
        amount,
        feeLevel: "MEDIUM",
      },
    });
    return { challengeId: r.challengeId as string };
  });

export const circleSign = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      userToken: token,
      walletId: z.string().min(1).max(100),
      kind: z.enum(["message", "typedData"]),
      payload: z.string().min(1).max(50000),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const body =
      data.kind === "message"
        ? { walletId: data.walletId, message: data.payload, encodedByHex: data.payload.startsWith("0x") }
        : { walletId: data.walletId, data: data.payload };
    const r = await circle(data.kind === "message" ? "/user/sign/message" : "/user/sign/typedData", {
      userToken: data.userToken,
      body,
    });
    return { challengeId: r.challengeId as string };
  });

/** Finds the onchain hash of the newest transaction created after `since`. */
export const circleLatestTxHash = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ userToken: token, walletId: z.string().min(1).max(100), since: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const r = await circle(`/transactions?walletIds=${data.walletId}&pageSize=5&from=${encodeURIComponent(data.since)}`, {
      userToken: data.userToken,
    });
    const tx = (r.transactions ?? []).find((t: any) => t.txHash);
    const failed = (r.transactions ?? []).find((t: any) => ["FAILED", "DENIED", "CANCELLED"].includes(t.state));
    return { txHash: (tx?.txHash as string) ?? null, failed: failed ? (failed.errorReason ?? failed.state) : null };
  });
