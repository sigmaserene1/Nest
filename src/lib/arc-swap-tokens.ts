import type { Address } from "viem";
import type { ArcEnvironment } from "@/lib/arc-network";

export type NestSwapToken = "USDC" | "EURC" | "cirBTC";

export type NestSwapTokenConfig = {
  symbol: NestSwapToken;
  name: string;
  address: Address;
  decimals: number;
  accent: string;
};

/**
 * Circle-issued assets used by Nest's Arc swap screen.
 *
 * App Kit accepts contract addresses as token identifiers. We use the exact
 * per-network contracts instead of assuming the same EURC/cirBTC address on
 * testnet and mainnet.
 */
const TOKENS: Record<ArcEnvironment, Record<NestSwapToken, NestSwapTokenConfig>> = {
  testnet: {
    USDC: {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x3600000000000000000000000000000000000000",
      decimals: 6,
      accent: "bg-blue-500/10 text-blue-600",
    },
    EURC: {
      symbol: "EURC",
      name: "Euro Coin",
      address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
      decimals: 6,
      accent: "bg-indigo-500/10 text-indigo-600",
    },
    cirBTC: {
      symbol: "cirBTC",
      name: "Circle Wrapped BTC",
      address: "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF",
      decimals: 8,
      accent: "bg-amber-500/10 text-amber-600",
    },
  },
  mainnet: {
    USDC: {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x3600000000000000000000000000000000000000",
      decimals: 6,
      accent: "bg-blue-500/10 text-blue-600",
    },
    EURC: {
      symbol: "EURC",
      name: "Euro Coin",
      address: "0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1",
      decimals: 6,
      accent: "bg-indigo-500/10 text-indigo-600",
    },
    cirBTC: {
      symbol: "cirBTC",
      name: "Circle Wrapped BTC",
      address: "0x171A4217b86A807A64eB94757Db6849fb4bDbAA0",
      decimals: 8,
      accent: "bg-amber-500/10 text-amber-600",
    },
  },
};

export const NEST_SWAP_TOKENS = ["USDC", "EURC", "cirBTC"] as const;

export function swapTokenFor(
  environment: ArcEnvironment,
  symbol: NestSwapToken,
): NestSwapTokenConfig {
  return TOKENS[environment][symbol];
}

export function appKitArcChain(environment: ArcEnvironment) {
  return environment === "mainnet" ? ("Arc" as const) : ("Arc_Testnet" as const);
}
