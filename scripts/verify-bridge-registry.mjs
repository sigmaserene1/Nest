#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";
import solc from "solc";

const ADDRESS = "0x2dd392fc3f6b10e5520c309164216351f4f7c27b";
const SOURCE_PATH = "contracts/NestBridgeRegistry.sol";
const CONTRACT_NAME = "NestBridgeRegistry";
const COMPILER_VERSION = "v0.8.28+commit.7893614a";
const RPC_URL = "https://rpc.testnet.arc.network";
const EXPLORER_API = "https://explorer.testnet.arc.io/api";

const source = fs.readFileSync(SOURCE_PATH, "utf8");

const input = {
  language: "Solidity",
  sources: {
    [SOURCE_PATH]: { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "metadata", "evm.bytecode", "evm.deployedBytecode"],
      },
    },
  },
};

function compile() {
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const fatal = (output.errors ?? []).filter((e) => e.severity === "error");
  if (fatal.length) throw new Error(fatal.map((e) => e.formattedMessage).join("\n"));

  const artifact = output.contracts?.[SOURCE_PATH]?.[CONTRACT_NAME];
  if (!artifact) throw new Error("Registry contract missing from compiler output.");
  return artifact.evm.deployedBytecode.object.toLowerCase().replace(/^0x/, "");
}

async function rpc(method, params) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

function stripMetadata(hex) {
  // Solidity metadata tail is normally 53 bytes for ipfs metadata.
  return hex.slice(0, Math.max(0, hex.length - 106));
}

async function currentVerificationState() {
  const urls = [
    `${EXPLORER_API}/v2/smart-contracts/${ADDRESS}`,
    `https://explorer.testnet.arc.io/api/v2/smart-contracts/${ADDRESS}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = await res.json();
      if (typeof json.is_verified === "boolean") {
        return {
          verified: json.is_verified,
          partial: Boolean(json.is_partially_verified),
        };
      }
    } catch {}
  }
  return { verified: false, partial: false };
}

async function submitClassic() {
  const body = new URLSearchParams({
    module: "contract",
    action: "verifysourcecode",
    codeformat: "solidity-standard-json-input",
    contractaddress: ADDRESS,
    contractname: `${SOURCE_PATH}:${CONTRACT_NAME}`,
    compilerversion: COMPILER_VERSION,
    sourceCode: JSON.stringify(input),
    constructorArguements: "",
    licenseType: "3",
  });
  const res = await fetch(EXPLORER_API, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Explorer returned non-JSON: ${text.slice(0, 500)}`);
  }
}

async function poll(guid) {
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const url =
      `${EXPLORER_API}?module=contract&action=checkverifystatus&guid=` +
      encodeURIComponent(guid);
    const res = await fetch(url);
    const json = await res.json().catch(() => ({}));
    const result = String(json.result ?? "");
    console.log(`Verification status: ${result || "pending"}`);
    if (/pending|queue/i.test(result)) continue;
    return json;
  }
  throw new Error("Explorer verification timed out.");
}

async function main() {
  const local = compile();
  const onchain = String(await rpc("eth_getCode", [ADDRESS, "latest"]))
    .toLowerCase()
    .replace(/^0x/, "");

  if (!onchain) throw new Error("No contract bytecode at target address.");

  const exact = local === onchain;
  const semantic =
    local.length === onchain.length &&
    stripMetadata(local) === stripMetadata(onchain);

  console.log(`Local runtime:   ${local.length / 2} bytes`);
  console.log(`Onchain runtime: ${onchain.length / 2} bytes`);
  console.log(`Bytecode match:  ${exact ? "exact" : semantic ? "metadata-only difference" : "NO MATCH"}`);

  if (!exact && !semantic) {
    throw new Error("Local registry source does not match deployed runtime bytecode.");
  }

  const before = await currentVerificationState();
  if (before.verified && !before.partial) {
    console.log("Explorer already reports this contract as fully verified.");
    return;
  }

  const submitted = await submitClassic();
  console.log("Explorer response:", submitted);

  if (submitted.status === "1" && submitted.result) {
    await poll(String(submitted.result));
  } else {
    const result = String(submitted.result ?? submitted.message ?? "");
    if (!/already verified/i.test(result)) {
      throw new Error(`Verification submission failed: ${result}`);
    }
  }

  // Give Blockscout a moment to update its smart-contract endpoint.
  await new Promise((r) => setTimeout(r, 5000));
  const after = await currentVerificationState();
  console.log("Final explorer state:", after);
  if (!after.verified) {
    throw new Error("Explorer did not report the registry as verified.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
