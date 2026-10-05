import type { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import {
  circleConfig,
  circleEmailToken,
  circleInitUser,
  circleWallet,
  circleContractCall,
  circleSign,
  circleLatestTxHash,
} from "@/lib/circle-wallet.functions";

/** Browser-only Circle wallet session helpers. */
const SESSION_KEY = "nest.circle.session";

export type CircleSession = {
  userToken: string;
  encryptionKey: string;
  walletId: string;
  address: `0x${string}`;
  email: string;
  createdAt: number;
};

export function getCircleSession(): CircleSession | null {
  if (typeof window === "undefined") return null;
  try {
    const s = JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? "null") as CircleSession | null;
    // Circle user tokens are short-lived; require a fresh login after ~55 min.
    if (!s || Date.now() - s.createdAt > 55 * 60 * 1000) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearCircleSession() {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent?.(new Event("nest-circle-session"));
}

let sdkPromise: Promise<W3SSdk> | null = null;
let loginHandler: ((err: { message?: string } | undefined, r: any) => void) | null = null;

async function sdk() {
  if (!sdkPromise) {
    sdkPromise = (async () => {
      const { appId } = await circleConfig();
      if (!appId) throw new Error("Circle email login is not configured.");
      const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");
      return new W3SSdk({ appSettings: { appId } }, (err, r) => loginHandler?.(err, r));
    })();
    sdkPromise.catch(() => (sdkPromise = null));
  }
  return sdkPromise;
}

function runChallenge(s: W3SSdk, auth: { userToken: string; encryptionKey: string }, challengeId: string) {
  s.setAuthentication(auth);
  return new Promise<any>((resolve, reject) => {
    s.execute(challengeId, (err, result) => {
      if (err) reject(new Error(err.message || "Request was cancelled."));
      else resolve(result);
    });
  });
}

/** Full email login: Circle shows its own code screen, then the wallet is created/restored. */
export async function loginWithEmail(email: string): Promise<CircleSession> {
  const s = await sdk();
  const deviceId = await s.getDeviceId();
  const tokens = await circleEmailToken({ data: { email, deviceId } });
  const { appId } = await circleConfig();
  const login = await new Promise<{ userToken: string; encryptionKey: string }>((resolve, reject) => {
    loginHandler = (err, r) => {
      loginHandler = null;
      if (err || !r?.userToken) reject(new Error(err?.message || "Email verification failed."));
      else resolve({ userToken: r.userToken, encryptionKey: r.encryptionKey });
    };
    s.updateConfigs({ appSettings: { appId }, loginConfigs: tokens }, (err, r) => loginHandler?.(err, r));
    s.verifyOtp();
  });

  const init = await circleInitUser({ data: { userToken: login.userToken } });
  if (init.challengeId) await runChallenge(s, login, init.challengeId);

  let wallet = null;
  for (let i = 0; i < 10 && !wallet; i++) {
    wallet = await circleWallet({ data: { userToken: login.userToken } });
    if (!wallet) await new Promise((r) => setTimeout(r, 1500));
  }
  if (!wallet) throw new Error("Your wallet is still being created. Try again in a moment.");

  const session: CircleSession = {
    ...login,
    walletId: wallet.walletId,
    address: wallet.address as `0x${string}`,
    email,
    createdAt: Date.now(),
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("nest-circle-session"));
  return session;
}

function requireSession() {
  const s = getCircleSession();
  if (!s) throw new Error("Your email session expired. Please sign in again.");
  return s;
}

export async function circleSendTransaction(tx: { to: string; data?: string; value?: string }) {
  const session = requireSession();
  const s = await sdk();
  const since = new Date(Date.now() - 5000).toISOString();
  const { challengeId } = await circleContractCall({
    data: {
      userToken: session.userToken,
      walletId: session.walletId,
      to: tx.to,
      data: tx.data ?? "0x",
      value: tx.value ? BigInt(tx.value).toString() : "0",
    },
  });
  await runChallenge(s, session, challengeId);
  for (let i = 0; i < 40; i++) {
    const r = await circleLatestTxHash({ data: { userToken: session.userToken, walletId: session.walletId, since } });
    if (r.txHash) return r.txHash as `0x${string}`;
    if (r.failed) throw new Error(`Transaction failed: ${r.failed}`);
    await new Promise((res) => setTimeout(res, 1500));
  }
  throw new Error("Transaction submitted but not yet confirmed. Check your activity shortly.");
}

export async function circleSignPayload(kind: "message" | "typedData", payload: string) {
  const session = requireSession();
  const s = await sdk();
  const { challengeId } = await circleSign({
    data: { userToken: session.userToken, walletId: session.walletId, kind, payload },
  });
  const result = await runChallenge(s, session, challengeId);
  const sig = result?.data?.signature;
  if (!sig) throw new Error("Signature was not returned.");
  return sig as `0x${string}`;
}
