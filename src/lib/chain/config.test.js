import { describe, expect, test } from "bun:test";
import {
  getContractAddressForEnvironment,
  getDeploymentBlockForEnvironment,
} from "./config.ts";
import { arcMainnet } from "../arc-network.ts";

describe("canonical Arc Mainnet deployment", () => {
  test("uses chain 5042", () => {
    expect(arcMainnet.id).toBe(5042);
  });

  test("resolves the deployed ExpenseManager without production overrides", () => {
    expect(getContractAddressForEnvironment("mainnet")).toBe(
      "0x709cbad88162b999882788155cde79ade46a6d42",
    );
  });

  test("starts Mainnet event reads at the verified creation block", () => {
    expect(getDeploymentBlockForEnvironment("mainnet")).toBe(21_213_840);
  });
});