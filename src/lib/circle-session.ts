import { getArcEnvironment, type ArcEnvironment } from "@/lib/arc-network";

/** Browser-only Circle wallet session helpers. */
const SESSION_KEY = "nest.circle.session";

export type CircleSession = {
  userToken: string;
  encryptionKey: string;
  walletId: string;
  address: `0x${string}`;
  email: string;
  createdAt: number;
  environment: ArcEnvironment;
};

export function getCircleSession(): CircleSession | null {
  if (typeof window === "undefined") return null;
  try {
    const s = JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? "null") as CircleSession | null;
    // Circle user tokens are short-lived; require a fresh login after ~55 min.
    // A Circle wallet is network-specific, so never use a Testnet wallet for
    // a Mainnet write (or the reverse).
    const sessionEnvironment: ArcEnvironment =
      s?.environment === "mainnet" ? "mainnet" : "testnet";
    if (
      !s ||
      sessionEnvironment !== getArcEnvironment() ||
      Date.now() - s.createdAt > 55 * 60 * 1000
    ) {
      return null;
    }
    return { ...s, environment: sessionEnvironment };
  } catch {
    return null;
  }
}

