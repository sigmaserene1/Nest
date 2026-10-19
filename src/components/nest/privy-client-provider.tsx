import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { arcMainnet, arcTestnet } from "@/lib/arc-network";

export default function PrivyClientProvider({ appId, children }: { appId: string; children: ReactNode }) {
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email"],
        supportedChains: [arcMainnet, arcTestnet],
        defaultChain: arcTestnet,
        embeddedWallets: { ethereum: { createOnLogin: "off" } },
        appearance: { theme: "light", accentColor: "#E53935", logo: "https://nestarc.xyz/favicon.ico" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
