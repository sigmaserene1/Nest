import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X, User, Check, Loader2, ShieldCheck } from "lucide-react";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { getDisplayName, setDisplayName, useDisplayName, hasOnboarded, markOnboarded } from "@/lib/profile-store";
import { claimProfileName, useMyProfile } from "@/lib/nest-remote";
import { WalletChip } from "./chain";

export function ProfileNameModal({
  open,
  onClose,
  firstTime = false,
}: {
  open: boolean;
  onClose: () => void;
  firstTime?: boolean;
}) {
  const { address } = useArcWallet();
  const { profile, loading, locked, refetch } = useMyProfile();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(profile?.name ?? getDisplayName() ?? "");
    setError("");
    setSaved(false);
  }, [open, profile]);

  // Keep the local name in sync with the permanent onchain-identity record.
  useEffect(() => {
    if (profile?.name && getDisplayName() !== profile.name) setDisplayName(profile.name);
  }, [profile]);

  const submit = async () => {
    if (!address) {
      setError("Connect your Arc wallet first.");
      return;
    }
    const clean = name.trim();
    if (clean.length < 2) {
      setError("Enter a name with at least 2 characters.");
      return;
    }
    setSaving(true);
    const res = await claimProfileName(address, clean);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      void refetch();
      return;
    }
    setDisplayName(res.profile.name);
    setSaved(true);
    setTimeout(onClose, 700);
  };


  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={firstTime ? undefined : onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-xl ring-1 ring-black/5 sm:rounded-[28px]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-brand">
                  <User className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-base font-bold">
                    {locked ? "Your Nest name" : firstTime ? "Welcome to Nest" : "Claim your Nest name"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {locked
                      ? "Permanently linked to your Arc wallet"
                      : "One name, one wallet — this can't be changed later"}
                  </div>
                </div>
              </div>
              {!firstTime && (
                <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-muted">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {saved ? (
              <div className="mt-8 flex flex-col items-center py-6">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="h-7 w-7" />
                </span>
                <div className="mt-3 text-sm font-bold">Name claimed</div>
              </div>
            ) : locked ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-muted/60 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Display name
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-sm font-bold">
                    {profile?.name}
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                {address && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    Linked wallet <WalletChip address={address} />
                  </div>
                )}
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
                  This name is registered to your wallet on Nest and can never be changed or reused by
                  anyone else.
                </div>
                <button
                  onClick={onClose}
                  className="mt-2 w-full rounded-2xl bg-brand py-4 text-sm font-bold text-white shadow-brand"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Display name
                  </div>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && void submit()}
                    maxLength={40}
                    autoFocus
                    disabled={saving || loading}
                    placeholder="e.g. Sara Kim"
                    className="w-full rounded-2xl bg-muted/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
                  />
                </div>

                {address && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    Connected wallet <WalletChip address={address} />
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl bg-brand/10 px-4 py-2.5 text-xs font-semibold text-brand">{error}</div>
                )}

                <button
                  onClick={() => void submit()}
                  disabled={saving || loading}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-sm font-bold text-white shadow-brand transition hover:scale-[1.01] disabled:opacity-70"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Claiming…" : "Claim name"}
                </button>
                <div className="text-center text-[11px] text-muted-foreground">
                  Your name is locked to this wallet forever — choose carefully.
                </div>
              </div>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Shows the name-claim prompt once per wallet, until that wallet has a registered name. */
export function ProfileOnboarding() {
  const { isConnected, address } = useArcWallet();
  const displayName = useDisplayName();
  const { profile, loading } = useMyProfile();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || loading) return;
    if (profile) {
      if (displayName !== profile.name) setDisplayName(profile.name);
      setOpen(false);
      return;
    }
    if (hasOnboarded(address)) return;
    setOpen(true);
  }, [isConnected, address, displayName, profile, loading]);


  const close = () => {
    markOnboarded(address);
    setOpen(false);
  };

  return <ProfileNameModal open={open} onClose={close} firstTime />;
}

