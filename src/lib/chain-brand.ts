import arcLogo from "@/assets/arc-logo.png.asset.json";
import arbitrumLogo from "@/assets/chains/arbitrum.webp.asset.json";
import avalancheLogo from "@/assets/chains/avalanche.webp.asset.json";
import baseLogo from "@/assets/chains/base.webp.asset.json";
import ethereumLogo from "@/assets/chains/ethereum.webp.asset.json";
import optimismLogo from "@/assets/chains/optimism.webp.asset.json";
import polygonLogo from "@/assets/chains/polygon.webp.asset.json";

export type ChainBrand = {
  logo?: string;
  initials: string;
  accent: string;
};

export const CHAIN_BRAND: Record<string, ChainBrand> = {
  arc: { logo: arcLogo.url, initials: "ARC", accent: "bg-foreground" },
  ethereum: { logo: ethereumLogo.url, initials: "ETH", accent: "bg-info" },
  avalanche: { logo: avalancheLogo.url, initials: "AVAX", accent: "bg-destructive" },
  optimism: { logo: optimismLogo.url, initials: "OP", accent: "bg-destructive" },
  arbitrum: { logo: arbitrumLogo.url, initials: "ARB", accent: "bg-info" },
  base: { logo: baseLogo.url, initials: "BASE", accent: "bg-info" },
  polygon: { logo: polygonLogo.url, initials: "POL", accent: "bg-primary" },
};

export function chainBrand(id: string): ChainBrand {
  return CHAIN_BRAND[id] ?? {
    initials: id.slice(0, 4).toUpperCase(),
    accent: "bg-muted-foreground",
  };
}