import { useCallback, useEffect, useState } from "react";
import { useConnect, useDisconnect } from "wagmi";
import { EMBEDDED_CONNECTOR_ID, clearActiveEmbeddedSession } from "@/lib/embedded-wallet";

type Session = { address: string; email: string; createdAt: number };

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const s = JSON.parse(window.localStorage.getItem("nest.circle.session") ?? "null") as Session | null;
    return s && Date.now() - s.createdAt < 55 * 60 * 1000 ? s : null;
  } catch {
    return null;
  }
}

/**
 * Sign-in through Circle User-Controlled Wallets. Circle handles email OTP or
 * Google OAuth, then the user's Circle wallet is connected through wagmi.
 */
export function useEmailAuth() {
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let expiryTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const sync = async () => {
      if (expiryTimer) clearTimeout(expiryTimer);

      // Google OAuth returns to the app after Circle completes the provider
      // redirect. Resume that pending flow before reading the local session.
      if (window.localStorage.getItem("nest.circle.googlePending")) {
        try {
          const { resumeGoogleLogin } = await import("@/lib/circle-sdk");
          await resumeGoogleLogin();
        } catch (error) {
          console.error("Could not finish Circle Google sign-in", error);
        }
      }

      if (cancelled) return;
      const s = readSession();
      setSession(s);
      if (s) {
        const connector = connectors.find((c) => c.id === EMBEDDED_CONNECTOR_ID);
        if (connector) {
          try {
            await connectAsync({ connector });
          } catch {
            /* already connected */
          }
        }
        // When the Circle session runs out, disconnect so the app asks the
        // person to sign in again instead of failing every action.
        const remaining = s.createdAt + 55 * 60 * 1000 - Date.now();
        expiryTimer = setTimeout(() => {
          void disconnectAsync().catch(() => {});
          clearActiveEmbeddedSession();
        }, Math.max(0, remaining));
      }
      if (!cancelled) setReady(true);
    };

    void sync();
    const onChange = () => void sync();
    window.addEventListener("nest-circle-session", onChange);
    return () => {
      cancelled = true;
      if (expiryTimer) clearTimeout(expiryTimer);
      window.removeEventListener("nest-circle-session", onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectors]);

  const signIn = useCallback(async (email: string) => {
    const { loginWithEmail } = await import("@/lib/circle-sdk");
    await loginWithEmail(email);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { loginWithGoogle } = await import("@/lib/circle-sdk");
    await loginWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    clearActiveEmbeddedSession();
  }, []);

  return {
    ready,
    userId: session?.address ?? null,
    email: session?.email ?? null,
    signIn,
    signInWithGoogle,
    signOut,
  };
}
