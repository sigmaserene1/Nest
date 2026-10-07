import type { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import { SocialLoginProvider } from "@circle-fin/w3s-pw-web-sdk";
import {
  circleConfig,
  circleEmailToken,
  circleInitUser,
  circleWallet,
  circleContractCall,
  circleSign,
  circleLatestTxHash,
  circleSponsorGas,
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

/** Styles Circle's secure code/PIN window to match Nest (follows light/dark mode). */
function applyNestTheme(s: W3SSdk) {
  const dark = document.documentElement.classList.contains("dark");
  const brand = "#e64a45";
  s.setThemeColor({
    backdrop: dark ? "#05060a" : "#0b0d12",
    backdropOpacity: 0.55,
    bg: dark ? "#111318" : "#ffffff",
    divider: dark ? "#23262e" : "#eceef2",
    textMain: dark ? "#f4f5f7" : "#0b0d12",
    textMain2: dark ? "#d5d8de" : "#272a31",
    textAuxiliary: dark ? "#8b909a" : "#6b7280",
    textAuxiliary2: dark ? "#6b7079" : "#9aa0aa",
    textPlaceholder: dark ? "#5c616b" : "#a3a8b1",
    textInteractive: brand,
    success: "#16a34a",
    error: "#dc2626",
    inputBg: dark ? "#0b0d12" : "#f7f8fa",
    inputText: dark ? "#f4f5f7" : "#0b0d12",
    inputBorderFocused: brand,
    inputBorderFocusedError: "#dc2626",
    pinDotBase: dark ? "#23262e" : "#eceef2",
    pinDotBaseBorder: dark ? "#2f333c" : "#dfe2e7",
    pinDotActivated: brand,
    enteredPinText: dark ? "#f4f5f7" : "#0b0d12",
    mainBtnBg: brand,
    mainBtnBgOnHover: "#d43c37",
    mainBtnBgDisabled: dark ? "#2a1514" : "#f6c9c7",
    mainBtnText: "#ffffff",
    mainBtnTextOnHover: "#ffffff",
    mainBtnTextDisabled: "#ffffff",
  });
  s.setResources({
    fontFamily: {
      name: "Figtree",
      url: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap",
    },
  });
  // Nest-branded wording for Circle's setup screens.
  s.setLocalizations({
    common: { continue: "Continue", confirm: "Confirm", retry: "Try again" },
    securityIntros: {
      headline: "Set up your Nest wallet",
      headline2: "Secure your wallet",
      description: "Choose a PIN and a recovery question. They protect your wallet on every device.",
    },
    newPincode: { headline: "Create your PIN", headline2: "Create your PIN", subhead: "You'll use this PIN to approve payments." },
    confirmNewPincode: { headline: "Confirm your PIN", headline2: "Confirm your PIN", subhead: "Enter the same PIN again." },
    enterPincode: { headline: "Enter your PIN" },
    securityQuestions: { title: "Recovery question" },
    emailOtp: { title: "Check your email", subtitle: "Enter the code we sent you.", resend: "Resend code" },
    socialEmailConfirm: { title: "Confirm your email", headline: "Confirm your email" },
  });
}

let sdkPromise: Promise<W3SSdk> | null = null;
let loginHandler: ((err: { message?: string } | undefined, r: any) => void) | null = null;

async function sdk() {
  if (!sdkPromise) {
    sdkPromise = (async () => {
      const { appId } = await circleConfig();
      if (!appId) throw new Error("Circle email login is not configured.");
      // Circle's SDK dependencies expect Node's `process`/`Buffer` globals.
      const g = globalThis as any;
      if (!g.process) {
        g.process = {
          env: {},
          browser: true,
          version: "",
          versions: {},
          nextTick: (fn: (...a: unknown[]) => void, ...args: unknown[]) => queueMicrotask(() => fn(...args)),
        };
      } else {
        g.process.env ??= {};
        g.process.nextTick ??= (fn: (...a: unknown[]) => void, ...args: unknown[]) => queueMicrotask(() => fn(...args));
      }
      if (!g.Buffer) g.Buffer = (await import("buffer")).Buffer;
      const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");
      const instance = new W3SSdk({ appSettings: { appId } }, (err, r) => loginHandler?.(err, r));
      applyNestTheme(instance);
      return instance;
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

/** Shared steps after Circle confirms the sign-in: create/restore the wallet. */
async function finishLogin(login: { userToken: string; encryptionKey: string }, email: string): Promise<CircleSession> {
  const s = await sdk();
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
  return finishLogin(login, email);
}

const GOOGLE_PENDING_KEY = "nest.circle.googlePending";

/**
 * Google login: redirects the page to Google, then back here. The result is
 * picked up by resumeGoogleLogin() on the next page load.
 */
export async function loginWithGoogle(): Promise<void> {
  const s = await sdk();
  window.localStorage.setItem(GOOGLE_PENDING_KEY, "1");
  const { SocialLoginProvider } = await import("@circle-fin/w3s-pw-web-sdk");
  await s.performLogin(SocialLoginProvider.Google);
}

/** After the Google redirect back, complete the login and create/restore the wallet. */
export async function resumeGoogleLogin(): Promise<CircleSession | null> {
  if (typeof window === "undefined" || !window.localStorage.getItem(GOOGLE_PENDING_KEY)) return null;
  window.localStorage.removeItem(GOOGLE_PENDING_KEY);
  const s = await sdk();
  const { appId } = await circleConfig();
  const login = await new Promise<{ userToken: string; encryptionKey: string; email?: string }>((resolve, reject) => {
    loginHandler = (err, r) => {
      loginHandler = null;
      if (err || !r?.userToken) reject(new Error(err?.message || "Google sign-in failed."));
      else resolve({ userToken: r.userToken, encryptionKey: r.encryptionKey, email: r?.oAuthInfo?.socialUserInfo?.email });
    };
    // Re-registering configs makes the SDK process the redirect result in the URL.
    s.updateConfigs({ appSettings: { appId } }, (err, r) => loginHandler?.(err, r));
  });
  return finishLogin(login, login.email ?? "Google account");
}

function requireSession() {
  const s = getCircleSession();
  if (!s) throw new Error("Your email session expired. Please sign in again.");
  return s;
}

export async function circleSendTransaction(tx: { to: string; data?: string; value?: string }) {
  const session = requireSession();
  const s = await sdk();
  // Sponsor gas for new/empty email wallets before asking Circle to send.
  await circleSponsorGas({ data: { userToken: session.userToken } }).catch(() => null);
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
