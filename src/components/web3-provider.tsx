import { useEffect, useState, type ReactNode } from "react";
import { WagmiProvider, type Config } from "wagmi";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig, getClientWagmiConfig } from "@/lib/wagmi";
import { arcChainFor, getArcEnvironment } from "@/lib/arc-network";

export function Web3Provider({ children }: { children: ReactNode }) {
  // Start with the SSR-safe connector-less config so server rendering never
  // evaluates @metamask/sdk (it crashes with "Class extends value [object
  // Module] is not a constructor" in the server bundle). On the client we
  // dynamically load the RainbowKit wallet connectors and swap in the full
  // config.
  const [config, setConfig] = useState<Config>(wagmiConfig);

  useEffect(() => {
    let cancelled = false;
    void getClientWagmiConfig().then((clientConfig) => {
      if (!cancelled && clientConfig !== wagmiConfig) setConfig(clientConfig);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const initialChain = arcChainFor(getArcEnvironment());
  return (
    <WagmiProvider config={config}>
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
