import { describe, expect, test } from "bun:test";
import { assertContractDeployment, assertSelectedWalletNetwork } from "./transaction-safety.ts";

describe("Arc transaction network boundaries", () => {
  test("a Mainnet wallet cannot send a Testnet action", async () => {
    await expect(assertSelectedWalletNetwork({ getChainId: async () => 5042 }, "testnet")).rejects.toThrow("Arc Testnet");
  });
  test("a Testnet action accepts chain 5042002", async () => {
    await expect(assertSelectedWalletNetwork({ getChainId: async () => 5042002 }, "testnet")).resolves.toBeUndefined();
  });
  test("Mainnet RPC cannot resolve a Testnet contract through the wrong transport", async () => {
    await expect(assertContractDeployment({ getChainId: async () => 5042002, getCode: async () => "0x1234" }, "mainnet", "0x1173776512ae96af2a480a8a1898df8582489425")).rejects.toThrow("RPC");
  });
  test("missing Mainnet deployment prevents writes", async () => {
    await expect(assertContractDeployment({ getChainId: async () => 5042, getCode: async () => "0x" }, "mainnet", "0x1173776512ae96af2a480a8a1898df8582489425")).rejects.toThrow("No contract");
  });
});