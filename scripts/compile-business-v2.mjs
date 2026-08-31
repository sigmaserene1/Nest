// Deterministic compilation of contracts/NestBusinessV2.sol.
// Shared by the deploy, verify and ABI-generation scripts so the deployed
// bytecode and the verification standard-JSON input can never drift apart.
import fs from "node:fs";
import solc from "solc";

export const SOURCE_PATH = "contracts/NestBusinessV2.sol";
export const CONTRACT_NAME = "NestBusinessV2";
export const SOLC_VERSION = "0.8.28";

export function buildStandardInput() {
  return {
    language: "Solidity",
    sources: { [SOURCE_PATH]: { content: fs.readFileSync(SOURCE_PATH, "utf8") } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      metadata: { bytecodeHash: "ipfs", appendCBOR: true },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } },
    },
  };
}

export function compileBusinessV2() {
  const input = buildStandardInput();
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter((error) => error.severity === "error");
  if (errors.length) throw new Error(errors.map((error) => error.formattedMessage).join("\n"));
  const contract = output.contracts[SOURCE_PATH][CONTRACT_NAME];
  return {
    input,
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
    deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
    warnings: (output.errors || []).filter((error) => error.severity !== "error"),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { abi, deployedBytecode, warnings } = compileBusinessV2();
  const size = (deployedBytecode.length - 2) / 2;
  console.log(`solc ${solc.version()}`);
  console.log(`ABI entries: ${abi.length}`);
  console.log(`Runtime size: ${size} bytes (EIP-170 limit 24576)`);
  if (size > 24576) throw new Error("Runtime bytecode exceeds the EVM contract-size limit.");
  for (const warning of warnings) console.log(warning.formattedMessage.trim());
}
