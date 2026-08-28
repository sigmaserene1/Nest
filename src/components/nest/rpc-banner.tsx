import { CloudOff } from "lucide-react";
import { useNestChain } from "@/lib/chain/nest-chain";

/**
 * Shown whenever Arc's public RPC cannot be reached. All blockchain logic stays
 * in place — the app simply renders sample data until reads succeed again.
 */
export function RpcBanner() {
  const { isDemo, rpcMessage } = useNestChain();
  if (!isDemo) return null;

  return (
    <div
      role="status"
      className="mx-auto mb-3 flex max-w-6xl items-start gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-amber-900 ring-1 ring-amber-200"
    >
      <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <div className="text-[12px] font-bold">Demo mode</div>
        <p className="mt-0.5 text-[11px] leading-relaxed sm:text-xs">{rpcMessage}</p>
      </div>
    </div>
  );
}
