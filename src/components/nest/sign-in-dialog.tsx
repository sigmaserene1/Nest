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
  const { sendCode, verifyCode } = useEmailAuth();
  const [step, setStep] = useState<"choose" | "code">("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = (o: boolean) => {
    if (!o) {
      setStep("choose");
      setCode("");
      setError(null);
    }
    onOpenChange(o);
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    setBusy(true);
    setError(null);
    try {
      await sendCode(email.trim());
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyCode(email.trim(), code.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work.");
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>{step === "choose" ? "Sign in to Nest" : "Check your email"}</DialogTitle>
          <DialogDescription>
            {step === "choose"
              ? "Use your email — we'll create a wallet for you — or connect your own."
              : `Enter the code we sent to ${email}.`}
          </DialogDescription>
        </DialogHeader>

        {step === "choose" ? (
          <div className="space-y-3">
            <form onSubmit={submitEmail} className="space-y-2">
              <input
                type="email"
                aria-label="Email address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Continue with email
              </button>
            </form>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
              <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
            </div>
            <button
              type="button"
              onClick={() => {
                reset(false);
                onWallet();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-accent"
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
              disabled={busy || code.length < 6}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Verify and sign in
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
