import { expect, test } from "bun:test";
import { circleBridgeHashes, isCircleArcBridgeRoute } from "./circle-bridge.ts";
test("Mainnet cannot bridge directly to a Testnet", () => {
  expect(isCircleArcBridgeRoute(5042, 84532)).toBe(false);
  expect(isCircleArcBridgeRoute(5042002, 8453)).toBe(false);
});
test("same-environment Arc routes remain selectable", () => {
  expect(isCircleArcBridgeRoute(5042, 8453)).toBe(true);
  expect(isCircleArcBridgeRoute(5042002, 84532)).toBe(true);
});
test("an approval is never evidence of a bridge burn", () => {
  expect(circleBridgeHashes({ steps: [{ name: "approve", txHash: `0x${"a".repeat(64)}` }] }).sourceHash).toBeUndefined();
});