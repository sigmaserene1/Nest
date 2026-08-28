#!/usr/bin/env node

// One-shot Nest agent executor for schedulers and keepers. Treasury V2 remains
// the authority: this command cannot change destinations or exceed the owner's
// onchain policy, period cap, cooldown, expiry, balance, or USDC allowance.

import process from "node:process";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  encodeFunctionData,
  formatUnits,
  http,
  isAddress,
  keccak256,
  parseUnits,
  stringToHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const treasury = process.env.NEST_TREASURY_ADDRESS;
const owner = process.env.NEST_AGENT_ACCOUNT;
const rawKey = process.env.NEST_AGENT_PRIVATE_KEY;
const requested = process.env.NEST_AGENT_AMOUNT ?? "0";
const dryRun = process.argv.includes("--dry-run") || process.env.NEST_AGENT_DRY_RUN === "true";

if (!treasury || !isAddress(treasury) || !owner || !isAddress(owner) || !rawKey) {
  console.error(
    "Set NEST_TREASURY_ADDRESS, NEST_AGENT_ACCOUNT, and NEST_AGENT_PRIVATE_KEY. " +
      "Optionally set NEST_AGENT_AMOUNT in USDC or pass --dry-run.",
  );
  process.exit(1);
}

const privateKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) throw new Error("Invalid executor private key.");
if (!/^\d+(\.\d{1,6})?$/.test(requested))
  throw new Error("NEST_AGENT_AMOUNT must use at most 6 decimals.");

const arcTestnet = defineChain({
  id: 5_042_002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.io"] } },
  blockExplorers: { default: { name: "Arcscan", url: "https://testnet.arcscan.app" } },
  testnet: true,
});

const treasuryAbi = [
  {
    type: "function",
    name: "VERSION",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getAgentPolicy",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [
      {
        name: "policy",
        type: "tuple",
        components: [
          { name: "executor", type: "address" },
          { name: "maxPerRun", type: "uint96" },
          { name: "maxPerPeriod", type: "uint96" },
          { name: "spentThisPeriod", type: "uint96" },
          { name: "periodIndex", type: "uint64" },
          { name: "validUntil", type: "uint64" },
          { name: "lastRunAt", type: "uint64" },
          { name: "minInterval", type: "uint32" },
          { name: "agentId", type: "uint256" },
          { name: "enabled", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "agentAllowanceRemaining",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "usdcAllowance",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "previewSettlement",
    stateMutability: "view",
    inputs: [
      { name: "debtor", type: "address" },
      { name: "requestedAmount", type: "uint256" },
    ],
    outputs: [
      { name: "creditors", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "total", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "runAgent",
    stateMutability: "nonpayable",
    inputs: [
      { name: "account", type: "address" },
      { name: "requestedAmount", type: "uint256" },
      { name: "memoId", type: "bytes32" },
    ],
    outputs: [
      { name: "runId", type: "uint256" },
      { name: "settlementId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
  },
];

const memoAbi = [
  {
    type: "function",
    name: "memo",
    stateMutability: "nonpayable",
    inputs: [
      { name: "target", type: "address" },
      { name: "data", type: "bytes" },
      { name: "memoId", type: "bytes32" },
      { name: "memoData", type: "bytes" },
    ],
    outputs: [],
  },
];

const memoAddress = "0x5294E9927c3306DcBaDb03fe70b92e01cCede505";
const account = privateKeyToAccount(privateKey);
const transport = http("https://rpc.testnet.arc.io", { retryCount: 2, timeout: 15_000 });
const publicClient = createPublicClient({ chain: arcTestnet, transport });
const walletClient = createWalletClient({ account, chain: arcTestnet, transport });

const [version, policy, remaining, allowance] = await Promise.all([
  publicClient.readContract({ address: treasury, abi: treasuryAbi, functionName: "VERSION" }),
  publicClient.readContract({
    address: treasury,
    abi: treasuryAbi,
    functionName: "getAgentPolicy",
    args: [owner],
  }),
  publicClient.readContract({
    address: treasury,
    abi: treasuryAbi,
    functionName: "agentAllowanceRemaining",
    args: [owner],
  }),
  publicClient.readContract({
    address: treasury,
    abi: treasuryAbi,
    functionName: "usdcAllowance",
    args: [owner],
  }),
]);

if (version !== 2n) throw new Error("Target is not a Nest Treasury V2 contract.");
if (!policy.enabled) throw new Error("The owner's agent policy is disabled.");
if (policy.executor.toLowerCase() !== account.address.toLowerCase()) {
  throw new Error(`Connected executor ${account.address} is not authorised by this policy.`);
}

const requestedUnits = requested === "0" ? 0n : parseUnits(requested, 6);
const cap =
  requestedUnits === 0n || requestedUnits > policy.maxPerRun ? policy.maxPerRun : requestedUnits;
const effectiveRequest = cap > remaining ? remaining : cap;
if (effectiveRequest === 0n) throw new Error("The policy's 30-day allowance is exhausted.");

const [creditors, amounts, total] = await publicClient.readContract({
  address: treasury,
  abi: treasuryAbi,
  functionName: "previewSettlement",
  args: [owner, effectiveRequest],
});
if (total === 0n) throw new Error("The owner has no net debt to settle.");
if (allowance < total) {
  throw new Error(
    `Treasury allowance is ${formatUnits(allowance, 6)} USDC; ${formatUnits(total, 6)} USDC is required.`,
  );
}

console.log(`Treasury: ${treasury}`);
console.log(`Owner:    ${owner}`);
console.log(`Executor: ${account.address}`);
console.log(`Agent ID: ${policy.agentId}`);
console.log(`Route:    ${creditors.length} payment(s), ${formatUnits(total, 6)} USDC`);
creditors.forEach((creditor, index) => {
  console.log(`  ${creditor} <- ${formatUnits(amounts[index], 6)} USDC`);
});

const memoId = keccak256(stringToHex(`nest.agent:${owner}:${Date.now()}`));
const data = encodeFunctionData({
  abi: treasuryAbi,
  functionName: "runAgent",
  args: [owner, effectiveRequest, memoId],
});
const memoData = stringToHex(
  JSON.stringify({ type: "nest.agent-run", account: owner, amount: formatUnits(total, 6) }),
);
const simulation = await publicClient.simulateContract({
  account,
  address: memoAddress,
  abi: memoAbi,
  functionName: "memo",
  args: [treasury, data, memoId, memoData],
});

if (dryRun) {
  console.log("Simulation passed. Dry run requested; no transaction was signed.");
  process.exit(0);
}

const hash = await walletClient.writeContract(simulation.request);
console.log(`Submitted: ${hash}`);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (receipt.status !== "success") throw new Error("Agent execution reverted on Arc.");
console.log(`Final: https://testnet.arcscan.app/tx/${hash}`);
