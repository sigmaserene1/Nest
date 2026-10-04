import { useCallback, useEffect, useState } from "react";
import { useConnect } from "wagmi";
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
 * Email sign-in through Circle User-Controlled Wallets. Circle sends and
 * checks the email code in its own secure window, then the user's Circle
 * wallet is connected to the app through wagmi.
 */
export function useEmailAuth() {
  const { connectAsync, connectors } = useConnect();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = async () => {
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
      }
      setReady(true);
    };
    void sync();
    const onChange = () => void sync();
    window.addEventListener("nest-circle-session", onChange);
    return () => window.removeEventListener("nest-circle-session", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectors]);

  const signIn = useCallback(async (email: string) => {
    const { loginWithEmail } = await import("@/lib/circle-sdk");
    await loginWithEmail(email);
  }, []);

  const signOut = useCallback(async () => {
    clearActiveEmbeddedSession();
  }, []);

  return { ready, userId: session?.address ?? null, email: session?.email ?? null, signIn, signOut };
}
