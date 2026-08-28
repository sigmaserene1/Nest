#!/usr/bin/env node

// Read-only deployment check for a user-deployed NestTreasuryV2 contract.
// It recompiles the exact repository source and compares runtime bytecode while
// masking constructor-written immutable slots.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import solc from "solc";

const args = process.argv.slice(2);
const addressIndex = args.indexOf("--address");
const address = addressIndex >= 0 ? args[addressIndex + 1] : undefined;

if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
  console.error("Usage: npm run verify:contract -- --address 0xYourTreasuryAddress");
  process.exit(1);
}

const sourceName = "contracts/NestTreasuryV2.sol";
const source = fs.readFileSync(path.join(process.cwd(), sourceName), "utf8");
const input = {
  language: "Solidity",
  sources: { [sourceName]: { content: source } },
  settings: {
    viaIR: true,
    optimizer: { enabled: true, runs: 200 },
    metadata: { bytecodeHash: "ipfs" },
    outputSelection: {
      "*": { "*": ["evm.deployedBytecode.object", "evm.deployedBytecode.immutableReferences"] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter((entry) => entry.severity === "error");
if (errors.length > 0) {
  for (const error of errors) console.error(error.formattedMessage);
  process.exit(1);
}

const deployed = output.contracts[sourceName].NestTreasuryV2.evm.deployedBytecode;
const localCode = deployed.object.toLowerCase();

const response = await fetch("https://rpc.testnet.arc.io", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getCode",
    params: [address, "latest"],
  }),
});
const payload = await response.json();
if (payload.error) throw new Error(`Arc RPC error: ${payload.error.message}`);
const chainCode = String(payload.result ?? "")
  .toLowerCase()
  .replace(/^0x/, "");
if (!chainCode) throw new Error("No contract bytecode exists at that Arc Testnet address.");

function maskImmutables(code) {
  const chars = code.split("");
  for (const slots of Object.values(deployed.immutableReferences ?? {})) {
    for (const { start, length } of slots) {
      chars.fill("0", start * 2, (start + length) * 2);
    }
  }
  return chars.join("");
}

const matches =
  localCode.length === chainCode.length && maskImmutables(localCode) === maskImmutables(chainCode);

console.log(`NestTreasuryV2 ${address}`);
console.log(`Local runtime: ${localCode.length / 2} bytes`);
console.log(`Arc runtime:   ${chainCode.length / 2} bytes`);
console.log(
  matches
    ? "MATCH: deployment was built from this V2 runtime."
    : "MISMATCH: deployment differs from this V2 runtime.",
);

if (!matches) process.exit(2);
