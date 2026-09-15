import fs from "node:fs";
import process from "node:process";
import solc from "solc";
import { createPublicClient, createWalletClient, defineChain, http, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// MAINNET CONFIG — update after launch if RPC changes
const RPC_URL = process.env.ARC_MAINNET_RPC || "https://rpc.arc.network";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error("Set DEPLOYER_PRIVATE_KEY for mainnet deployer");
}

const chain = defineChain({
  id: 5042001, // Arc mainnet chain ID
  name: "Arc",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: [RPC_URL] } },
  testnet: false,
});

const sourcePath = "contracts/ExpenseManager.sol";
const source = fs.readFileSync(sourcePath, "utf8");

// Compile with EXACT same settings as testnet (proven to work)
const output = JSON.parse(solc.compile(JSON.stringify({
  language: "Solidity",
  sources: { [sourcePath]: { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata"] } },
  },
})));

const errors = (output.errors || []).filter(e => e.severity === "error");
if (errors.length) throw new Error(errors.map(e => e.formattedMessage).join("\n"));

const contract = output.contracts[sourcePath].ExpenseManager;
const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const walletClient = createWalletClient({ account, chain, transport: http(RPC_URL) });

console.log("🚀 Deploying ExpenseManager to Arc MAINNET...");
console.log("From:", account.address);
console.log("Chain ID:", chain.id);

// Check balance first
const balance = await publicClient.getBalance({ address: account.address });
console.log("Deployer balance:", Number(balance) / 1e6, "USDC");

if (Number(balance) < 1e6) { // Less than 1 USDC
  throw new Error("Insufficient USDC for gas. Fund your deployer wallet.");
}

const hash = await walletClient.deployContract({
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
  args: [USDC_ADDRESS],
});

console.log("📝 Transaction:", hash);
const receipt = await publicClient.waitForTransactionReceipt({ hash });

if (receipt.status !== "success" || !receipt.contractAddress) {
  throw new Error("Deployment failed");
}

const address = receipt.contractAddress;
console.log("✅ Deployed at:", address);
console.log("🔗 Explorer: https://arcscan.app/address/" + address);

// Save for verification
fs.writeFileSync("verification/mainnet-address.txt", address);
fs.writeFileSync("verification/mainnet-metadata.json", contract.metadata);

console.log("\n📋 Next: Run verification");
console.log(`node scripts/verify-contract.mjs --address ${address}`);
