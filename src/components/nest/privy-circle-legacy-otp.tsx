import { useMemo, useRef, useState } from "react";
import { Mail, Loader2, ArrowLeft, RefreshCw, ShieldCheck, CheckCircle2 } from "lucide-react";
import { OTPInput } from "input-otp";
import { useLoginWithEmail, useToken, useLogout } from "@privy-io/react-auth";
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

export function PrivyCircleLegacyOtp({
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
      // Clear any half-finished Privy session so the next attempt starts clean.
      await logout().catch(() => undefined);
      setVerified(false);
      const message = error instanceof Error ? error.message : "That code could not be verified.";
      onError(
        /not configured/i.test(message)
          ? "Email sign-in isn't fully set up yet. Please try again shortly."
          : message,
      );
      setCode("");
      setStep("email");
      setBusy(null);
      onBusyChange(false);
    } finally {
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
            setStep("email");
            setCode("");
            setVerified(false);
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
          disabled={!!busy || disabled || verified}
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
          onComplete={(value) => void verify(value)}
        />

        <Button
          size="lg"
          type="button"
          onClick={() => void verify(code)}
          disabled={code.length !== 6 || !!busy || disabled || verified}
          className="w-full rounded-lg bg-brand text-brand-foreground shadow-none hover:bg-brand/90"
        >
          {verified ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : busy === "verify" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {verified ? "Verified · opening Nest…" : busy === "verify" ? "Verifying…" : "Verify & continue"}
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-x-1 text-xs">
          <span className="text-muted-foreground">Didn’t get a code?</span>
        <Button
          variant="link"
          size="sm"
          type="button"
          onClick={() => void send(true)}
          disabled={!!busy || disabled || verified}
          className="h-9 px-1 text-brand"
        >
          {busy === "resend" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {busy === "resend" ? "Sending…" : "Resend code"}
        </Button>
        </div>
        <p role="status" aria-live="polite" className="flex min-h-5 items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          {verified ? "Email verified. Opening Nest…" : busy === "verify" ? "Verifying your code…" : "Secure, password-free sign in"}
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
