import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X, User, Check } from "lucide-react";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { getDisplayName, setDisplayName, useDisplayName } from "@/lib/profile-store";
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
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(getDisplayName() ?? "");
    setError("");
    setSaved(false);
  }, [open]);

  const submit = () => {
    const clean = name.trim();
    if (clean.length < 2) {
      setError("Enter a name with at least 2 characters.");
      return;
    }
    setDisplayName(clean);
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
                  <div className="text-base font-bold">{firstTime ? "Welcome to Nest" : "Your display name"}</div>
                  <div className="text-xs text-muted-foreground">
                    {firstTime ? "What should roommates call you?" : "Update how roommates see you"}
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
                <div className="mt-3 text-sm font-bold">Saved</div>
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
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    maxLength={40}
                    autoFocus
                    placeholder="e.g. Sara Kim"
                    className="w-full rounded-2xl bg-muted/60 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand"
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
                  onClick={submit}
                  className="mt-2 w-full rounded-2xl bg-brand py-4 text-sm font-bold text-white shadow-brand transition hover:scale-[1.01]"
                >
                  {firstTime ? "Continue" : "Save name"}
                </button>
                <div className="text-center text-[11px] text-muted-foreground">
                  Stored on this device — you can change it anytime from Members.
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Shows the onboarding name prompt once per wallet, right after it connects. */
export function ProfileOnboarding() {
  const { isConnected, address } = useArcWallet();
  const displayName = useDisplayName();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) return;
    if (displayName || hasOnboarded(address)) return;
    setOpen(true);
  }, [isConnected, address, displayName]);

  const close = () => {
    markOnboarded(address);
    setOpen(false);
  };

  return <ProfileNameModal open={open} onClose={close} firstTime />;
}

