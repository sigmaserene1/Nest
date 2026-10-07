import { useState } from "react";
import { Mail, Wallet, ArrowLeft, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEmailAuth } from "@/lib/use-email-auth";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWallet: () => void;
};

export function SignInDialog({ open, onOpenChange, onWallet }: Props) {
  const { signIn, signInWithGoogle } = useEmailAuth();
  const [step, setStep] = useState<"choose" | "code">("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = (o: boolean) => {
    if (!o) {
      setStep("choose");
      setCode("");
      setError(null);
      setBusy(null);
    }
    onOpenChange(o);
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    setBusy("email");
    setError(null);
    try {
      await signIn(email.trim());
      reset(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start email sign-in.");
      setBusy(null);
    }
  };

  const submitGoogle = async () => {
    setBusy("google");
    setError(null);
    try {
      await signInWithGoogle();
      reset(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Google sign-in.");
      setBusy(null);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("email");
    setError(null);
    try {
      void code;
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work.");
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>{step === "choose" ? "Sign in to Nest" : "Check your email"}</DialogTitle>
          <DialogDescription>
            {step === "choose"
              ? "Use Google or email — Circle creates a secure wallet you can use on any device — or connect your own wallet."
              : `Enter the code we sent to ${email}.`}
          </DialogDescription>
        </DialogHeader>

        {step === "choose" ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={submitGoogle}
              disabled={busy !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold transition-colors hover:bg-accent disabled:opacity-60"
            >
              {busy === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span
                  aria-hidden
                  className="grid h-4 w-4 place-items-center rounded-full text-[13px] font-black leading-none"
                >
                  G
                </span>
              )}
              Continue with Google
            </button>

            <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
              <span className="h-px flex-1 bg-border" />or use email<span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submitEmail} className="space-y-2">
              <input
                type="email"
                aria-label="Email address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy !== null}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={busy !== null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background disabled:opacity-60"
              >
                {busy === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Continue with email
              </button>
            </form>

            <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
              <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                reset(false);
                onWallet();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-accent disabled:opacity-60"
            >
              <Wallet className="h-4 w-4" /> Connect a wallet
            </button>
          </div>
        ) : (
          <form onSubmit={submitCode} className="space-y-3">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="Verification code"
              placeholder="Code"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.4em] outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={busy !== null || code.length < 6}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background disabled:opacity-60"
            >
              {busy === "email" && <Loader2 className="h-4 w-4 animate-spin" />} Verify and sign in
            </button>
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Use a different email
            </button>
          </form>
        )}
        {error && <p role="alert" className="text-xs font-semibold text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
