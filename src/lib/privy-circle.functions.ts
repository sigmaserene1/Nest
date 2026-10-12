import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PrivyClient } from "@privy-io/node";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";
import { NEST_PRIVY_APP_ID } from "@/lib/privy-config";

const accessTokenSchema = z.string().min(20).max(10000);

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
    const verified = await privy.utils().auth().verifyAccessToken(data.accessToken);
    const userId = `privy:${verified.user_id}`;
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
