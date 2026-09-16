import fs from "node:fs";
import process from "node:process";
import solc from "solc";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const network = String(process.env.ARC_NETWORK ?? "testnet").toLowerCase();
if (network !== "testnet" && network !== "mainnet") {
  throw new Error("ARC_NETWORK must be either testnet or mainnet.");
}

const isMainnet = network === "mainnet";
if (isMainnet && process.env.CONFIRM_MAINNET_DEPLOY !== "YES") {
  throw new Error(
    "Mainnet deployment moves real USDC for gas. Set CONFIRM_MAINNET_DEPLOY=YES only after checking the deployer wallet and network.",
  );
}

const defaultRpc = isMainnet
  ? "https://rpc.mainnet.arc.io"
  : "https://rpc.testnet.arc.network";
const RPC_URL = process.env.ARC_RPC_URL || defaultRpc;
const USDC_ADDRESS =
  process.env.ARC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error(
    "Set DEPLOYER_PRIVATE_KEY as a Codespaces/GitHub secret. Never paste or commit the private key.",
  );
}
if (!isAddress(USDC_ADDRESS)) {
  throw new Error("ARC_USDC_ADDRESS must be a valid address.");
}

const chain = defineChain({
  id: isMainnet ? 5042 : 5042002,
  name: isMainnet ? "Arc Mainnet" : "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: {
    default: {
      name: isMainnet ? "Arc Explorer" : "Arcscan",
      url: isMainnet ? "https://explorer.arc.io" : "https://testnet.arcscan.app",
    },
  },
  testnet: !isMainnet,
});

const sourcePath = "contracts/ExpenseManager.sol";
const source = fs.readFileSync(sourcePath, "utf8");
const output = JSON.parse(
  solc.compile(
    JSON.stringify({
      language: "Solidity",
      sources: { [sourcePath]: { content: source } },
      settings: {
        optimizer: { enabled: true, runs: 200 },
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode"],
          },
        },
      },
    }),
  ),
);

const errors = (output.errors || []).filter((error) => error.severity === "error");
if (errors.length) {
  throw new Error(errors.map((error) => error.formattedMessage).join("\n"));
}

const contract = output.contracts?.[sourcePath]?.ExpenseManager;
if (!contract?.evm?.bytecode?.object) {
  throw new Error("ExpenseManager compiler output is missing bytecode.");
}

const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain, transport: http(RPC_URL) });

const reportedChainId = await publicClient.getChainId();
if (reportedChainId !== chain.id) {
  throw new Error(
    `RPC chain mismatch: expected ${chain.id}, received ${reportedChainId}. Deployment aborted.`,
  );
}

console.log(`Deploying ExpenseManager from ${account.address} on ${chain.name}…`);
console.log(`RPC chain ID verified: ${reportedChainId}`);
console.log(`USDC: ${USDC_ADDRESS}`);

const hash = await walletClient.deployContract({
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
  args: [USDC_ADDRESS],
});

console.log(`Deployment transaction: ${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash });

if (receipt.status !== "success" || !receipt.contractAddress) {
  throw new Error("Deployment transaction failed or produced no contract address.");
}

console.log(`ExpenseManager: ${receipt.contractAddress}`);
console.log(`Deployment block: ${receipt.blockNumber}`);
console.log(`Explorer: ${chain.blockExplorers.default.url}/address/${receipt.contractAddress}`);

if (isMainnet) {
  console.log("\nSet these in your production app environment:");
  console.log(
    `VITE_NEST_EXPENSE_MANAGER_MAINNET_ADDRESS=${receipt.contractAddress}`,
  );
  console.log(
    `VITE_NEST_EXPENSE_MANAGER_MAINNET_BLOCK=${receipt.blockNumber.toString()}`,
  );
  console.log("VITE_ARC_DEFAULT_NETWORK=mainnet");
}
