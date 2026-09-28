import { useCallback, useEffect, useState } from "react";
import { useConnect } from "wagmi";
import { supabase } from "@/integrations/supabase/client";
import {
  EMBEDDED_CONNECTOR_ID,
  getOrCreateEmbeddedAccount,
  clearActiveEmbeddedSession,
} from "@/lib/embedded-wallet";

/**
 * Email sign-in (Lovable Cloud auth) backed by an embedded wallet.
 *
 * Flow: visitor enters their email → we send a 6-digit code → they confirm →
 * an embedded wallet is created (or restored) on their device and connected
 * through wagmi, so the whole app works exactly as if a browser wallet had
 * connected.
 */
export function useEmailAuth() {
  const { connectAsync, connectors } = useConnect();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Track the auth session and wire the embedded wallet into wagmi.
  useEffect(() => {
    let cancelled = false;

    const applySession = async (session: { user: { id: string; email?: string } } | null) => {
      if (cancelled) return;
      if (!session) {
        setUserId(null);
        setEmail(null);
        clearActiveEmbeddedSession();
        return;
      }
      const account = getOrCreateEmbeddedAccount(session.user.id);
      setUserId(session.user.id);
      setEmail(session.user.email ?? null);
      if (account) {
        const connector = connectors.find((c) => c.id === EMBEDDED_CONNECTOR_ID);
        if (connector) {
          try {
            await connectAsync({ connector });
          } catch {
            // Already connected or user switched wallets — fine.
          }
        }
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      void applySession(data.session);
      if (!cancelled) setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // connectors/connectAsync identity is stable enough for this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendCode = useCallback(async (targetEmail: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  const verifyCode = useCallback(async (targetEmail: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: targetEmail,
      token,
      type: "email",
    });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("Sign-in failed. Please try again.");
    return data.session;
  }, []);

  const signOut = useCallback(async () => {
    clearActiveEmbeddedSession();
    await supabase.auth.signOut();
  }, []);

  return { ready, userId, email, sendCode, verifyCode, signOut };
}
