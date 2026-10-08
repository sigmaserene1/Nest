import { useEffect, useState } from "react";
import { Mail, Wallet, Loader2, ShieldCheck, UserPlus, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEmailAuth } from "@/lib/use-email-auth";
import { clearSignupDraft, saveSignupDraft } from "@/lib/signup-draft";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWallet: () => void;
  onAuthenticated: () => void;
};

export function SignInDialog({
  open,
  onOpenChange,
  onWallet,
  onAuthenticated,
}: Props) {
  const { signIn, signInWithGoogle } = useEmailAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Warm Circle's relatively heavy browser SDK while the user is reading the
  // sign-in sheet, not after they tap Continue.
  useEffect(() => {
    if (!open) return;
    void import("@/lib/circle-sdk");
  }, [open]);

  const reset = (o: boolean) => {
    if (!o) {
      setError(null);
      setBusy(null);
    }
    onOpenChange(o);
  };


  const validateSignup = () => {
    const name = displayName.trim();
    const workspace = workspaceName.trim();
    if (mode !== "signup") return true;
    if (name.length < 2 || name.length > 60) {
      setError("Enter the name you want members to see in Nest.");
      return false;
    }
    if (workspace.length < 2 || workspace.length > 80) {
      setError("Enter a workspace name between 2 and 80 characters.");
      return false;
    }
    return true;
  };

  const persistSignupDraft = (emailValue?: string) => {
    if (mode !== "signup") {
      clearSignupDraft();
      return;
    }
    saveSignupDraft({
      displayName,
      workspaceName,
      email: emailValue,
    });
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!validateSignup()) return;
    persistSignupDraft(normalized);
    setBusy("email");
    setError(null);
    try {
      // loginWithEmail resolves only after Circle has verified the OTP,
      // initialized/restored the wallet and persisted the Nest Circle session.
      // Move straight into /app; AppLayout will wait for wagmi to reconnect the
      // embedded connector instead of leaving the user on the landing page.
      await signIn(normalized);
      onAuthenticated();
      reset(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start secure email sign-in.");
      setBusy(null);
    }
  };

  const submitGoogle = async () => {
    if (!validateSignup()) return;
    persistSignupDraft();
    setBusy("google");
    setError(null);
    try {
      // Circle uses a full-page Google OAuth redirect. Keep this dialog in its
      // loading state until navigation takes over instead of briefly dropping
      // the user back on the landing page.
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Google sign-in.");
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="max-w-sm overflow-hidden rounded-[28px] border-border/80 bg-card p-0 shadow-2xl">
        <div className="border-b border-border/70 bg-gradient-to-b from-brand/10 to-transparent px-6 pb-5 pt-6">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white shadow-sm">
            {mode === "signup" ? <UserPlus className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-2xl border border-border bg-background/70 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                clearSignupDraft();
              }}
              className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition ${
                mode === "signin"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition ${
                mode === "signup"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Create account
            </button>
          </div>

          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-2xl tracking-tight">
              {mode === "signup" ? "Create your Nest account" : "Welcome back"}
            </DialogTitle>
            <DialogDescription className="max-w-[30rem] text-sm leading-6">
              {mode === "signup"
                ? "Set up your identity and first shared workspace. Circle creates your user-controlled Arc wallet after verification."
                : "Sign in with the same Google account, email or wallet you used before."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-6 pb-6 pt-5">
          {mode === "signup" ? (
            <div className="space-y-2.5">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold text-muted-foreground">
                  Your name
                </span>
                <input
                  type="text"
                  autoComplete="name"
                  maxLength={60}
                  placeholder="e.g. Alex Chen"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={busy !== null}
                  className="min-h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold text-muted-foreground">
                  First workspace
                </span>
                <input
                  type="text"
                  maxLength={80}
                  placeholder="e.g. Apartment 12, Design Team"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={busy !== null}
                  className="min-h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:opacity-60"
                />
              </label>
            </div>
          ) : null}

          <button
            type="button"
            onClick={submitGoogle}
            disabled={busy !== null}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-bold transition hover:border-brand/35 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span
                aria-hidden
                className="grid h-5 w-5 place-items-center rounded-full bg-foreground text-[12px] font-black leading-none text-background"
              >
                G
              </span>
            )}
            {mode === "signup" ? "Sign up with Google" : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submitEmail} className="space-y-2.5">
            <label htmlFor="nest-email" className="sr-only">
              Email address
            </label>
            <input
              id="nest-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy !== null}
              className="min-h-12 w-full rounded-2xl border border-input bg-background px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "email" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {busy === "email"
                ? "Opening secure verification…"
                : mode === "signup"
                  ? "Create account with email"
                  : "Continue with email"}
            </button>
          </form>

          {mode === "signin" ? (
            <>
              <div className="flex items-center gap-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or use your wallet
                <span className="h-px flex-1 bg-border" />
              </div>

              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  clearSignupDraft();
                  reset(false);
                  onWallet();
                }}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-bold transition hover:border-brand/35 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Wallet className="h-4 w-4" />
                Connect a wallet
              </button>
            </>
          ) : (
            <div className="rounded-2xl border border-brand/15 bg-brand/5 px-3.5 py-3 text-[11px] leading-5 text-muted-foreground">
              Your Nest name is written onchain once during onboarding. Workspace creation also requires one secure wallet confirmation.
            </div>
          )}

          <p className="px-1 pt-1 text-center text-[11px] leading-4 text-muted-foreground">
            {mode === "signup"
              ? "No password. Circle handles secure email or Google verification and wallet recovery."
              : "Email verification is completed in Circle’s secure wallet window."}
          </p>

          {error ? (
            <p
              role="alert"
              className="rounded-2xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-xs font-semibold leading-5 text-destructive"
            >
              {error}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}