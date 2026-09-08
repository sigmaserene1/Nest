export type ChainBrand = {
  gradient: string;
  initials: string;
};

/**
 * Purely cosmetic per-chain accent used for the bridge UI's chain badges.
 * No logo assets required — colors approximate each chain's brand color.
 */
export const CHAIN_BRAND: Record<string, ChainBrand> = {
  arc: { gradient: "from-brand to-brand/60", initials: "ARC" },
  ethereum: { gradient: "from-[#627EEA] to-[#8AA0F0]", initials: "ETH" },
  avalanche: { gradient: "from-[#E84142] to-[#F4787A]", initials: "AVAX" },
  optimism: { gradient: "from-[#FF0420] to-[#FF6B6B]", initials: "OP" },
  arbitrum: { gradient: "from-[#28A0F0] to-[#69C4FF]", initials: "ARB" },
  base: { gradient: "from-[#0052FF] to-[#6A97FF]", initials: "BASE" },
  polygon: { gradient: "from-[#8247E5] to-[#B08AF0]", initials: "POL" },
};

export function chainBrand(id: string): ChainBrand {
  return CHAIN_BRAND[id] ?? { gradient: "from-muted-foreground/40 to-muted-foreground/20", initials: id.slice(0, 3).toUpperCase() };
}
