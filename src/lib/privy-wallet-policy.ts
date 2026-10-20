type LinkedAccount = { type: string; walletClientType?: string; chainType?: string };

/** Never create a replacement wallet while a linked EVM wallet is restoring. */
export function shouldCreatePrivyWallet(walletPresent: boolean, accounts: readonly LinkedAccount[], creating: boolean) {
  return !walletPresent && !creating && !accounts.some((account) =>
    account.type === "wallet" && account.walletClientType === "privy" && account.chainType === "ethereum",
  );
}