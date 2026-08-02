import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { EXPENSE_MANAGER_ABI, EXPENSE_MANAGER_BYTECODE } from "/dev-server/src/contracts/expense-manager-artifact.ts";

const arc = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
});
const USDC = "0x3600000000000000000000000000000000000000";

let pk = process.env.ARC_DEPLOYER_PRIVATE_KEY?.trim();
if (!pk) throw new Error("ARC_DEPLOYER_PRIVATE_KEY missing");
if (!pk.startsWith("0x")) pk = "0x" + pk;
const account = privateKeyToAccount(pk);
const pub = createPublicClient({ chain: arc, transport: http() });
const wallet = createWalletClient({ account, chain: arc, transport: http() });

console.log("deployer:", account.address);
console.log("balance:", (await pub.getBalance({ address: account.address })).toString());
const hash = await wallet.deployContract({ abi: EXPENSE_MANAGER_ABI, bytecode: EXPENSE_MANAGER_BYTECODE, args: [USDC] });
console.log("tx:", hash);
const r = await pub.waitForTransactionReceipt({ hash });
console.log("status:", r.status, "address:", r.contractAddress);
