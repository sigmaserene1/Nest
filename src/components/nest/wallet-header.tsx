import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useArcWallet } from "@/hooks/use-arc-wallet";
import { arcTestnet } from "@/lib/wagmi";
import { toast } from "sonner";

export function WalletHeader() {
  const navigate = useNavigate();
  const { isConnected, isOnArc, switchToArc, isSwitching } = useArcWallet();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2">
        <ConnectButton
          accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
          showBalance={false}
        />
        <button
          onClick={signOut}
          aria-label="Sign out"
          className="grid h-9 w-9 place-items-center rounded-full bg-card text-muted-foreground ring-1 ring-black/[0.05] transition hover:text-brand"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {isConnected && !isOnArc && (
        <button
          onClick={switchToArc}
          disabled={isSwitching}
          className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-left text-sm ring-1 ring-amber-200 transition hover:bg-amber-100 disabled:opacity-70"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-amber-900">
              Wrong network — switch to {arcTestnet.name}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white">
            {isSwitching && <Loader2 className="h-3 w-3 animate-spin" />}
            Switch
          </span>
        </button>
      )}
    </div>
  );
}
