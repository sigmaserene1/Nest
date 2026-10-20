import { describe, expect, test } from "bun:test";
import { shouldCreatePrivyWallet } from "./privy-wallet-policy";

describe("email EVM wallet identity", () => {
  test("new email creates an EVM wallet", () => {
    expect(shouldCreatePrivyWallet(false, [{ type: "email" }], false)).toBe(true);
  });
  test("returning email restores its existing EVM address instead of creating another", () => {
    expect(shouldCreatePrivyWallet(false, [{ type: "wallet", walletClientType: "privy", chainType: "ethereum" }], false)).toBe(false);
  });
  test("a wallet already exposed by the provider is not recreated", () => {
    expect(shouldCreatePrivyWallet(true, [], false)).toBe(false);
  });
  test("an in-progress creation cannot start a second creation", () => {
    expect(shouldCreatePrivyWallet(false, [], true)).toBe(false);
  });
});