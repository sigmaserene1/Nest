// State-changing Nest Treasury V2 actions. Every successful action waits for
// Arc's deterministic final receipt before refreshing the read model.

import { useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import {
  decodeEventLog,
  encodeFunctionData,
  formatUnits,
  keccak256,
  parseUnits,
  stringToHex,
  type Hex,
} from "viem";
import {
  NEST_TREASURY_V2_ABI,
  NEST_TREASURY_V2_BYTECODE,
} from "@/contracts/nest-treasury-v2-artifact";
import { arcTestnet, ERC20_ABI, USDC_ADDRESS } from "@/lib/wagmi";
import { setContractAddress } from "./config";
import { useNestChain } from "./nest-chain";

export type TxStep = (label: string) => void;

export const ARC_MEMO_ADDRESS = "0x5294E9927c3306DcBaDb03fe70b92e01cCede505" as const;
export const ERC8004_IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const;
const ERC721_TRANSFER_TOPIC = keccak256(stringToHex("Transfer(address,address,uint256)"));

const MEMO_ABI = [
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
] as const;

const IDENTITY_REGISTRY_ABI = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [{ name: "metadataURI", type: "string" }],
    outputs: [],
  },
  {
    type: "event",
    name: "Transfer",
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
  },
] as const;

export function toUnits(amount: number): bigint {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Enter a valid USDC amount.");
  return parseUnits(amount.toFixed(6), 6);
}

function makeMemo(label: string) {
  const stamp = `${label}:${Date.now()}:${crypto.randomUUID?.() ?? Math.random()}`;
  return keccak256(stringToHex(stamp));
}

function cleanError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const reason = message.match(/reason:\s*([^\n]+)/i)?.[1] ?? message.split("\n")[0];
  return new Error(reason.replace(/^Error:\s*/i, ""));
}

