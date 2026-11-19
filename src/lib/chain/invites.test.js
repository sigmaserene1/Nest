import { expect, test } from "bun:test";
import { applyInvite, buildJoinCode, parseJoinCode } from "./config.ts";
const address = "0x709cbad88162b999882788155cde79ade46a6d42";
test("new Mainnet invitations carry the network even when addresses match", () => {
  expect(parseJoinCode(buildJoinCode(address, 1, "mainnet"))).toEqual({ address, roomId: 1, environment: "mainnet" });
});
test("legacy invitations resolve to Testnet only", () => {
  expect(parseJoinCode(`${address}-20`)?.environment).toBe("testnet");
});
test("a Mainnet invitation cannot be applied on Testnet", () => {
  expect(() => applyInvite(undefined, { address, roomId: 1, environment: "mainnet" })).toThrow("Mainnet");
});
test("zero and unsafe room identifiers are invalid", () => {
  expect(parseJoinCode(`${address}-0`)).toBeNull();
  expect(parseJoinCode(`${address}-9007199254740993`)).toBeNull();
});