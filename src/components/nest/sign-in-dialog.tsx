import { lazy, Suspense, useState } from "react";
import { Loader2, Mail, ShieldCheck, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEmailAuth } from "@/lib/use-email-auth";
import { clearSignupDraft } from "@/lib/signup-draft";

const PrivyEmailOtp = lazy(() => import("@/components/nest/privy-email-otp").then((module) => ({ default: module.PrivyEmailOtp })));

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWallet: () => void;
  onAuthenticated: () => void;
  inviteMode?: boolean;
};

export function SignInDialog({ open, onOpenChange, onWallet, onAuthenticated, inviteMode = false }: Props) {
  const { signIn } = useEmailAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "code" | "wallet">("email");
  const [legacy, setLegacy] = useState(false);

  const close = (next: boolean) => {
    if (busy && !next) return;
    if (!next) { setError(null); setLegacy(false); setStep("email"); }
    onOpenChange(next);
  };
  const complete = () => {
    clearSignupDraft();
    onAuthenticated();
    onOpenChange(false);
  };
  const openLegacyWallet = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError("Enter a valid email address."); return; }
    setBusy(true);
    setError(null);
    try { clearSignupDraft(); await signIn(email.trim().toLowerCase()); complete(); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not open your existing wallet."); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="gap-0 overflow-y-auto rounded-lg border-border bg-background p-0 sm:max-w-sm sm:p-0" onInteractOutside={(event) => { if (busy) event.preventDefault(); }}>
        <div className="px-5 pb-5 pt-6 sm:px-6">
          <span className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-brand">
            {step === "code" ? <ShieldCheck className="h-5 w-5" /> : step === "wallet" ? <Wallet className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
          </span>
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-2xl leading-tight tracking-normal">
              {step === "code" ? "Check your inbox" : step === "wallet" ? "Your Nest wallet" : "Sign in to Nest"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6">
              {step === "code" ? "Enter the six-digit code to continue." : step === "wallet" ? "Continue with your email wallet." : inviteMode ? "Verify your email to join the workspace." : "Your email. Your wallet. No password."}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-4 border-t border-border px-5 py-5 sm:px-6">
          {legacy ? (
            <form onSubmit={openLegacyWallet} className="space-y-3">
              <label htmlFor="nest-legacy-email" className="text-xs font-medium text-muted-foreground">Existing Circle wallet email</label>
              <input id="nest-legacy-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} required className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base" />
              <Button type="submit" disabled={busy} className="w-full rounded-lg">{busy ? <Loader2 className="animate-spin" /> : <Wallet />}{busy ? "Opening wallet…" : "Open existing Circle wallet"}</Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => { setLegacy(false); setError(null); }} className="w-full rounded-lg">Back to email sign-in</Button>
            </form>
          ) : (
            <Suspense fallback={<div role="status" className="flex h-24 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading email sign-in…</div>}>
              <PrivyEmailOtp email={email} onEmailChange={setEmail} prepare={() => { clearSignupDraft(); setError(null); return true; }} onBusyChange={setBusy} onError={setError} onAuthenticated={complete} onStepChange={setStep} />
            </Suspense>
          )}
          {error ? <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">{error}</p> : null}
          {step === "email" && !legacy ? <>
            <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
            <Button variant="outline" disabled={busy} onClick={() => { clearSignupDraft(); close(false); onWallet(); }} className="w-full rounded-lg shadow-none"><Wallet />Connect a wallet</Button>
            <Button variant="link" size="sm" disabled={busy} onClick={() => { setLegacy(true); setError(null); }} className="h-auto w-full py-1 text-xs text-muted-foreground">Recover an older Circle wallet</Button>
          </> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
