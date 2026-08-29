import fs from "node:fs";
import process from "node:process";
import solc from "solc";
import { createPublicClient, createWalletClient, defineChain, http, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const sourcePath = "contracts/NestBusinessV2.sol";
const compilerOutput = JSON.parse(
  solc.compile(
    JSON.stringify({
      language: "Solidity",
      sources: { [sourcePath]: { content: fs.readFileSync(sourcePath, "utf8") } },
      settings: { outputSelection: { "*": { "*": ["abi"] } } },
    }),
  ),
);
const compilerErrors = (compilerOutput.errors || []).filter((error) => error.severity === "error");
if (compilerErrors.length) {
  throw new Error(compilerErrors.map((error) => error.formattedMessage).join("\n"));
}
const NEST_BUSINESS_V2_ABI = compilerOutput.contracts[sourcePath].NestBusinessV2.abi;

const rpcUrl = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network";
const contractAddress = process.env.NEST_BUSINESS_V2_ADDRESS;
const roomId = process.env.NEST_AGENT_ROOM_ID;
const privateKey = process.env.NEST_AGENT_PRIVATE_KEY;

if (!contractAddress || !isAddress(contractAddress)) {
  throw new Error("Set NEST_BUSINESS_V2_ADDRESS to the deployed V2 contract.");
}
if (!roomId || !/^\d+$/.test(roomId) || BigInt(roomId) < 1n) {
  throw new Error("Set NEST_AGENT_ROOM_ID to a positive workspace ID.");
}
if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  throw new Error("Set NEST_AGENT_PRIVATE_KEY in a secret store; never commit it.");
}

const chain = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: [rpcUrl] } },
  testnet: true,
});
const account = privateKeyToAccount(privateKey);
const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });
const workspace = BigInt(roomId);
const members = await publicClient.readContract({
  address: contractAddress,
  abi: NEST_BUSINESS_V2_ABI,
  functionName: "getRoomMembers",
  args: [workspace],
});

let settled = 0;
for (const debtor of members) {
  const policy = await publicClient.readContract({
    address: contractAddress,
    abi: NEST_BUSINESS_V2_ABI,
    functionName: "getAgentPolicy",
    args: [workspace, debtor, account.address],
  });
  if (!policy.active) continue;

  for (const creditor of members) {
    if (debtor === creditor) continue;
    const owed = await publicClient.readContract({
      address: contractAddress,
      abi: NEST_BUSINESS_V2_ABI,
      functionName: "owedBetween",
      args: [workspace, debtor, creditor],
    });
    if (owed === 0n) continue;
    try {
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: NEST_BUSINESS_V2_ABI,
        functionName: "settleWithFor",
        args: [workspace, debtor, creditor],
        account,
        chain,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("transaction reverted");
      settled += 1;
      console.log(`Settled ${debtor} → ${creditor}: ${hash}`);
    } catch (error) {
      // A skipped pair can be normal: expired/revoked/capped policy, a missing
      // USDC allowance, or no longer-open expense. The V2 contract enforces all
      // limits again onchain, so this runner has no broad payment authority.
      console.warn(
        `Skipped ${debtor} → ${creditor}: ${(error instanceof Error ? error.message : String(error)).split("\n")[0]}`,
      );
    }
  }
}
console.log(`Business agent finished: ${settled} settlement${settled === 1 ? "" : "s"} submitted.`);
