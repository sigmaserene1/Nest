import { createConnector } from "wagmi";
import { numberToHex, type Address } from "viem";
import { disconnectPrivyWallet, getPrivyWalletSession, PRIVY_CONNECTOR_ID } from "@/lib/privy-wallet-session";

export function privyWalletConnector() {
  return createConnector((config) => {
    const getProvider = () => {
      const provider = getPrivyWalletSession().provider;
      if (!provider) throw new Error("Sign in with email to open your Privy wallet.");
      return provider;
    };
    const getAccounts = async (): Promise<readonly Address[]> => {
      const address = getPrivyWalletSession().address;
      return address ? [address] : [];
    };
    const getChainId = async () => Number(await getProvider().request({ method: "eth_chainId" }));
    return {
      id: PRIVY_CONNECTOR_ID,
      name: "Email Wallet (Privy)",
      type: "embedded",
      async connect({ withCapabilities } = {}) {
        const accounts = await getAccounts();
        if (!accounts.length) throw new Error("Your email wallet is not ready yet.");
        return { accounts: (withCapabilities ? accounts.map((address) => ({ address, capabilities: {} })) : accounts) as never, chainId: await getChainId() };
      },
      disconnect: disconnectPrivyWallet,
      getAccounts,
      getChainId,
      async getProvider() { return getProvider(); },
      async isAuthorized() { return Boolean(getPrivyWalletSession().provider); },
      async switchChain({ chainId }) {
        const chain = config.chains.find((item) => item.id === chainId);
        if (!chain) throw new Error("This network is not supported by Nest.");
        const provider = getProvider();
        try {
          await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: numberToHex(chainId) }] });
        } catch (error) {
          if ((error as { code?: number }).code !== 4902) throw error;
          await provider.request({ method: "wallet_addEthereumChain", params: [{ chainId: numberToHex(chainId), chainName: chain.name, nativeCurrency: chain.nativeCurrency, rpcUrls: [...chain.rpcUrls.default.http], blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : [] }] });
          await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: numberToHex(chainId) }] });
        }
        config.emitter.emit("change", { chainId });
        return chain;
      },
      onAccountsChanged(accounts) {
        if (!accounts.length) config.emitter.emit("disconnect");
        else config.emitter.emit("change", { accounts: accounts as Address[] });
      },
      onChainChanged(chain) { config.emitter.emit("change", { chainId: Number(chain) }); },
      onDisconnect() { config.emitter.emit("disconnect"); },
    };
  });
}