import type { ReactNode } from "react";

/**
 * Build-time stub for deployments where Privy email OTP is not enabled.
 * Prevents the 3rd-party SDK bundle from increasing size/memory costs for
 * existing Circle-only deployments. The opt-in entry is never mounted when
 * VITE_ENABLE_PRIVY_OTP is not "true".
 */
const disabled = (): never => {
  throw new Error("Privy email OTP is disabled in this deployment.");
};

export function PrivyProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const usePrivy = disabled;
export const useWallets = disabled;
export const useLoginWithEmail = disabled;
