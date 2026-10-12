import { useEffect, useRef, useState } from "react";
import { useLoginWithEmail } from "@privy-io/react-auth";
import { ArrowLeft, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PRIVY_CONNECTOR_ID, selectPrivyLogin } from "@/lib/privy-wallet";

type Props = {
  email: string;
  onBack: () => void;
  onAuthenticated: () => void;
};

export function PrivyEmailOtp({ email, onBack, onAuthenticated }: Props) {
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { connector, isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"sending" | "verifying" | null>("sending");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(30);
  const [verified, setVerified] = useState(false);
  const sentOnce = useRef(false);
  const completed = useRef(false);

  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    void sendCode({ email })
      .then(() => setCooldown(30))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not send code."))
      .finally(() => setBusy(null));
  }, [email, sendCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (verified && isConnected && connector?.id === PRIVY_CONNECTOR_ID && !completed.current) {
      completed.current = true;
      onAuthenticated();
    }
  }, [verified, isConnected, connector?.id, onAuthenticated]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code) || busy || verified) return;
    setBusy("verifying");
    setError("");
    try {
      await loginWithCode({ code });
      // Switching wallet providers is intentional and must never leave a
      // previously connected Circle/external wallet active under a Privy login.
      if (isConnected && connector?.id !== PRIVY_CONNECTOR_ID) {
        await disconnectAsync();
      }
      // Privy produces its own user-controlled wallet. Existing Circle
      // addresses and their assets remain with Circle's separate login.
      selectPrivyLogin();
      setVerified(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The code was incorrect or expired.");
      setCode("");
    } finally {
      setBusy(null);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || busy || verified) return;
    setBusy("sending");
    setError("");
    setCode("");
    try {
      await sendCode({ email });
      setCooldown(30);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not resend code.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
          <MailCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold tracking-tight">Check your inbox</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Enter the six-digit code sent to <strong className="break-all text-foreground">{email}</strong>.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label htmlFor="nest-privy-otp" className="sr-only">Six-digit email verification code</label>
        <InputOTP
          id="nest-privy-otp"
          aria-label="Six-digit email verification code"
          maxLength={6}
          pattern="[0-9]*"
          autoComplete="one-time-code"
          inputMode="numeric"
          value={code}
          onChange={(value) => { setCode(value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          disabled={busy !== null || verified}
          containerClassName="w-full"
        >
          <InputOTPGroup className="grid w-full grid-cols-6 gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="!h-auto !w-full min-w-0 aspect-square !rounded-xl !border border-input bg-background text-lg font-extrabold shadow-sm transition-all duration-150 focus-within:border-brand data-[active=true]:border-brand data-[active=true]:bg-brand/5"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <button
          type="submit"
          disabled={code.length !== 6 || busy !== null || verified}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "verifying" || verified ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {verified ? "Connecting your wallet…" : busy === "verifying" ? "Verifying…" : "Verify and continue"}
        </button>
      </form>

      <div className="flex items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={onBack}
          disabled={busy === "verifying"}
          className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Change email
        </button>
        <button
          type="button"
          onClick={() => void resend()}
          disabled={cooldown > 0 || busy !== null || verified}
          className="font-bold text-brand disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          {busy === "sending" ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">{error}</p>
      ) : null}
      <p className="text-center text-[11px] leading-5 text-muted-foreground">
        Privy verifies your email and creates a separate embedded wallet. Existing Circle wallets
        must be opened with the Circle sign-in option.
      </p>
    </div>
  );
}
