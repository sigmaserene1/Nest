import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";
import { arcChainFor, getArcEnvironment } from "@/lib/arc-network";

export function Web3Provider({ children }: { children: ReactNode }) {
  const initialChain = arcChainFor(getArcEnvironment());
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        initialChain={initialChain}
        theme={lightTheme({
          accentColor: "#E53935",
          accentColorForeground: "white",
          borderRadius: "large",
          fontStack: "system",
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