export function useNestWrites() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });
  const { contractAddress, refresh } = useNestChain();

  const requireEnv = useCallback(() => {
    if (!walletClient || !address) throw new Error("Connect your wallet first.");
    if (!publicClient) throw new Error("Arc Testnet is unavailable right now.");
    return { walletClient, address, publicClient };
  }, [walletClient, address, publicClient]);

  const requireContract = useCallback(() => {
    if (!contractAddress) throw new Error("Open or launch a Nest V2 treasury first.");
    return contractAddress;
  }, [contractAddress]);

  const complete = useCallback(
    async (hash: `0x${string}`) => {
      const { publicClient } = requireEnv();
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Transaction reverted on Arc.");
      await refresh();
      return { hash, receipt };
    },
    [refresh, requireEnv],
  );

  const send = useCallback(
    async (functionName: string, args: readonly unknown[], onStep?: TxStep) => {
      try {
        const { walletClient, address: account, publicClient } = requireEnv();
        const contract = requireContract();
        onStep?.("Simulating on Arc");
        const simulation = await publicClient.simulateContract({
          address: contract,
          abi: NEST_TREASURY_V2_ABI,
          functionName: functionName as never,
          args: args as never,
          account,
        });
        onStep?.("Confirm in wallet");
        const hash = await walletClient.writeContract(simulation.request);
        onStep?.("Finalizing on Arc");
        return (await complete(hash)).hash;
      } catch (error) {
        throw cleanError(error);
      }
    },
    [complete, requireContract, requireEnv],
  );

  const sendWithMemo = useCallback(
    async (
      functionName: string,
      args: readonly unknown[],
      memoId: Hex,
      memoData: Record<string, unknown>,
      onStep?: TxStep,
    ) => {
      try {
        const { walletClient, address: account, publicClient } = requireEnv();
        const contract = requireContract();
        const data = encodeFunctionData({
          abi: NEST_TREASURY_V2_ABI,
          functionName: functionName as never,
          args: args as never,
        });
        const encodedMemo = stringToHex(JSON.stringify(memoData));
        onStep?.("Simulating memo call");
        const simulation = await publicClient.simulateContract({
          address: ARC_MEMO_ADDRESS,
          abi: MEMO_ABI,
          functionName: "memo",
          args: [contract, data, memoId, encodedMemo],
          account,
        });
        onStep?.("Confirm in wallet");
        const hash = await walletClient.writeContract(simulation.request);
        onStep?.("Finalizing on Arc");
        return (await complete(hash)).hash;
      } catch (error) {
        throw cleanError(error);
      }
    },
    [complete, requireContract, requireEnv],
  );

  const deployTreasury = useCallback(
    async (input: { name: string; ownerName: string }, onStep?: TxStep) => {
      try {
        const { walletClient, address: account, publicClient } = requireEnv();
        onStep?.("Confirm treasury deployment");
        const hash = await walletClient.deployContract({
          abi: NEST_TREASURY_V2_ABI,
          bytecode: NEST_TREASURY_V2_BYTECODE,
          args: [USDC_ADDRESS, input.name.trim(), input.ownerName.trim()],
          account,
          chain: arcTestnet,
        });
        onStep?.("Deploying on Arc");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success" || !receipt.contractAddress) {
          throw new Error("Treasury deployment did not finalize.");
        }
        setContractAddress(receipt.contractAddress);
        return { hash, address: receipt.contractAddress };
      } catch (error) {
        throw cleanError(error);
      }
    },
    [requireEnv],
  );

  const ensureAllowanceUnits = useCallback(
    async (needed: bigint, onStep?: TxStep) => {
      const { walletClient, address: account, publicClient } = requireEnv();
      const contract = requireContract();
      const current = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [account, contract],
      });
      if (current >= needed) return null;
      onStep?.("Approve capped USDC access");
      const simulation = await publicClient.simulateContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [contract, needed],
        account,
      });
      const hash = await walletClient.writeContract(simulation.request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("USDC approval failed on Arc.");
      return hash;
    },
    [requireContract, requireEnv],
  );

  const ensureAllowance = useCallback(
    (amount: number, onStep?: TxStep) => ensureAllowanceUnits(toUnits(amount), onStep),
    [ensureAllowanceUnits],
  );

  const inviteMember = useCallback(
    (member: `0x${string}`, displayName = "", admin = false, onStep?: TxStep) =>
      send("addMember", [member, displayName, admin], onStep),
    [send],
  );

  const claimName = useCallback(
    (name: string, onStep?: TxStep) => send("setDisplayName", [name.trim()], onStep),
    [send],
  );

  const addExpense = useCallback(
    (
      input: { title: string; category: string; amount: number; participants: string[] },
      onStep?: TxStep,
    ) => {
      if (input.participants.length === 0) throw new Error("Select at least one participant.");
      const total = toUnits(input.amount);
      const count = BigInt(input.participants.length);
      const base = total / count;
      const remainder = total - base * count;
      const shares = input.participants.map((_, index) => base + (index === 0 ? remainder : 0n));
      const referenceId = makeMemo(`obligation:${input.title}`);
      return send(
        "addObligation",
        [input.participants as `0x${string}`[], shares, input.category, input.title, referenceId],
        onStep,
      );
    },
    [send],
  );

  const settleNet = useCallback(
    async (amount = 0, onStep?: TxStep) => {
      const { address: account, publicClient } = requireEnv();
      const contract = requireContract();
      const requested = amount > 0 ? toUnits(amount) : 0n;
      const preview = await publicClient.readContract({
        address: contract,
        abi: NEST_TREASURY_V2_ABI,
        functionName: "previewSettlement",
        args: [account, requested],
      });
      const total = preview[2];
      if (total <= 0n) throw new Error("Your onchain net balance is already clear.");
      await ensureAllowanceUnits(total, onStep);
      const memoId = makeMemo("net-settlement");
      return sendWithMemo(
        "settleMyBalance",
        [requested, memoId],
        memoId,
        { type: "nest.net-settlement", account, amount: formatUnits(total, 6) },
        onStep,
      );
    },
    [ensureAllowanceUnits, requireContract, requireEnv, sendWithMemo],
  );

  const setAgentPolicy = useCallback(
    (
      input: {
        executor: `0x${string}`;
        agentId: bigint;
        maxPerRun: number;
        maxPerPeriod: number;
        minInterval: number;
        validUntil?: number | null;
        enabled: boolean;
      },
      onStep?: TxStep,
    ) =>
      send(
        "setAgentPolicy",
        [
          input.executor,
          input.agentId,
          toUnits(input.maxPerRun),
          toUnits(input.maxPerPeriod),
          input.minInterval,
          BigInt(input.validUntil ?? 0),
          input.enabled,
        ],
        onStep,
      ),
    [send],
  );

  const runAgent = useCallback(
    async (account: `0x${string}`, amount: number, onStep?: TxStep) => {
      const memoId = makeMemo("agent-run");
      return sendWithMemo(
        "runAgent",
        [account, amount > 0 ? toUnits(amount) : 0n, memoId],
        memoId,
        { type: "nest.agent-run", account, requested: amount },
        onStep,
      );
    },
    [sendWithMemo],
  );

  const registerAgent = useCallback(
    async (metadataURI: string, onStep?: TxStep) => {
      const { walletClient, address: account, publicClient } = requireEnv();
      onStep?.("Register ERC-8004 identity");
      const simulation = await publicClient.simulateContract({
        address: ERC8004_IDENTITY_REGISTRY,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: "register",
        args: [metadataURI],
        account,
      });
      const hash = await walletClient.writeContract(simulation.request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("Agent registration reverted on Arc.");

      const transferLog = receipt.logs.find(
        (log) =>
          log.address.toLowerCase() === ERC8004_IDENTITY_REGISTRY.toLowerCase() &&
          log.topics[0]?.toLowerCase() === ERC721_TRANSFER_TOPIC.toLowerCase(),
      );
      if (!transferLog)
        throw new Error("Agent identity was registered, but its token ID was not found.");
      const decoded = decodeEventLog({
        abi: IDENTITY_REGISTRY_ABI,
        eventName: "Transfer",
        data: transferLog.data,
        topics: transferLog.topics,
      });
      return { hash, agentId: decoded.args.tokenId };
    },
    [requireEnv],
  );

  return {
    deployTreasury,
    inviteMember,
    claimName,
    addExpense,
    settleNet,
    ensureAllowance,
    setAgentPolicy,
    runAgent,
    registerAgent,
  };
}
