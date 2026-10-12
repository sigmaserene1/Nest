import { useMemo, useRef, useState } from "react";
import { Mail, Loader2, ArrowLeft, RefreshCw, ShieldCheck, CheckCircle2 } from "lucide-react";
import { OTPInput } from "input-otp";
import { useLoginWithEmail, useToken, useLogout } from "@privy-io/react-auth";

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
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"send" | "verify" | "resend" | null>(null);
  const [verified, setVerified] = useState(false);
  const verifyingRef = useRef(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

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
    if (candidate.length !== 6 || verifyingRef.current || verified) return;

    verifyingRef.current = true;
    setCode(candidate);
    setBusy("verify");
    onBusyChange(true);
    onError(null);

    try {
      // Use the completed value directly. Waiting for React state here can
      // race the sixth OTP digit and leave the user stuck on the code screen.
      await loginWithCode({ code: candidate });
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Privy did not return a verified session.");

      const { loginCircleWalletFromPrivy } = await import("@/lib/circle-sdk");
      await loginCircleWalletFromPrivy(accessToken, normalizedEmail);

      // Privy is only the OTP broker; Circle remains the wallet session.
      await logout().catch(() => undefined);

      setBusy(null);
      setVerified(true);
      onBusyChange(false);

      // Let the user see the successful verification state briefly, then move
      // into Nest automatically without requiring another tap.
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      onAuthenticated();
    } catch (error) {
      setVerified(false);
      onError(error instanceof Error ? error.message : "That code could not be verified.");
      setCode("");
      setBusy(null);
      onBusyChange(false);
    } finally {
      verifyingRef.current = false;
    }
  };

  if (step === "code") {
    return (
      <div className="rounded-[24px] border border-border bg-background/70 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setVerified(false);
            verifyingRef.current = false;
            onError(null);
          }}
          disabled={!!busy}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Change email
        </button>

        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
            <ShieldCheck className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold">Check your email</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Enter the 6-digit code sent to <span className="font-semibold text-foreground">{normalizedEmail}</span>.
            </p>
          </div>
        </div>

        <OTPInput
          maxLength={6}
          value={code}
          onChange={(value) => {
            setVerified(false);
            setCode(value.replace(/\D/g, "").slice(0, 6));
          }}
          disabled={!!busy || disabled}
          inputMode="numeric"
          containerClassName="mt-5 flex justify-between gap-2"
          render={({ slots }) => (
            <>
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className={
                    "grid h-13 min-w-0 flex-1 place-items-center rounded-2xl border bg-card text-xl font-bold tabular-nums transition-all " +
                    (verified
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 ring-2 ring-emerald-500/10"
                      : slot.isActive
                        ? "border-brand ring-4 ring-brand/10"
                        : slot.char
                          ? "border-foreground/20"
                          : "border-border")
                  }
                >
                  {slot.char ?? ""}
                  {slot.hasFakeCaret ? (
                    <span className="h-5 w-px animate-pulse bg-brand" />
                  ) : null}
                </div>
              ))}
            </>
          )}
          onComplete={(value) => void verify(value)}
        />

        <button
          type="button"
          onClick={() => void verify(code)}
          disabled={code.length !== 6 || !!busy || disabled}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 text-sm font-bold text-background transition active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {verified ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          ) : busy === "verify" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {verified ? "Verified · opening Nest…" : busy === "verify" ? "Verifying…" : "Verify & continue"}
        </button>

        <button
          type="button"
          onClick={() => void send(true)}
          disabled={!!busy || disabled}
          className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-brand transition hover:bg-brand/5 disabled:opacity-50"
        >
          {busy === "resend" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Send another code
        </button>
      </div>
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
        className="min-h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!!busy || disabled}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background transition active:scale-[0.985] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {busy === "send" ? "Sending code…" : "Continue with email"}
      </button>
    </form>
  );
}
