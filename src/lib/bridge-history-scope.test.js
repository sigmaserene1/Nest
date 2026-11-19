import { expect, test } from "bun:test";
import { belongsToBridgeEnvironment, bridgeHistoryStorageKey } from "./bridge-history-scope.ts";
test("Mainnet bridge history cannot include Testnet transfers", () => {
  expect(belongsToBridgeEnvironment({ fromId: "5042002", toId: "84532" }, "mainnet")).toBe(false);
});
test("mixed network transfers are rejected", () => {
  expect(belongsToBridgeEnvironment({ fromId: "5042", toId: "84532" }, "mainnet")).toBe(false);
});
test("wallet history keys are separate for each network", () => {
  expect(bridgeHistoryStorageKey("0xABC", "mainnet")).toBe("nest.bridge.history.mainnet.0xabc");
  expect(bridgeHistoryStorageKey("0xABC", "testnet")).not.toBe(bridgeHistoryStorageKey("0xABC", "mainnet"));
});