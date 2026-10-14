import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PrivyClient } from "@privy-io/node";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";
import { NEST_PRIVY_APP_ID } from "@/lib/privy-config";

const accessTokenSchema = z.string().min(20).max(10000);

/**
 * Public, non-sensitive readiness check. A public Privy app ID does not
 * guarantee that its server secret or Circle wallet credentials are present.
 * Without them OTP can succeed while wallet creation always fails.
 */
export const privyCircleSignInStatus = createServerFn({ method: "GET" })
  .handler(async () => {
    const backendAppId = (process.env["PRIVY_APP_ID"] ??
      process.env["VITE_PRIVY_APP_ID"] ?? NEST_PRIVY_APP_ID).trim();
    const publicAppId = (process.env["VITE_PRIVY_APP_ID"] ?? NEST_PRIVY_APP_ID).trim();
    const configured = Boolean(
      backendAppId &&
      process.env["PRIVY_APP_SECRET"]?.trim() &&
      process.env["CIRCLE_API_KEY"]?.trim() &&
      process.env["CIRCLE_APP_ID"]?.trim()
    );
    return { ready: configured && backendAppId === publicAppId };
  });

function getPrivyClient() {
  const appId =
    process.env["PRIVY_APP_ID"] ??
    process.env["VITE_PRIVY_APP_ID"] ??
    NEST_PRIVY_APP_ID;
  const appSecret = process.env["PRIVY_APP_SECRET"] ?? "";
  if (!appId || !appSecret) {
    throw new Error("Privy email login is not configured on the server.");
  }
  return new PrivyClient({ appId, appSecret });
}

function getCircleClient() {
  const apiKey = process.env["CIRCLE_API_KEY"] ?? "";
  if (!apiKey) throw new Error("Circle wallet login is not configured.");
  return initiateUserControlledWalletsClient({ apiKey });
}

function alreadyExists(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as { code?: unknown }).code) === 155101
  );
}

async function circleUserIdForPrivy(privyUserId: string) {
  const normalized = privyUserId.trim();
  if (!normalized) {
    throw new Error("Privy returned an invalid authenticated user.");
  }

  // Circle accepts an application-owned user ID. Use a stable, compact,
  // alphanumeric identifier derived from Privy's verified DID rather than
  // passing provider punctuation or an undefined field through to Circle.
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");

  return `nestprivy${hex.slice(0, 32)}`;
}

/**
 * Verifies the Privy access token server-side, then creates/restores the
 * Circle user-controlled wallet identity mapped to that Privy user.
 *
 * Privy is only the authentication layer. Circle remains the wallet layer.
 */
export const circleSessionFromPrivy = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ accessToken: accessTokenSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const privy = getPrivyClient();

    let verified: Awaited<
      ReturnType<ReturnType<ReturnType<typeof privy.utils>["auth"]>["verifyAccessToken"]>
    >;
    try {
      verified = await privy.utils().auth().verifyAccessToken(data.accessToken);
    } catch {
      throw new Error(
        "Privy session verification failed. Check that the server Privy secret belongs to this Privy app.",
      );
    }

    const userId = await circleUserIdForPrivy(verified.user_id);
    const circle = getCircleClient();

    try {
      await circle.createUser({ userId });
    } catch (error) {
      if (!alreadyExists(error)) throw error;
    }

    const tokenResponse = await circle.createUserToken({ userId });
    const userToken = tokenResponse.data?.userToken;
    const encryptionKey = tokenResponse.data?.encryptionKey;
    if (!userToken || !encryptionKey) {
      throw new Error("Circle did not return a wallet session.");
    }

    const walletsResponse = await circle.listWallets({ userToken });
    const existing = walletsResponse.data?.wallets?.find(
      (wallet) => wallet.blockchain === "ARC-TESTNET",
    );

    if (existing) {
      return {
        userToken,
        encryptionKey,
        challengeId: null as string | null,
      };
    }

    const pin = await circle.createUserPinWithWallets({
      userToken,
      accountType: "SCA",
      blockchains: ["ARC-TESTNET"],
    });

    return {
      userToken,
      encryptionKey,
      challengeId: pin.data?.challengeId ?? null,
    };
  });
