import type { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import { decodeFunctionData, formatUnits } from "viem";
import { EXPENSE_MANAGER_ABI } from "@/contracts/expense-manager-artifact";
import { ARC_USDC_ADDRESS } from "@/lib/arc-network";
import {
  circleConfig,
  circleEmailToken,
  circleSocialToken,
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

/** Styles Circle's secure code/PIN window to match Nest (follows light/dark mode). */
function applyNestTheme(s: W3SSdk) {
  const dark = document.documentElement.classList.contains("dark");
  const brand = "#E53935";
  const brandHover = "#D32F2F";
  const bg = dark ? "#111318" : "#FBFAF8";
  const raised = dark ? "#171A20" : "#FFFFFF";
  const text = dark ? "#F7F7F8" : "#17181C";
  const muted = dark ? "#9CA0AA" : "#6B7280";
  const border = dark ? "#2B3038" : "#E7E3DE";

  s.setThemeColor({
    backdrop: "#0B0D12",
    backdropOpacity: 0.58,
    bg,
    divider: border,

    textMain: text,
    textMain2: text,
    textAuxiliary: muted,
    textAuxiliary2: muted,
    textSummary: text,
    textSummaryHighlight: brand,
    textPlaceholder: dark ? "#717680" : "#9AA0A8",
    textDetailToggle: muted,
    textInteractive: brand,
    interactiveBg: dark ? "#241719" : "#FFF0EF",

    tooltipText: text,
    tooltipBg: raised,

    inputText: text,
    inputBg: raised,
    inputBgDisabled: dark ? "#15171C" : "#F4F2EF",
    inputBorderFocused: brand,
    inputBorderFocusedError: "#DC2626",

    pinDotBase: raised,
    pinDotBaseBorder: border,
    pinDotActivated: brand,
    enteredPinText: text,

    dropdownBg: raised,
    dropdownBorderIsOpen: brand,
    dropdownBorderError: "#DC2626",

    mainBtnBg: brand,
    mainBtnBgOnHover: brandHover,
    mainBtnBgDisabled: dark ? "#4B2425" : "#F3B8B5",
    mainBtnText: "#FFFFFF",
    mainBtnTextOnHover: "#FFFFFF",
    mainBtnTextDisabled: "#FFFFFF",

    secondBtnText: text,
    secondBtnTextOnHover: brand,
    secondBtnTextDisabled: muted,
    secondBtnBorder: border,
    secondBtnBorderOnHover: brand,
    secondBtnBorderDisabled: border,
    secondBtnBgOnHover: dark ? "#211619" : "#FFF4F3",

    plainBtnText: brand,
    plainBtnTextOnHover: brandHover,
    plainBtnTextDisabled: muted,
    plainBtnBg: "transparent",
    plainBtnBgOnHover: dark ? "#211619" : "#FFF4F3",

    success: "#16A34A",
    error: "#DC2626",
  });

  s.setResources({
    emailIcon: "https://nestarc.xyz/favicon.ico",
    fontFamily: {
      name: "Plus Jakarta Sans",
      url: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    },
  });

  // Circle owns the secure OTP input itself, but its supported customization
  // API lets Nest control the surrounding copy, typography and colors.
  s.setLocalizations({
    common: {
      continue: "Continue",
      confirm: "Confirm",
      retry: "Try again",
    },
    securityIntros: {
      headline: "Secure your Nest wallet",
      headline2: "One last security step",
      description: "Set up wallet security so only you can approve actions from Nest.",
    },
    newPincode: {
      headline: "Create your Nest PIN",
      headline2: "Create your Nest PIN",
      subhead: "Use this PIN to approve protected wallet actions.",
    },
    confirmNewPincode: {
      headline: "Confirm your Nest PIN",
      headline2: "Confirm your Nest PIN",
      subhead: "Enter the same PIN again.",
    },
    enterPincode: { headline: "Enter your Nest PIN" },
    securityQuestions: { title: "Recovery question" },
    emailOtp: {
      title: "Verify your email",
      subtitle: "Enter the secure code from your email to continue to Nest.",
      resendHint: "Didn't get the email?",
      resend: "Send another code",
    },
    socialEmailConfirm: {
      title: "Confirm your email",
      headline: "Confirm your email",
    },
  });
}


function styleCircleSecurePopup() {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const ensure = () => {
    const iframe = document.getElementById("sdkIframe") as HTMLIFrameElement | null;
    if (!iframe) return false;

    const isMobile = window.matchMedia("(max-width: 640px)").matches;

    // Circle's hosted verification UI is designed as a full-viewport secure
    // iframe. On phones, do not squeeze it into Nest's desktop popup shell:
    // shrinking/transformed cross-origin iframes can clip the OTP controls and
    // make touch/focus unreliable when the mobile keyboard opens.
    if (isMobile) {
      document.getElementById("nest-circle-backdrop")?.remove();

      iframe.width = "100%";
      iframe.height = "100%";
      Object.assign(iframe.style, {
        position: "fixed",
        inset: "0",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100dvh",
        maxWidth: "none",
        maxHeight: "none",
        margin: "0",
        transform: "none",
        border: "0",
        borderRadius: "0",
        overflow: "visible",
        boxShadow: "none",
        background: "#FBFAF8",
        zIndex: "2147483647",
        pointerEvents: "auto",
        touchAction: "auto",
      });
      return true;
    }

    let backdrop = document.getElementById("nest-circle-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "nest-circle-backdrop";
      Object.assign(backdrop.style, {
        position: "fixed",
        inset: "0",
        zIndex: "2147483646",
        background: "rgba(11,13,18,.58)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      });
      document.body.appendChild(backdrop);
    }

    Object.assign(iframe.style, {
      width: "min(92vw, 430px)",
      height: "min(78vh, 620px)",
      maxHeight: "620px",
      border: "1px solid rgba(255,255,255,.10)",
      borderRadius: "28px",
      overflow: "hidden",
      boxShadow: "0 28px 80px rgba(0,0,0,.35)",
      background: "#FBFAF8",
    });

    // Circle removes the iframe itself when verification closes. Clean the
    // Nest backdrop at the same time so no overlay can get stranded.
    const observer = new MutationObserver(() => {
      if (!document.getElementById("sdkIframe")) {
        document.getElementById("nest-circle-backdrop")?.remove();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return true;
  };

  if (ensure()) return;
  let tries = 0;
  const timer = window.setInterval(() => {
    tries += 1;
    if (ensure() || tries >= 40) window.clearInterval(timer);
  }, 25);
}

function clearCircleSecurePopup() {
  document.getElementById("nest-circle-backdrop")?.remove();
}

const GOOGLE_PENDING_KEY = "nest.circle.googlePending";
const GOOGLE_CONTEXT_KEY = "nest.circle.googleContext";
export const CIRCLE_AUTH_COMPLETE_KEY = "nest.circle.authComplete";

type GoogleLoginContext = {
  appId: string;
  googleClientId: string;
  deviceToken: string;
  deviceEncryptionKey: string;
  redirectUri: string;
  startedAt: number;
};

function readGoogleContext(): GoogleLoginContext | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(
      window.localStorage.getItem(GOOGLE_CONTEXT_KEY) ?? "null",
    ) as GoogleLoginContext | null;
    if (
      !value?.appId ||
      !value.googleClientId ||
      !value.deviceToken ||
      !value.deviceEncryptionKey ||
      !value.redirectUri ||
      Date.now() - value.startedAt > 10 * 60 * 1000
    ) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function socialLoginConfig(context: GoogleLoginContext) {
  return {
    appSettings: { appId: context.appId },
    loginConfigs: {
      deviceToken: context.deviceToken,
      deviceEncryptionKey: context.deviceEncryptionKey,
      google: {
        clientId: context.googleClientId,
        redirectUri: context.redirectUri,
        selectAccountPrompt: true,
      },
    },
  };
}

let sdkPromise: Promise<W3SSdk> | null = null;
let loginHandler: ((err: { message?: string } | undefined, r: any) => void) | null = null;

async function sdk() {
  if (!sdkPromise) {
    sdkPromise = (async () => {
      const { appId } = await circleConfig();
      if (!appId) throw new Error("Circle wallet login is not configured.");

      // Circle's SDK dependencies expect Node's `process`/`Buffer` globals.
      const g = globalThis as any;
      if (!g.process) {
        g.process = {
          env: {},
          browser: true,
          version: "",
          versions: {},
          nextTick: (fn: (...a: unknown[]) => void, ...args: unknown[]) =>
            queueMicrotask(() => fn(...args)),
        };
      } else {
        g.process.env ??= {};
        g.process.nextTick ??= (fn: (...a: unknown[]) => void, ...args: unknown[]) =>
          queueMicrotask(() => fn(...args));
      }
      if (!g.Buffer) g.Buffer = (await import("buffer")).Buffer;

      const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");
      const pendingGoogle =
        typeof window !== "undefined" &&
        !!window.localStorage.getItem(GOOGLE_PENDING_KEY);
      const savedGoogle = pendingGoogle ? readGoogleContext() : null;
      const initialConfig =
        savedGoogle && savedGoogle.appId === appId
          ? socialLoginConfig(savedGoogle)
          : { appSettings: { appId } };

      // On an OAuth return, Circle checks window.location.hash during SDK
      // construction. The social device credentials therefore MUST be restored
      // in the constructor, not added afterwards.
      const instance = new W3SSdk(initialConfig, (err, r) => loginHandler?.(err, r));
      applyNestTheme(instance);
      return instance;
    })();
    sdkPromise.catch(() => (sdkPromise = null));
  }
  return sdkPromise;
}

type CircleActionTx = {
  to: string;
  data?: string;
  value?: string;
};

type CircleActionCopy = {
  title: string;
  subtitle: string;
  summary: string;
};

const APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

function shortAddress(value: unknown) {
  const address = String(value ?? "");
  return address.length >= 12
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : address;
}

function usdcAmount(value: unknown) {
  try {
    const formatted = formatUnits(BigInt(value as bigint), 6);
    const numeric = Number(formatted);
    return Number.isFinite(numeric)
      ? numeric.toLocaleString(undefined, { maximumFractionDigits: 6 })
      : formatted;
  } catch {
    return "USDC";
  }
}

function describeCircleAction(tx: CircleActionTx): CircleActionCopy {
  const data = tx.data as `0x${string}` | undefined;

  if (data) {
    try {
      const decoded = decodeFunctionData({
        abi: EXPENSE_MANAGER_ABI,
        data,
      });
      const args = (decoded.args ?? []) as readonly unknown[];

      switch (decoded.functionName) {
        case "createRoom": {
          const name = String(args[0] ?? "your home");
          return {
            title: "Create your Nest home",
            subtitle: `Create “${name}” on Arc and finish your Nest setup.`,
            summary: "Home setup",
          };
        }
        case "setDisplayName": {
          const name = String(args[0] ?? "");
          return {
            title: "Set your Nest name",
            subtitle: name
              ? `Use “${name}” as your name inside Nest.`
              : "Save your display name inside Nest.",
            summary: name ? `Name · ${name}` : "Profile setup",
          };
        }
        case "inviteMember": {
          const member = shortAddress(args[1]);
          return {
            title: "Add a member",
            subtitle: `Add ${member} to this Nest home.`,
            summary: `Member · ${member}`,
          };
        }
        case "joinRoom":
          return {
            title: "Join this Nest home",
            subtitle: "Join the shared Nest workspace on Arc.",
            summary: "Join home",
          };
        case "addExpense": {
          const description = String(args[4] ?? "Expense");
          const amount = usdcAmount(args[5]);
          return {
            title: "Add an expense",
            subtitle: `Record ${description} for ${amount} USDC in Nest.`,
            summary: `${amount} USDC · ${description}`,
          };
        }
        case "directTransfer": {
          const recipient = shortAddress(args[1]);
          const amount = usdcAmount(args[2]);
          const note = String(args[3] ?? "").trim();
          return {
            title: `Send ${amount} USDC`,
            subtitle: note
              ? `Pay ${recipient} · ${note}`
              : `Pay ${recipient} from Nest.`,
            summary: `${amount} USDC payment`,
          };
        }
        case "settleWith": {
          const recipient = shortAddress(args[1]);
          return {
            title: "Settle your Nest balance",
            subtitle: `Pay your open balance to ${recipient}.`,
            summary: "Settle balance",
          };
        }
        case "settleSplit":
          return {
            title: "Pay your expense share",
            subtitle: `Settle expense #${String(args[0] ?? "")} in Nest.`,
            summary: "Expense settlement",
          };
      }
    } catch {
      // Not an ExpenseManager call; try known token calls below.
    }

    if (tx.to.toLowerCase() === ARC_USDC_ADDRESS.toLowerCase()) {
      try {
        const decoded = decodeFunctionData({ abi: APPROVE_ABI, data });
        if (decoded.functionName === "approve") {
          const args = (decoded.args ?? []) as readonly unknown[];
          const spender = shortAddress(args[0]);
          const amount = usdcAmount(args[1]);
          return {
            title: "Approve USDC for Nest",
            subtitle: `Allow the Nest contract (${spender}) to use up to ${amount} USDC for this payment.`,
            summary: `${amount} USDC approval`,
          };
        }
      } catch {
        // Fall through to the safe generic Nest copy.
      }
    }
  }

  return {
    title: "Approve Nest action",
    subtitle: "Review this onchain Nest action before confirming.",
    summary: "Nest onchain action",
  };
}

function applyCircleActionCopy(s: W3SSdk, tx: CircleActionTx) {
  const copy = describeCircleAction(tx);
  s.setLocalizations({
    contractInteraction: {
      title: copy.title,
      subtitle: copy.subtitle,
      contractAddressLabel: "Onchain contract",
      totalLabel: "Nest action",
      total: [copy.summary],
      dataDetails: {
        dataDetailsLabel: "Technical details",
        callData: { callDataLabel: "Transaction data" },
        abiInfo: {
          functionNameLabel: "Contract function",
          parametersLabel: "Parameters",
        },
      },
    },
  });
}

function runChallenge(
  s: W3SSdk,
  auth: { userToken: string; encryptionKey: string },
  challengeId: string,
  actionTx?: CircleActionTx,
) {
  applyNestTheme(s);
  if (actionTx) applyCircleActionCopy(s, actionTx);
  s.setAuthentication(auth);
  return new Promise<any>((resolve, reject) => {
    s.execute(challengeId, (err, result) => {
      if (err) reject(new Error(err.message || "Request was cancelled."));
      else resolve(result);
    });
  });
}

async function primeCachedAccountAfterLogin(session: CircleSession) {
  try {
    const [{ pullAccountCache }, { writeChainSnapshot }] = await Promise.all([
      import("@/lib/account-cache"),
      import("@/lib/chain/snapshot-cache"),
    ]);

    const [globalCache, testnetCache, mainnetCache] = await Promise.all([
      pullAccountCache("global"),
      pullAccountCache("testnet"),
      pullAccountCache("mainnet"),
    ]);

    if (globalCache) {
      if (Array.isArray(globalCache.bridgeHistory)) {
        localStorage.setItem(
          `nest.bridge.history.${session.address.toLowerCase()}`,
          JSON.stringify(globalCache.bridgeHistory),
        );
      }
      if (globalCache.agentConfig) {
        localStorage.setItem(
          `nest.agent.cfg.${session.address.toLowerCase()}`,
          JSON.stringify(globalCache.agentConfig),
        );
      }
      if (Array.isArray(globalCache.agentRuns)) {
        localStorage.setItem(
          `nest.agent.log.${session.address.toLowerCase()}`,
          JSON.stringify(globalCache.agentRuns),
        );
      }
    }

    for (const [environment, cache] of [
      ["testnet", testnetCache],
      ["mainnet", mainnetCache],
    ] as const) {
      if (!cache) continue;
      const snapshot = cache.snapshot as import("@/lib/chain/snapshot-cache").NestChainSnapshot | null;
      if (
        snapshot?.version === 1 &&
        snapshot.wallet?.toLowerCase() === session.address.toLowerCase() &&
        snapshot.environment === environment
      ) {
        writeChainSnapshot(snapshot);
      }

      if (Array.isArray(cache.receiptHistory)) {
        localStorage.setItem(
          `nest.receipts.${environment}.${session.address.toLowerCase()}`,
          JSON.stringify(cache.receiptHistory),
        );
      }

      const activeRoom = Number(cache.preferences?.activeRoom ?? 0);
      if (Number.isInteger(activeRoom) && activeRoom > 0) {
        localStorage.setItem(
          `nest.room.${session.address.toLowerCase()}`,
          String(activeRoom),
        );
      }

      const walletBalance = Number(cache.preferences?.walletBalance);
      const walletBalanceAt = Number(cache.preferences?.walletBalanceAt ?? Date.now());
      if (Number.isFinite(walletBalance) && walletBalance >= 0) {
        localStorage.setItem(
          `nest.wallet.balance.${environment}.${session.address.toLowerCase()}`,
          JSON.stringify({
            amount: walletBalance,
            savedAt: Number.isFinite(walletBalanceAt) ? walletBalanceAt : Date.now(),
          }),
        );
      }
    }

    window.dispatchEvent(new Event("storage"));
  } catch {
    // Cache warming is a performance optimization only. Arc/Circle remain the
    // source of truth, so a cache failure must never block authentication.
  }
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

  // Prime the latest verified account snapshot/history in parallel with wagmi
  // reconnecting the embedded wallet. The app can then paint cached state on
  // the first frame while Arc/explorer refreshes silently in the background.
  void primeCachedAccountAfterLogin(session);

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
      clearCircleSecurePopup();
      loginHandler = null;
      if (err || !r?.userToken) reject(new Error(err?.message || "Email verification failed."));
      else resolve({ userToken: r.userToken, encryptionKey: r.encryptionKey });
    };
    s.updateConfigs({ appSettings: { appId }, loginConfigs: tokens }, (err, r) => loginHandler?.(err, r));
    applyNestTheme(s);
    s.verifyOtp();
    styleCircleSecurePopup();
  });
  return finishLogin(login, email);
}

/**
 * Google login: create Circle's social-login device credentials first, then
 * redirect to Google. The context is persisted so Circle can verify the OAuth
 * response after the full-page redirect.
 */
export async function loginWithGoogle(): Promise<void> {
  const s = await sdk();
  const { appId, googleClientId } = await circleConfig();
  if (!appId) throw new Error("Circle wallet login is not configured.");
  if (!googleClientId) {
    throw new Error(
      "Google sign-in needs CIRCLE_GOOGLE_CLIENT_ID in the deployment environment.",
    );
  }

  const deviceId = await s.getDeviceId();
  const tokens = await circleSocialToken({ data: { deviceId } });
  const context: GoogleLoginContext = {
    appId,
    googleClientId,
    deviceToken: tokens.deviceToken,
    deviceEncryptionKey: tokens.deviceEncryptionKey,
    // Keep the OAuth callback on the site root so existing Google Console
    // redirect configuration for https://nestarc.xyz continues to work.
    redirectUri: window.location.origin,
    startedAt: Date.now(),
  };

  window.localStorage.setItem(GOOGLE_CONTEXT_KEY, JSON.stringify(context));
  window.localStorage.setItem(GOOGLE_PENDING_KEY, "1");
  window.localStorage.removeItem(CIRCLE_AUTH_COMPLETE_KEY);

  let startError: Error | null = null;
  loginHandler = (err) => {
    if (err) startError = new Error(err.message || "Google sign-in failed.");
  };

  s.updateConfigs(socialLoginConfig(context), (err, r) => loginHandler?.(err, r));
  applyNestTheme(s);

  // v1.1.x accepts the provider value at runtime but does not export its
  // SocialLoginProvider enum from the package root.
  await (s.performLogin as unknown as (provider: string) => Promise<void>)("Google");

  if (startError) {
    loginHandler = null;
    window.localStorage.removeItem(GOOGLE_PENDING_KEY);
    window.localStorage.removeItem(GOOGLE_CONTEXT_KEY);
    throw startError;
  }
}

/** After the Google redirect back, complete the login and create/restore the wallet. */
export async function resumeGoogleLogin(): Promise<CircleSession | null> {
  if (
    typeof window === "undefined" ||
    !window.localStorage.getItem(GOOGLE_PENDING_KEY)
  ) {
    return null;
  }

  const context = readGoogleContext();
  if (!context) {
    window.localStorage.removeItem(GOOGLE_PENDING_KEY);
    window.localStorage.removeItem(GOOGLE_CONTEXT_KEY);
    throw new Error("Google sign-in expired. Please try again.");
  }

  try {
    const loginPromise = new Promise<{
      userToken: string;
      encryptionKey: string;
      email?: string;
    }>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        loginHandler = null;
        reject(new Error("Google sign-in timed out. Please try again."));
      }, 30_000);

      loginHandler = (err, r) => {
        window.clearTimeout(timeout);
        loginHandler = null;
        if (err || !r?.userToken) {
          reject(new Error(err?.message || "Google sign-in failed."));
          return;
        }
        resolve({
          userToken: r.userToken,
          encryptionKey: r.encryptionKey,
          email: r?.oAuthInfo?.socialUserInfo?.email,
        });
      };
    });

    // sdk() restores the saved social-login config in its constructor. Circle
    // then consumes the Google OAuth hash and calls loginHandler.
    await sdk();
    const login = await loginPromise;
    const session = await finishLogin(login, login.email ?? "Google account");

    window.localStorage.removeItem(GOOGLE_PENDING_KEY);
    window.localStorage.removeItem(GOOGLE_CONTEXT_KEY);
    window.localStorage.setItem(CIRCLE_AUTH_COMPLETE_KEY, "1");
    return session;
  } catch (error) {
    loginHandler = null;
    window.localStorage.removeItem(GOOGLE_PENDING_KEY);
    window.localStorage.removeItem(GOOGLE_CONTEXT_KEY);
    throw error;
  }
}

function requireSession() {
  const s = getCircleSession();
  if (!s) throw new Error("Your email session expired. Please sign in again.");
  return s;
}

export async function circleSendTransaction(tx: { to: string; data?: string; value?: string }) {
  const session = requireSession();
  const s = await sdk();
  // New Circle users are provisioned as SCAs. If a matching Circle Gas
  // Station policy is enabled in Console, Circle sponsors the ERC-4337 gas
  // for this Wallets transaction. Existing legacy EOA users are not silently
  // migrated because doing so would change their Nest wallet address.
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
  await runChallenge(s, session, challengeId, {
    to: tx.to,
    data: tx.data,
    value: tx.value,
  });
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
