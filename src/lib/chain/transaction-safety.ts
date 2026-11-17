import { arcChainFor, getArcEnvironment, type ArcEnvironment } from "@/lib/arc-network";

/** Check the provider, not just wagmi's potentially stale connected-chain state. */
export async function assertSelectedWalletNetwork(
  wallet: { getChainId: () => Promise<number> },
  environment: ArcEnvironment,
) {
  const chain = arcChainFor(environment);
  if (getArcEnvironment() !== environment) {
    throw new Error("The selected network changed. Review this action again.");
  }
  if ((await wallet.getChainId()) !== chain.id) {
    throw new Error(`Switch your wallet to ${chain.name} before continuing.`);
  }
}

export async function assertContractDeployment(
  client: { getChainId: () => Promise<number>; getCode: (args: { address: `0x${string}` }) => Promise<string | undefined> },
  environment: ArcEnvironment,
  address: `0x${string}`,
) {
  const chain = arcChainFor(environment);
  if ((await client.getChainId()) !== chain.id) {
    throw new Error(`The RPC is not connected to ${chain.name}.`);
  }
  const code = await client.getCode({ address });
  if (!code || code === "0x") {
    throw new Error(`No contract is deployed at the configured address on ${chain.name}.`);
  }
}