import fs from "node:fs";
import path from "node:path";
import solc from "solc";
import prettier from "prettier";

const root = process.cwd();
const sourceName = "contracts/NestTreasuryV2.sol";
const source = fs.readFileSync(path.join(root, sourceName), "utf8");

const input = {
  language: "Solidity",
  sources: { [sourceName]: { content: source } },
  settings: {
    viaIR: true,
    optimizer: { enabled: true, runs: 200 },
    metadata: { bytecodeHash: "ipfs" },
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter((entry) => entry.severity === "error");
if (errors.length > 0) {
  for (const error of errors) console.error(error.formattedMessage);
  process.exit(1);
}

const contract = output.contracts[sourceName].NestTreasuryV2;
const artifact = `// AUTO-GENERATED from ${sourceName} (solc ${solc.version()}, viaIR, optimizer 200 runs).\n// Run npm run build:contract after changing the Solidity source.\n\nexport const NEST_TREASURY_V2_ABI = ${JSON.stringify(contract.abi, null, 2)} as const;\n\nexport const NEST_TREASURY_V2_BYTECODE = "0x${contract.evm.bytecode.object}" as const;\n`;
const formattedArtifact = await prettier.format(artifact, { parser: "typescript" });

const outFile = path.join(root, "src/contracts/nest-treasury-v2-artifact.ts");
fs.writeFileSync(outFile, formattedArtifact);

const runtimeBytes = contract.evm.deployedBytecode.object.length / 2;
console.log(`Wrote ${path.relative(root, outFile)} (${runtimeBytes} runtime bytes)`);
if (runtimeBytes > 24_576) {
  console.error("Runtime bytecode exceeds the EIP-170 contract size limit.");
  process.exit(1);
}
