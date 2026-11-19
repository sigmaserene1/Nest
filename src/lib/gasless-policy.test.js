import { expect, test } from "bun:test";
import { assertSponsorshipAuthorization, sponsorshipPolicy } from "./gasless-policy.ts";
const recipient = "0x709cbad88162b999882788155cde79ade46a6d42";
const settings = { GASLESS_MAINNET_ENABLED: "true", GASLESS_MAINNET_RECIPIENTS: recipient, GASLESS_MAINNET_MAX_VALUE_UNITS: "1000000", GASLESS_MAINNET_MAX_GAS_UNITS: "100000" };
test("Mainnet sponsorship defaults off even with a deployer configured", () => {
  expect(sponsorshipPolicy("mainnet", { DEPLOYER_PRIVATE_KEY: "not-used" }).enabled).toBe(false);
});
test("Mainnet policy cannot enable Testnet sponsorship", () => {
  expect(sponsorshipPolicy("testnet", settings).enabled).toBe(false);
});
test("sponsorship requires explicit recipient, transfer and gas limits", () => {
  expect(sponsorshipPolicy("mainnet", { GASLESS_MAINNET_ENABLED: "true" }).enabled).toBe(false);
  expect(sponsorshipPolicy("mainnet", settings).enabled).toBe(true);
});
test("out-of-policy recipients cannot spend sponsor gas", () => {
  expect(() => assertSponsorshipAuthorization(sponsorshipPolicy("mainnet", settings), { to: "0x3600000000000000000000000000000000000000", value: "1000000", validAfter: "0", validBefore: "2000" }, 1000n)).toThrow("recipient");
});
test("over-limit transfer amounts cannot be sponsored", () => {
  expect(() => assertSponsorshipAuthorization(sponsorshipPolicy("mainnet", settings), { to: recipient, value: "1000001", validAfter: "0", validBefore: "2000" }, 1000n)).toThrow("amount");
});
test("expired authorizations cannot be sponsored", () => {
  expect(() => assertSponsorshipAuthorization(sponsorshipPolicy("mainnet", settings), { to: recipient, value: "1000000", validAfter: "0", validBefore: "999" }, 1000n)).toThrow("expired");
});