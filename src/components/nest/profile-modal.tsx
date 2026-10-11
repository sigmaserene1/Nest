import { useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import { useAccount } from "wagmi";
import { ProfileAvatarGraphic } from "@/components/nest/avatar";
import {
  PROFILE_AVATARS,
  getProfileAvatar,
  saveProfileAvatar,
  type ProfileAvatarId,
} from "@/lib/profile-avatar";
import { useNestChain } from "@/lib/chain/nest-chain";
import { useNestWrites } from "@/lib/chain/writes";
import { clearSignupDraft, readSignupDraft } from "@/lib/signup-draft";

function NameForm({ onDone, dismissible }: { onDone: () => void; dismissible: boolean }) {
  const { claimName } = useNestWrites();
  const { address } = useAccount();
  const { me, isDemo, rpcMessage } = useNestChain();
  const wallet = address ?? me ?? "";
  const [name, setName] = useState(() => readSignupDraft()?.displayName ?? "");
  const [avatar, setAvatar] = useState<ProfileAvatarId>(() =>
    getProfileAvatar(address ?? me ?? ""),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!name.trim() || isDemo) return;
    setBusy(true);
    setError("");
    try {
      await claimName(name.trim());
      if (wallet) await saveProfileAvatar(wallet, avatar);
      clearSignupDraft();
      onDone();
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div


      className="nest-modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[6px] sm:items-center"
    >
      <div



        className="nest-sheet-enter mobile-sheet glass-strong w-[calc(100%-0.75rem)] max-w-md rounded-[30px] p-5 sm:w-full sm:p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Confirm your Nest name</h3>
          {dismissible && (
            <button
              onClick={onDone}
              className="grid h-9 w-9 place-items-center rounded-full bg-muted transition-all duration-200 ease-out hover:rotate-6 hover:bg-muted/80 active:scale-95"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          This is how members recognize you in Nest. Your name is written onchain once and permanently bound to this wallet.
        </p>
        <div className="mt-5 rounded-3xl border border-border/70 bg-muted/35 p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <div>
              <div className="text-xs font-bold">Choose your Nest avatar</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                You can change the avatar later from Profile.
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2.5">
            {PROFILE_AVATARS.map((option) => {
              const selected = avatar === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAvatar(option.id)}
                  className={`relative grid aspect-square place-items-center rounded-2xl border transition active:scale-[0.96] ${
                    selected
                      ? "border-brand bg-brand/5 shadow-sm ring-2 ring-brand/15"
                      : "border-transparent hover:bg-background/70"
                  }`}
                  aria-label={`Use ${option.label} avatar`}
                >
                  <ProfileAvatarGraphic avatarId={option.id} size={42} />
                  {selected ? (
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand text-white shadow-sm">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex Chen"
          autoFocus
          className="mt-5 min-h-12 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-base outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/15 sm:text-sm"
        />
        {error && (
          <div className="mt-3 rounded-2xl bg-brand/10 p-3 text-xs font-semibold text-brand">
            {error}
          </div>
        )}
        {isDemo && (
          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-[11px] font-semibold leading-relaxed text-amber-900">
            {rpcMessage}
          </div>
        )}
        <button
          onClick={save}
          disabled={busy || isDemo || !name.trim()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl btn-gradient py-4 text-sm font-bold disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}{" "}
          Confirm name onchain
        </button>
      </div>
    </div>
  );
}

export function ProfileNameModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <NameForm onDone={onClose} dismissible />;
}

export function ProfileOnboarding() {
  const { me, myName, members, isDemo } = useNestChain();
  const [skipped, setSkipped] = useState(false);
  useEffect(() => setSkipped(false), [me]);
  const inRoom = !!me && members.some((m) => m.id === me);
  const show = !isDemo && inRoom && !myName && !skipped;
  if (!show) return null;
  return <NameForm onDone={() => setSkipped(true)} dismissible />;
}
