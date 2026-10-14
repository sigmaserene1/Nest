import { useEffect, useMemo, useRef, useState } from "react";
import { Mail, Loader2, ArrowLeft, RefreshCw, ShieldCheck, CheckCircle2 } from "lucide-react";
import { OTPInput } from "input-otp";
import { useLoginWithEmail, useToken, useLogout } from "@privy-io/react-auth";
import { useAccount, useConnect } from "wagmi";
import { EMBEDDED_CONNECTOR_ID } from "@/lib/embedded-wallet";
import { Button } from "@/components/ui/button";

type Props = {
  email: string;
  disabled?: boolean;
  onEmailChange: (value: string) => void;
  prepare: (email: string) => boolean;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string | null) => void;
  onAuthenticated: () => void;
};

export function PrivyEmailOtp({
  email,
  disabled = false,
  onEmailChange,
  prepare,
  onBusyChange,
  onError,
  onAuthenticated,
}: Props) {
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { getAccessToken } = useToken();
  const { logout } = useLogout();
  const { address: connectedAddress, isConnected } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"send" | "verify" | "resend" | null>(null);
  const [verified, setVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [walletRetry, setWalletRetry] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);
  const verifyingRef = useRef(false);
  const finishedRef = useRef(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  // Privy may not publish its JWT to the hook on the exact same microtask as
  // loginWithCode resolves. Wait briefly for its verified session rather than
  // requiring the user to request and enter an entirely new OTP.
  const waitForAccessToken = async () => {
    for (const delay of [0, 150, 250, 400, 700]) {
      if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
      const token = await getAccessToken();
      if (token) return token;
    }
    throw new Error("Your email was verified, but the sign-in session isn't ready. Retry wallet connection.");
  };

  const finishWalletLogin = async () => {
    const accessToken = await waitForAccessToken();
    const { loginCircleWalletFromPrivy } = await import("@/lib/circle-sdk");
    const session = await loginCircleWalletFromPrivy(accessToken, normalizedEmail);
    setWalletAddress(session.address);
    setWalletRetry(false);
    setConnectionTimedOut(false);
    setVerified(true);
  };

  // Only enter /app AFTER wagmi has actually restored the Circle wallet.
  // Navigating immediately after the OTP's promise resolves can open the
  // wallet-picker modal over the dashboard and bounce users to the landing page.
  useEffect(() => {
    if (
      !verified || !walletAddress || !isConnected || !connectedAddress ||
      connectedAddress.toLowerCase() !== walletAddress.toLowerCase() ||
      finishedRef.current
    ) return;
    finishedRef.current = true;
    void logout().catch(() => undefined).finally(onAuthenticated);
  }, [verified, walletAddress, isConnected, connectedAddress, logout, onAuthenticated]);

  useEffect(() => {
    if (!verified || !walletAddress || finishedRef.current) return;
    const timer = window.setTimeout(() => {
      setConnectionTimedOut(true);
      onError("Email verified. Nest is waiting for your Circle wallet connection. Tap Retry wallet connection.");
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [verified, walletAddress, onError]);

  const reconnectCircle = async () => {
    if (busy || finishedRef.current) return;
    const connector = connectors.find((candidate) => candidate.id === EMBEDDED_CONNECTOR_ID);
    if (!connector) {
      onError("Circle wallet connector is still loading. Try again shortly.");
      return;
    }
    setBusy("verify");
    onBusyChange(true);
    onError(null);
    setConnectionTimedOut(false);
    try {
      await connectAsync({ connector });
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not reconnect Circle wallet.");
    } finally {
      setBusy(null);
      onBusyChange(false);
    }
  };

  const send = async (resend = false) => {
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      onError("Enter a valid email address.");
      return;
    }
    if (!resend && !prepare(normalizedEmail)) return;
    setBusy(resend ? "resend" : "send");
    onBusyChange(true);
    onError(null);
    try {
      await sendCode({ email: normalizedEmail, disableSignup: false });
      setCode("");
      setVerified(false);
      setEmailVerified(false);
      setWalletRetry(false);
      setWalletAddress(null);
      setStep("code");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not send the verification code.");
    } finally {
      setBusy(null);
      onBusyChange(false);
    }
  };

  const verify = async (completedCode = code) => {
    const candidate = completedCode.replace(/\D/g, "").slice(0, 6);
    if (candidate.length !== 6 || verifyingRef.current || verified || emailVerified) return;

    verifyingRef.current = true;
    setCode(candidate);
    setBusy("verify");
    onBusyChange(true);
    onError(null);
    let otpSucceeded = false;

    try {
      await loginWithCode({ code: candidate });
      otpSucceeded = true;
      setEmailVerified(true);
      await finishWalletLogin();
      // No need for another OTP. Privy is authenticated, while Circle's
      // account is reconnecting asynchronously via useEmailAuth.
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign-in failed.";
      if (otpSucceeded) {
        // Do not log out the verified Privy session after a downstream Circle
        // error. Retrying wallet setup must NOT require another verification code.
        setWalletRetry(true);
        onError(
          /not configured/i.test(message)
            ? "Circle wallet sign-in is not configured on this server. You can use the existing Circle email option instead."
            : `Email verified, but wallet setup failed: ${message}. Tap Retry wallet setup.`,
        );
      } else {
        setCode("");
        onError(message);
      }
    } finally {
      setBusy(null);
      onBusyChange(false);
      verifyingRef.current = false;
    }
  };

  const retryWalletSetup = async () => {
    if (!emailVerified || verifyingRef.current || verified) return;
    verifyingRef.current = true;
    setBusy("verify");
    onBusyChange(true);
    onError(null);
    try {
      await finishWalletLogin();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet setup failed.";
      setWalletRetry(true);
      onError(`Circle wallet setup failed: ${message}`);
    } finally {
      setBusy(null);
      onBusyChange(false);
      verifyingRef.current = false;
    }
  };

  if (step === "code") {
    return (
      <section aria-label="Email verification" className="space-y-5 border-t border-border pt-5">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => {
            if (emailVerified) void logout().catch(() => undefined);
            setStep("email");
            setCode("");
            setVerified(false);
            setEmailVerified(false);
            setWalletRetry(false);
            setWalletAddress(null);
            setConnectionTimedOut(false);
            verifyingRef.current = false;
            onError(null);
          }}
          disabled={!!busy || verified}
          className="h-8 rounded-md px-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Change email
        </Button>

        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            <ShieldCheck className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold">Verify your email</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Code sent to <span className="break-all font-semibold text-foreground">{normalizedEmail}</span>
            </p>
          </div>
        </div>

        <OTPInput
          maxLength={6}
          aria-label="6-digit email verification code"
          autoComplete="one-time-code"
          autoFocus
          pattern="[0-9]*"
          value={code}
          onChange={(value) => {
            setVerified(false);
            setCode(value.replace(/\D/g, "").slice(0, 6));
          }}
          disabled={!!busy || disabled || verified || emailVerified}
          inputMode="numeric"
          containerClassName="grid w-full grid-cols-6 gap-1.5 sm:gap-2"
          render={({ slots }) => (
            <>
              {slots.map((slot, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  className={
                    "relative grid aspect-square min-w-0 place-items-center rounded-[4px] border-2 bg-background font-display text-xl font-semibold tabular-nums transition-[border-color,background-color,box-shadow] motion-reduce:transition-none " +
                    (verified
                      ? "border-success bg-success/10 text-success"
                      : slot.isActive
                        ? "border-brand bg-brand/5 ring-2 ring-brand/15"
                        : slot.char
                          ? "border-foreground/30 text-foreground"
                          : "border-border")
                  }
                >
                  {slot.char ?? ""}
                  {slot.hasFakeCaret ? (
                    <span className="absolute h-5 w-px animate-pulse bg-brand motion-reduce:animate-none" />
                  ) : null}
                </div>
              ))}
            </>
          )}
          onComplete={(value) => { if (!emailVerified) void verify(value); }}
        />

        <Button
          size="lg"
          type="button"
          onClick={() => { if (walletRetry) void retryWalletSetup(); else void verify(code); }}
          disabled={(code.length !== 6 && !walletRetry) || !!busy || disabled || verified}
          className="w-full rounded-lg bg-brand text-brand-foreground shadow-none hover:bg-brand/90"
        >
          {verified ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : busy === "verify" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {verified
            ? "Verified · connecting Circle wallet…"
            : busy === "verify"
              ? "Connecting securely…"
              : walletRetry
                ? "Retry wallet setup"
                : "Verify & continue"}
        </Button>

        {verified && connectionTimedOut ? (
          <Button
            type="button"
            variant="outline"
            disabled={!!busy}
            onClick={() => void reconnectCircle()}
            className="w-full rounded-lg"
          >
            Retry wallet connection
          </Button>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-x-1 text-xs">
          <span className="text-muted-foreground">Didn’t get a code?</span>
        <Button
          variant="link"
          size="sm"
          type="button"
          onClick={() => void send(true)}
          disabled={!!busy || disabled || verified || emailVerified}
          className="h-9 px-1 text-brand"
        >
          {busy === "resend" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {busy === "resend" ? "Sending…" : "Resend code"}
        </Button>
        </div>
        <p role="status" aria-live="polite" className="flex min-h-5 items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          {verified
            ? "Email verified. Connecting your Circle wallet…"
            : emailVerified
              ? "Email verified. Complete Circle wallet setup to continue."
              : busy === "verify"
                ? "Verifying your code…"
                : "Secure, password-free sign in"}
        </p>
      </section>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void send(false);
      }}
      className="space-y-2.5"
    >
      <label htmlFor="nest-privy-email" className="sr-only">
        Email address
      </label>
      <input
        id="nest-privy-email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        disabled={!!busy || disabled}
        className="min-h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:opacity-60"
      />
      <Button
        size="lg"
        type="submit"
        disabled={!!busy || disabled}
        className="w-full rounded-lg bg-brand text-brand-foreground shadow-none hover:bg-brand/90"
      >
        {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {busy === "send" ? "Sending code…" : "Continue with email"}
      </Button>
    </form>
  );
}
