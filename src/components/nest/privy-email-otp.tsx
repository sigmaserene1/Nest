import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { OTPInput } from "input-otp";
import { useLoginWithEmail, useWallets } from "@privy-io/react-auth";
import { useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  PRIVY_CONNECTOR_ID,
  chooseEmailWalletProvider,
} from "@/lib/privy-embedded-wallet";

type Props = {
  email: string;
  disabled?: boolean;
  onEmailChange: (value: string) => void;
  prepare: (email: string) => boolean;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string | null) => void;
  onAuthenticated: () => void;
};

/**
 * Privy email OTP + Privy embedded wallet: no Circle PIN dialog.
 *
 * IMPORTANT: this creates an independent wallet address; it does NOT unlock
 * earlier Circle user-controlled wallets. Both legacy sign-in options remain
 * available from the Nest sign-in dialog.
 */
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
  const { wallets } = useWallets();
  const { isConnected, connector, address } = useAccount();
  const { disconnectAsync } = useDisconnect();

  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"send" | "resend" | "verify" | null>(null);
  const [verified, setVerified] = useState(false);
  const [connectionDelay, setConnectionDelay] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const verifying = useRef(false);
  const finished = useRef(false);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const wallet = wallets.find((candidate) => candidate.walletClientType === "privy");

  useEffect(() => {
    if (!verified || !wallet || !isConnected || connector?.id !== PRIVY_CONNECTOR_ID ||
        address?.toLowerCase() !== wallet.address.toLowerCase() || finished.current) return;
    finished.current = true;
    onAuthenticated();
  }, [verified, wallet, address, isConnected, connector?.id, onAuthenticated]);

  useEffect(() => {
    if (!verified || finished.current) return;
    const timer = window.setTimeout(() => setConnectionDelay(true), 13000);
    return () => window.clearTimeout(timer);
  }, [verified]);

  useEffect(() => {
    if (resendSeconds < 1) return;
    const timer = window.setTimeout(() => setResendSeconds((previous) => Math.max(0, previous - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const send = async (resend = false) => {
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      onError("Enter a valid email address.");
      return;
    }
    if (!resend && !prepare(normalizedEmail)) return;
    if (resend && resendSeconds > 0) return;

    setBusy(resend ? "resend" : "send");
    onBusyChange(true);
    onError(null);
    try {
      await sendCode({ email: normalizedEmail, disableSignup: false });
      setCode("");
      setVerified(false);
      setConnectionDelay(false);
      setStep("code");
      setResendSeconds(30);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not send verification code.");
    } finally {
      setBusy(null);
      onBusyChange(false);
    }
  };

  const verify = async (completedCode = code) => {
    const otp = completedCode.replace(/\D/g, "").slice(0, 6);
    if (otp.length !== 6 || verifying.current || verified || disabled) return;
    verifying.current = true;
    setBusy("verify");
    onBusyChange(true);
    onError(null);
    try {
      await loginWithCode({ code: otp });
      // A different connected wallet should not remain the active signer
      // after deliberately selecting a new Privy email wallet.
      if (isConnected && connector?.id !== PRIVY_CONNECTOR_ID) {
        await disconnectAsync();
      }
      chooseEmailWalletProvider("privy");
      setVerified(true);
    } catch (error) {
      setCode("");
      onError(error instanceof Error ? error.message : "That verification code is invalid or expired.");
    } finally {
      setBusy(null);
      onBusyChange(false);
      verifying.current = false;
    }
  };

  return step === "code" ? (
    <section aria-label="Email verification" className="space-y-5 border-t border-border pt-5">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => {
          setStep("email");
          setCode("");
          setConnectionDelay(false);
          onError(null);
        }}
        disabled={!!busy || verified}
        className="h-8 rounded-lg px-0 text-xs text-muted-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Change email
      </Button>

      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold">Verify your email</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Enter the code sent to <strong className="break-all text-foreground">{normalizedEmail}</strong>
          </p>
        </div>
      </div>

      <OTPInput
        maxLength={6}
        aria-label="Six-digit verification code"
        autoComplete="one-time-code"
        autoFocus
        inputMode="numeric"
        pattern="[0-9]*"
        value={code}
        onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
        onComplete={(value) => void verify(value)}
        disabled={!!busy || disabled || verified}
        containerClassName="grid w-full grid-cols-6 gap-1.5 sm:gap-2"
        render={({ slots }) => slots.map((slot, index) => (
          <div
            key={index}
            aria-hidden="true"
            className={
              "relative grid aspect-square min-w-0 place-items-center rounded-xl border-2 bg-background font-display text-xl font-bold tabular-nums transition-all motion-reduce:transition-none " +
              (verified
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                : slot.isActive
                  ? "border-brand bg-brand/5 ring-2 ring-brand/15"
                  : slot.char
                    ? "border-foreground/30 text-foreground"
                    : "border-border")
            }
          >
            {slot.char ?? ""}
            {slot.hasFakeCaret && (
              <span className="absolute h-5 w-px animate-pulse bg-brand motion-reduce:animate-none" />
            )}
          </div>
        ))}
      />

      <Button
        type="button"
        size="lg"
        onClick={() => void verify(code)}
        disabled={code.length !== 6 || !!busy || disabled || verified}
        className="w-full rounded-xl bg-brand text-brand-foreground hover:bg-brand/90"
      >
        {verified || busy === "verify" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : <CheckCircle2 className="h-4 w-4" />}
        {verified ? "Connecting your wallet…" : busy === "verify" ? "Verifying…" : "Verify & continue"}
      </Button>

      {verified && connectionDelay ? (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            Email verified. Your PIN-free wallet is taking longer than expected to connect.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.dispatchEvent(new Event("nest-email-wallet-provider"))}
            className="w-full rounded-lg"
          >
            Retry wallet connection
          </Button>
        </div>
      ) : null}

      <div className="flex items-center justify-center gap-1 text-xs">
        <span className="text-muted-foreground">Didn't receive it?</span>
        <Button
          variant="link"
          size="sm"
          type="button"
          onClick={() => void send(true)}
          disabled={!!busy || disabled || verified || resendSeconds > 0}
          className="h-9 px-1 text-brand"
        >
          {busy === "resend" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {busy === "resend" ? "Sending…" : resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
        </Button>
      </div>
      <p role="status" aria-live="polite" className="text-center text-[11px] text-muted-foreground">
        {verified ? "Email verified. Restoring your Privy wallet…" : "No PIN needed for your new Privy wallet."}
      </p>
    </section>
  ) : (
    <form
      onSubmit={(event) => { event.preventDefault(); void send(); }}
      className="space-y-2.5"
    >
      <label htmlFor="nest-privy-email" className="sr-only">Email address</label>
      <input
        id="nest-privy-email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        disabled={!!busy || disabled}
        className="min-h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:opacity-60"
      />
      <Button
        type="submit"
        size="lg"
        disabled={!!busy || disabled}
        className="w-full rounded-xl bg-brand text-brand-foreground hover:bg-brand/90"
      >
        {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {busy === "send" ? "Sending code…" : "Continue with email"}
      </Button>
      <p className="text-center text-[11px] leading-5 text-muted-foreground">
        This opens a new PIN-free Privy wallet. To access an existing Circle wallet,
        choose one of the legacy sign-in options below.
      </p>
    </form>
  );
}
