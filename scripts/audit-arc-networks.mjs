// Read-only: no private key, signing, deployment or transaction broadcast.
import { createPublicClient, http, parseAbi, keccak256 } from "viem";
const abi = parseAbi(["function usdc() view returns (address)", "function decimals() view returns (uint8)", "function roomCount() view returns (uint256)", "function workspaceCount() view returns (uint256)", "function bridgeCount() view returns (uint256)"]);
const usdc = "0x3600000000000000000000000000000000000000";
let failed = false;
for (const environment of ["testnet", "mainnet"]) {
  const expectedId = environment === "mainnet" ? 5042 : 5042002;
  const client = createPublicClient({ transport: http(`https://rpc.${environment}.arc.io`, { timeout: 20000, retryCount: 1 }) });
  for (const [contract, address, functions] of [
    ["USDC", usdc, ["decimals"]],
    ["ExpenseManager", "0x709cbad88162b999882788155cde79ade46a6d42", ["usdc", "roomCount"]],
    ["NestTreasuryV3", environment === "testnet" ? "0x1173776512ae96af2a480a8a1898df8582489425" : process.env.VITE_NEST_TREASURY_V3_MAINNET_ADDRESS, ["usdc", "workspaceCount"]],
    ["NestBridgeRegistry", environment === "testnet" ? "0x2dd392fc3f6b10e5520c309164216351f4f7c27b" : process.env.VITE_NEST_BRIDGE_REGISTRY_MAINNET_ADDRESS, ["bridgeCount"]],
  ]) {
    const evidence = { environment, expectedId, contract, address: address ?? null };
    try {
      if (!address) { evidence.status = "NOT_CONFIGURED"; failed = true; }
      else {
        const chainId = await client.getChainId();
        if (chainId !== expectedId) throw new Error("RPC chain mismatch");
        evidence.block = String(await client.getBlockNumber());
        const code = await client.getCode({ address });
        if (!code || code === "0x") throw new Error("NOT_DEPLOYED");
        evidence.codeBytes = (code.length - 2) / 2;
        evidence.codeHash = keccak256(code);
        for (const functionName of functions) {
          const value = String(await client.readContract({ address, abi, functionName }));
          evidence[functionName] = value;
          if (functionName === "usdc" && value.toLowerCase() !== usdc) throw new Error("Wrong immutable USDC");
          if (functionName === "decimals" && value !== "6") throw new Error("Wrong ERC-20 decimals");
        }
        evidence.status = "READS_VERIFIED_WRITES_UNTESTED";
      }
    } catch (error) { evidence.status = "BLOCKED"; evidence.error = error.shortMessage ?? error.message; failed = true; }
    console.log(JSON.stringify(evidence));
  }
}
process.exitCode = failed ? 1 : 0;