/**
 * Funds exactly one first-workspace gas stipend on Arc Testnet for an
 * authenticated, linked Privy embedded wallet.
 *
 * NOTE: Circle Gas Station sponsors Circle smart wallets, not Nest's Privy
 * EOA; Privy's managed sponsorship currently does not list Arc. Instead the
 * EXISTING Nest gasless relayer sends a tiny amount of Arc *native USDC*
 * to pay first-workspace gas. No additional sponsor wallet is created.
 * The funded wallet signs its own createRoom transaction; no custody changes.
 *
 * No anonymous faucet: Privy JWT verification + linked-wallet lookup +
 * database uniqueness + nonempty workspace check + reserve budget. Fail
 * closed when Supabase, the sponsor key, or the Privy service is unconfigured.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PrivyClient } from "@privy-io/node";
import { createPublicClient, createWalletClient, http, isAddress, parseEther, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXPENSE_MANAGER_ABI } from "@/contracts/expense-manager-artifact";
import { arcTestnet } from "@/lib/arc-network";
import { TESTNET_EXPENSE_MANAGER_ADDRESS } from "@/lib/chain/config";
import { NEST_PRIVY_APP_ID } from "@/lib/privy-config";

const REQUEST = z.object({
  accessToken: z.string().min(20).max(10_000),
  walletAddress: z.string().refine((value) => isAddress(value), "Invalid wallet address"),
});
const CREDIT = parseEther("0.07"); // 0.07 testnet USDC in Arc's 18-decimal native units
const MIN_USER_BALANCE = parseEther("0.02");
const MIN_SPONSOR_RESERVE = parseEther("0.4");

function sponsorWallet() {
  // Re-use the Arc Testnet signer already configured for the existing
  // EIP-3009 gasless relayer (src/lib/gasless.functions.ts). This change
  // does not introduce a second key or require a second funded wallet.
  // Existing server-side authentication, one-time claims and reserve checks
  // restrict payouts before the shared signer is ever used.
  const raw = String(process.env["DEPLOYER_PRIVATE_KEY"] ?? "").trim();
  const normalized = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) {
    throw new Error("Nest's existing gasless sponsor is not configured on this server. Use the Circle Testnet Faucet.");
  }
  return privateKeyToAccount(normalized as `0x${string}`);
}

function privy() {
  const appId = (process.env.PRIVY_APP_ID ??
    process.env.VITE_PRIVY_APP_ID ?? NEST_PRIVY_APP_ID).trim();
  const appSecret = String(process.env.PRIVY_APP_SECRET ?? "").trim();
  if (!appId || !appSecret) {
    throw new Error("Privy server verification is not configured.");
  }
  return new PrivyClient({ appId, appSecret });
}

const rpcTransport = http(arcTestnet.rpcUrls.default.http[0], { timeout: 15_000, retryCount: 2 });

export const fundFirstWorkspaceGas = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => REQUEST.parse(data))
  .handler(async ({ data }) => {
    const walletAddress = data.walletAddress as Address;
    const api = privy();
    const verified = await api.utils().auth().verifyAccessToken(data.accessToken);
    if (!verified.user_id) throw new Error("Sign in with your Privy email wallet first.");

    // An arbitrary JWT must NOT be usable to drain the sponsor into unrelated
    // addresses. Query Privy itself and require the token holder owns wallet.
    const linkedUser = await api.users().getByWalletAddress({ address: walletAddress });
    if (!linkedUser || linkedUser.id !== verified.user_id) {
      throw new Error("This address is not linked to your verified Privy session.");
    }
    const linkedWallet = linkedUser.linked_accounts?.some((account) =>
      account.type === "wallet" &&
      "address" in account &&
      typeof account.address === "string" &&
      account.address.toLowerCase() === walletAddress.toLowerCase() &&
      "wallet_client_type" in account &&
      account.wallet_client_type === "privy",
    );
    if (!linkedWallet) throw new Error("Only the verified Privy embedded wallet can receive gas credit.");

    const account = sponsorWallet();
    const publicClient = createPublicClient({ chain: arcTestnet, transport: rpcTransport });

    const [recipientBalance, sponsorBalance, existingRooms] = await Promise.all([
      publicClient.getBalance({ address: walletAddress }),
      publicClient.getBalance({ address: account.address }),
      publicClient.readContract({
        address: TESTNET_EXPENSE_MANAGER_ADDRESS,
        abi: EXPENSE_MANAGER_ABI,
        functionName: "getRooms",
        args: [walletAddress],
      }),
    ]);

    if (recipientBalance >= MIN_USER_BALANCE) {
      return { status: "already-funded" as const };
    }
    if (existingRooms.length > 0) {
      throw new Error("Your workspace already exists. The one-time onboarding gas credit is for new workspaces only.");
    }
    if (sponsorBalance < CREDIT + MIN_SPONSOR_RESERVE) {
      throw new Error("Nest's existing testnet gasless sponsor needs a refill. Use the Circle Faucet meanwhile.");
    }
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("One-time gas-credit tracking is not configured. Use the Circle Faucet.");
    }

    // The generated DB type intentionally does not expose this admin-only
    // table; the migration provides its schema and unique constraints.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as SupabaseClient;
    // Reserve BEFORE sending to avoid duplicates across server instances.
    // A stuck reservation is intentionally fail-closed, never a second payout.
    const { error: claimError } = await db.from("nest_onboarding_gas_grants").insert({
      privy_user_id: verified.user_id,
      wallet_address: walletAddress.toLowerCase(),
      amount_usdc: "0.07",
      status: "reserved",
    });
    if (claimError) {
      if (claimError.code === "23505") {
        throw new Error("Your one-time testnet gas credit has already been claimed. Use the Circle Faucet for additional gas.");
      }
      throw new Error("Gas credit is temporarily unavailable. Use the Circle Faucet.");
    }

    const wallet = createWalletClient({ account, chain: arcTestnet, transport: rpcTransport });
    // Sponsor bears this transaction's gas; the recipient's signing keys
    // stay exclusively in the Privy embedded wallet.
    const hash = await wallet.sendTransaction({
      to: walletAddress,
      value: CREDIT,
    });
    await db.from("nest_onboarding_gas_grants")
      .update({ status: "sent", tx_hash: hash })
      .eq("privy_user_id", verified.user_id);
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
    if (receipt.status !== "success") throw new Error("The gas credit transfer did not succeed.");
    return { status: "funded" as const };
  });
