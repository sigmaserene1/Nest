import arcLogo from "@/assets/arc-logo.png.asset.json";

export type ChainBrand = {
  gradient: string;
  initials: string;
  /** Real chain logo used by the bridge UI, like other DEX/bridge apps. */
  logo?: string;
  /** Background behind the logo mark (keeps dark marks readable). */
  ring?: string;
};

const llama = (slug: string) => `https://icons.llamao.fi/icons/chains/rsz_${slug}?w=64&h=64`;

export const CHAIN_BRAND: Record<string, ChainBrand> = {
  arc: { gradient: "from-brand to-brand/60", initials: "ARC", logo: arcLogo.url, ring: "bg-white" },
  ethereum: { gradient: "from-[#627EEA] to-[#8AA0F0]", initials: "ETH", logo: llama("ethereum"), ring: "bg-white" },
  avalanche: { gradient: "from-[#E84142] to-[#F4787A]", initials: "AVAX", logo: llama("avalanche"), ring: "bg-white" },
  optimism: { gradient: "from-[#FF0420] to-[#FF6B6B]", initials: "OP", logo: llama("optimism"), ring: "bg-white" },
  arbitrum: { gradient: "from-[#28A0F0] to-[#69C4FF]", initials: "ARB", logo: llama("arbitrum"), ring: "bg-white" },
  base: { gradient: "from-[#0052FF] to-[#6A97FF]", initials: "BASE", logo: llama("base"), ring: "bg-white" },
  polygon: { gradient: "from-[#8247E5] to-[#B08AF0]", initials: "POL", logo: llama("polygon"), ring: "bg-white" },
};

export function chainBrand(id: string): ChainBrand {
  return (
    CHAIN_BRAND[id] ?? {
      gradient: "from-muted-foreground/40 to-muted-foreground/20",
      initials: id.slice(0, 3).toUpperCase(),
    }
  );
}
