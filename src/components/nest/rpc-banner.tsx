import { CloudOff } from "lucide-react";
import { useNestChain } from "@/lib/chain/nest-chain";

export function RpcBanner() {
  const { isDemo, rpcMessage } = useNestChain();
  if (!isDemo) return null;

  return (
    <div
      role="status"
      className="mx-auto mb-3 flex max-w-7xl items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-foreground"
    >
      <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <div className="text-[12px] font-semibold">Arc connection unavailable</div>
        <p className="mt-0.5 text-[11px] leading-relaxed sm:text-xs">{rpcMessage}</p>
      </div>
    </div>
  );
}
