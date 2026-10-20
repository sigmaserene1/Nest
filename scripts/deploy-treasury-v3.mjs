import fs from "node:fs";
import process from "node:process";
import solc from "solc";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const network = String(process.env.ARC_NETWORK ?? "testnet").toLowerCase();
if (network !== "testnet" && network !== "mainnet") {
  throw new Error("ARC_NETWORK must be either testnet or mainnet.");
}

const isMainnet = network === "mainnet";
if (isMainnet && process.env.CONFIRM_MAINNET_DEPLOY !== "YES") {
  throw new Error("Set CONFIRM_MAINNET_DEPLOY=YES only after reviewing the production deployment.");
}

const RPC_URL =
  process.env.ARC_RPC_URL ||
  (isMainnet ? "https://rpc.mainnet.arc.io" : "https://rpc.testnet.arc.io");

const rawPrivateKey = String(process.env.DEPLOYER_PRIVATE_KEY ?? "").trim();
const privateKey = /^[0-9a-fA-F]{64}$/.test(rawPrivateKey)
  ? `0x${rawPrivateKey}`
  : rawPrivateKey;
if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error("DEPLOYER_PRIVATE_KEY must be a 32-byte hex private key.");
}

const chain = defineChain({
  id: isMainnet ? 5042 : 5042002,
  name: isMainnet ? "Arc Mainnet" : "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: isMainnet ? "https://explorer.arc.io" : "https://explorer.testnet.arc.io",
    },
  },
  testnet: !isMainnet,
});

const USDC = "0x3600000000000000000000000000000000000000";
const sourcePath = "contracts/NestTreasuryV3.sol";
const source = fs.readFileSync(sourcePath, "utf8");

const output = JSON.parse(solc.compile(JSON.stringify({
  language: "Solidity",
  sources: { [sourcePath]: { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
  },
})));

const errors = (output.errors || []).filter((error) => error.severity === "error");
if (errors.length) throw new Error(errors.map((error) => error.formattedMessage).join("\n"));

const contract = output.contracts?.[sourcePath]?.NestTreasuryV3;
if (!contract?.evm?.bytecode?.object) throw new Error("NestTreasuryV3 compiler output is missing bytecode.");

const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain, transport: http(RPC_URL) });

const reportedChainId = await publicClient.getChainId();
if (reportedChainId !== chain.id) {
  throw new Error(`RPC chain mismatch: expected ${chain.id}, received ${reportedChainId}.`);
}

console.log(`Deploying NestTreasuryV3 from ${account.address} on ${chain.name}…`);
const hash = await walletClient.deployContract({
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
  args: [USDC],
});

console.log(`Deployment transaction: ${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success" || !receipt.contractAddress) {
  throw new Error("Deployment failed or produced no contract address.");
}

console.log(`NestTreasuryV3: ${receipt.contractAddress}`);
console.log(`Deployment block: ${receipt.blockNumber}`);
console.log(`Explorer: ${chain.blockExplorers.default.url}/address/${receipt.contractAddress}`);
console.log(isMainnet
  ? `VITE_NEST_TREASURY_V3_MAINNET_ADDRESS=${receipt.contractAddress}`
  : `VITE_NEST_TREASURY_V3_ADDRESS=${receipt.contractAddress}`);
