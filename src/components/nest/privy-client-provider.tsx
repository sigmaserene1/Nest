import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";

export default function PrivyClientProvider({ appId, children }: { appId: string; children: ReactNode }) {
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email"],
        appearance: { theme: "light", accentColor: "#E53935", logo: "https://nestarc.xyz/favicon.ico" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
