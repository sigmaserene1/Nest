/**
 * Testnet-only first-workspace gas top-up.
 *
 * Reuses Nest's original sponsor/deployer wallet so the current Privy email
 * onboarding flow does not need a second gas-wallet secret. The user keeps
 * control of their own wallet and signs createRoom themselves; the sponsor
 * only sends a small amount of Arc Testnet native USDC for gas.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PrivyClient } from "@privy-io/node";
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  parseEther,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXPENSE_MANAGER_ABI } from "@/contracts/expense-manager-artifact";
import { arcTestnet } from "@/lib/arc-network";
import { TESTNET_EXPENSE_MANAGER_ADDRESS } from "@/lib/chain/config";
import { NEST_PRIVY_APP_ID } from "@/lib/privy-config";

const REQUEST = z.object({
  accessToken: z.string().min(20).max(10_000),
  walletAddress: z.string().refine((value) => isAddress(value), "Invalid wallet address"),
  workspaceName: z.string().min(2).max(80),
});

// First-workspace gas is estimated from the real createRoom call instead of
// assuming a fixed tiny stipend. Arc's native gas asset is USDC with 18 decimals.
const MIN_TARGET_BALANCE = parseEther("0.05");
const MAX_TARGET_BALANCE = parseEther("0.35");
const EXTRA_BUFFER = parseEther("0.01");
const MIN_SPONSOR_RESERVE = parseEther("0.10");
const MAX_TOTAL_GRANT_USDC = 0.35;

function sponsorWallet() {
  // This is the same existing sponsor/deployer secret used by the older Nest
  // gas top-up flow. Never expose this key to the browser.
  const raw = String(process.env.DEPLOYER_PRIVATE_KEY ?? "").trim();
  const normalized = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) {
    throw new Error("Nest testnet gas sponsor is not configured.");
  }
  return privateKeyToAccount(normalized as `0x${string}`);
}

function privy() {
  const appId = (
    process.env.PRIVY_APP_ID ??
    process.env.VITE_PRIVY_APP_ID ??
    NEST_PRIVY_APP_ID
  ).trim();
  const appSecret = String(process.env.PRIVY_APP_SECRET ?? "").trim();
  if (!appId || !appSecret) {
    throw new Error("Privy server verification is not configured.");
  }
  return new PrivyClient({ appId, appSecret });
}

const rpcTransport = http(arcTestnet.rpcUrls.default.http[0], {
  timeout: 15_000,
  retryCount: 2,
});

async function reserveClaim(
  privyUserId: string,
  walletAddress: Address,
  grant: bigint,
) {
  // Keep the anti-repeat ledger when Supabase + the migration are available,
  // but do not make first-workspace onboarding depend on a new database table.
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as SupabaseClient;
    const grantUsdc = Number(grant) / 1e18;

    const { data: existing } = await db
      .from("nest_onboarding_gas_grants")
      .select("amount_usdc,wallet_address")
      .eq("privy_user_id", privyUserId)
      .maybeSingle();

    if (existing) {
      const alreadyGranted = Number(existing.amount_usdc ?? 0);
      const nextTotal = alreadyGranted + grantUsdc;
      if (
        String(existing.wallet_address ?? "").toLowerCase() !==
          walletAddress.toLowerCase() ||
        nextTotal > MAX_TOTAL_GRANT_USDC + 1e-9
      ) {
        throw new Error("Your one-time testnet gas credit has already been used.");
      }

      // Older Nest builds granted only 0.05 USDC, which is no longer enough
      // for current Arc createRoom gas. Permit a bounded recovery top-up while
      // keeping the total lifetime onboarding grant capped.
      await db
        .from("nest_onboarding_gas_grants")
        .update({
          amount_usdc: nextTotal.toFixed(6),
          status: "reserved",
        })
        .eq("privy_user_id", privyUserId);
      return;
    }

    const { error } = await db.from("nest_onboarding_gas_grants").insert({
      privy_user_id: privyUserId,
      wallet_address: walletAddress.toLowerCase(),
      amount_usdc: grantUsdc.toFixed(6),
      status: "reserved",
    });
    if (error?.code === "23505") {
      throw new Error("Your one-time testnet gas credit has already been used.");
    }
    // A missing/unapplied optional ledger must not break onboarding.
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("already been used")
    ) {
      throw error;
    }
  }
}

async function markClaimSent(privyUserId: string, hash: `0x${string}`) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as SupabaseClient;
    await db
      .from("nest_onboarding_gas_grants")
      .update({ status: "sent", tx_hash: hash })
      .eq("privy_user_id", privyUserId);
  } catch {
    // Funding is already confirmed onchain; bookkeeping is optional.
  }
}

export const fundFirstWorkspaceGas = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => REQUEST.parse(data))
  .handler(async ({ data }) => {
    const walletAddress = data.walletAddress as Address;
    const api = privy();
    const verified = await api.utils().auth().verifyAccessToken(data.accessToken);
    if (!verified.user_id) {
      throw new Error("Sign in with your email wallet first.");
    }

    // The verified Privy user must own the exact embedded wallet receiving gas.
    const linkedUser = await api.users().getByWalletAddress({
      address: walletAddress,
    });
    if (!linkedUser || linkedUser.id !== verified.user_id) {
      throw new Error("This wallet is not linked to your verified email session.");
    }

    const linkedWallet = linkedUser.linked_accounts?.some(
      (account) =>
        account.type === "wallet" &&
        "address" in account &&
        typeof account.address === "string" &&
        account.address.toLowerCase() === walletAddress.toLowerCase() &&
        "wallet_client_type" in account &&
        account.wallet_client_type === "privy",
    );
    if (!linkedWallet) {
      throw new Error("Only your verified Nest email wallet can receive the gas credit.");
    }

    const account = sponsorWallet();
    const publicClient = createPublicClient({
      chain: arcTestnet,
      transport: rpcTransport,
    });

    const [recipientBalance, sponsorBalance, existingRooms, gasPrice] =
      await Promise.all([
        publicClient.getBalance({ address: walletAddress }),
        publicClient.getBalance({ address: account.address }),
        publicClient.readContract({
          address: TESTNET_EXPENSE_MANAGER_ADDRESS,
          abi: EXPENSE_MANAGER_ABI,
          functionName: "getRooms",
          args: [walletAddress],
        }),
        publicClient.getGasPrice(),
      ]);

    if (existingRooms.length > 0) {
      return { status: "workspace-exists" as const };
    }

    let estimatedGas: bigint;
    try {
      estimatedGas = await publicClient.estimateContractGas({
        address: TESTNET_EXPENSE_MANAGER_ADDRESS,
        abi: EXPENSE_MANAGER_ABI,
        functionName: "createRoom",
        args: [data.workspaceName],
        account: walletAddress,
      });
    } catch {
      // Keep onboarding recoverable if an RPC estimate endpoint is flaky.
      // This fallback is deliberately generous but still bounded below.
      estimatedGas = 1_000_000n;
    }

    // 50% gas-price buffer + a small fixed cushion avoids opening Privy's
    // approval sheet only to fail because Arc fees moved between estimate/send.
    const estimatedCost = (estimatedGas * gasPrice * 3n) / 2n + EXTRA_BUFFER;
    const targetBalance =
      estimatedCost < MIN_TARGET_BALANCE
        ? MIN_TARGET_BALANCE
        : estimatedCost > MAX_TARGET_BALANCE
          ? MAX_TARGET_BALANCE
          : estimatedCost;

    if (recipientBalance >= targetBalance) {
      return {
        status: "already-funded" as const,
        targetBalance: targetBalance.toString(),
      };
    }

    const grant = targetBalance - recipientBalance;
    if (sponsorBalance < grant + MIN_SPONSOR_RESERVE) {
      throw new Error("Nest's Arc Testnet gas sponsor needs a refill.");
    }

    await reserveClaim(verified.user_id, walletAddress, grant);

    const wallet = createWalletClient({
      account,
      chain: arcTestnet,
      transport: rpcTransport,
    });
    const hash = await wallet.sendTransaction({
      to: walletAddress,
      value: grant,
    });
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 60_000,
    });
    if (receipt.status !== "success") {
      throw new Error("The Nest gas sponsorship transfer failed.");
    }

    await markClaimSent(verified.user_id, hash);
    return {
      status: "funded" as const,
      hash,
      targetBalance: targetBalance.toString(),
      grant: grant.toString(),
    };
  });
