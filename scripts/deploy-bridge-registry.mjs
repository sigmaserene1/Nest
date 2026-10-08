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
  throw new Error(
    "Set CONFIRM_MAINNET_DEPLOY=YES only after checking the deployer wallet and Arc Mainnet network.",
  );
}

const RPC_URL =
  process.env.ARC_RPC_URL ||
  (isMainnet
    ? "https://rpc.mainnet.arc.io"
    : "https://rpc.testnet.arc.network");

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error(
    "Set DEPLOYER_PRIVATE_KEY as a secret. Never paste or commit the private key.",
  );
}

const chain = defineChain({
  id: isMainnet ? 5042 : 5042002,
  name: isMainnet ? "Arc Mainnet" : "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: isMainnet
        ? "https://explorer.arc.io"
        : "https://explorer.testnet.arc.io",
    },
  },
  testnet: !isMainnet,
});

const sourcePath = "contracts/NestBridgeRegistry.sol";
const source = fs.readFileSync(sourcePath, "utf8");
const output = JSON.parse(
  solc.compile(
    JSON.stringify({
      language: "Solidity",
      sources: { [sourcePath]: { content: source } },
      settings: {
        optimizer: { enabled: true, runs: 200 },
        outputSelection: {
          "*": { "*": ["abi", "evm.bytecode"] },
        },
      },
    }),
  ),
);

const errors = (output.errors || []).filter((error) => error.severity === "error");
if (errors.length) {
  throw new Error(errors.map((error) => error.formattedMessage).join("\n"));
}

const contract = output.contracts?.[sourcePath]?.NestBridgeRegistry;
if (!contract?.evm?.bytecode?.object) {
  throw new Error("NestBridgeRegistry compiler output is missing bytecode.");
}

const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain, transport: http(RPC_URL) });

const reportedChainId = await publicClient.getChainId();
if (reportedChainId !== chain.id) {
  throw new Error(
    `RPC chain mismatch: expected ${chain.id}, received ${reportedChainId}.`,
  );
}

console.log(`Deploying NestBridgeRegistry from ${account.address} on ${chain.name}…`);

const hash = await walletClient.deployContract({
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
});

console.log(`Deployment transaction: ${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash });

if (receipt.status !== "success" || !receipt.contractAddress) {
  throw new Error("Deployment failed or produced no contract address.");
}

console.log(`NestBridgeRegistry: ${receipt.contractAddress}`);
console.log(`Deployment block: ${receipt.blockNumber}`);
console.log(`Explorer: ${chain.blockExplorers.default.url}/address/${receipt.contractAddress}`);

console.log("\nSet this in the app environment:");
console.log(
  isMainnet
    ? `VITE_NEST_BRIDGE_REGISTRY_MAINNET_ADDRESS=${receipt.contractAddress}`
    : `VITE_NEST_BRIDGE_REGISTRY_ADDRESS=${receipt.contractAddress}`,
);
