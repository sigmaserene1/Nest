import fs from "node:fs";
import process from "node:process";
import solc from "solc";
import { createPublicClient, createWalletClient, defineChain, http, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC_URL = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network";
const USDC_ADDRESS = process.env.ARC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error("Set DEPLOYER_PRIVATE_KEY as a Codespaces secret before deploying.");
}
if (!isAddress(USDC_ADDRESS)) throw new Error("ARC_USDC_ADDRESS must be a valid address.");

const chain = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: [RPC_URL] } },
  testnet: true,
});
const sourcePath = "contracts/NestBusinessV2.sol";
const source = fs.readFileSync(sourcePath, "utf8");
const output = JSON.parse(
  solc.compile(
    JSON.stringify({
      language: "Solidity",
      sources: { [sourcePath]: { content: source } },
      settings: {
        optimizer: { enabled: true, runs: 200 },
        outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
      },
    }),
  ),
);
const errors = (output.errors || []).filter((error) => error.severity === "error");
if (errors.length) throw new Error(errors.map((error) => error.formattedMessage).join("\n"));

const contract = output.contracts[sourcePath].NestBusinessV2;
const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain, transport: http(RPC_URL) });

console.log(`Deploying NestBusinessV2 from ${account.address} on Arc Testnet…`);
const hash = await walletClient.deployContract({
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
  args: [USDC_ADDRESS],
});
console.log(`Deployment transaction: ${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success" || !receipt.contractAddress) {
  throw new Error("Deployment transaction did not produce a contract address.");
}
console.log(`Nest Business V2: ${receipt.contractAddress}`);
console.log(
  `Set VITE_NEST_BUSINESS_V2_ADDRESS=${receipt.contractAddress} before publishing the app.`,
);
