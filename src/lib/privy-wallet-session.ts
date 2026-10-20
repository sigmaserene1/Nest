import type { Address } from "viem";
import type { EIP1193Provider } from "@privy-io/react-auth";

export const PRIVY_CONNECTOR_ID = "nest.privy";
type WalletSession = {
  ready: boolean;
  address: Address | null;
  email: string | null;
  provider: EIP1193Provider | null;
  connected: boolean;
  error: string | null;
};
const empty: WalletSession = { ready: false, address: null, email: null, provider: null, connected: false, error: null };
let session = empty;
let logout: (() => Promise<void>) | undefined;
let retry: (() => void) | undefined;
const listeners = new Set<() => void>();
export const getPrivyWalletSession = () => session;
export const getServerPrivyWalletSession = () => empty;
export function subscribePrivyWalletSession(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function updatePrivyWalletSession(next: Partial<WalletSession>) {
  session = { ...session, ...next };
  listeners.forEach((listener) => listener());
}
export function registerPrivyWalletActions(actions: { logout: () => Promise<void>; retry: () => void }) {
  logout = actions.logout;
  retry = actions.retry;
}
export async function disconnectPrivyWallet() {
  await logout?.();
  updatePrivyWalletSession({ ...empty, ready: true });
}
export function waitForPrivyWallet(timeout = 90_000): Promise<Address> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error("Your email is verified, but the wallet is still opening. Please try again."));
    }, timeout);
    const check = () => {
      const current = getPrivyWalletSession();
      if (current.connected && current.address) {
        clearTimeout(timer);
        unsubscribe();
        resolve(current.address);
      } else if (current.error) {
        clearTimeout(timer);
        unsubscribe();
        reject(new Error(current.error));
      }
    };
    const unsubscribe = subscribePrivyWalletSession(check);
    retry?.();
    check();
  });
}