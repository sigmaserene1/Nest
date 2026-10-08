import type { ActivityEvent, Expense, Member } from "@/lib/nest-data";
import type { RoomInfo } from "@/lib/chain/nest-chain";
import type { ArcEnvironment } from "@/lib/arc-network";

export type NestChainSnapshot = {
  version: 1;
  wallet: string;
  environment: ArcEnvironment;
  roomId: number | null;
  rooms: RoomInfo[];
  members: Member[];
  expenses: Expense[];
  activity: ActivityEvent[];
  savedAt: number;
};

const keyFor = (wallet: string, environment: ArcEnvironment) =>
  `nest.chain.snapshot.${environment}.${wallet.toLowerCase()}`;

export function readChainSnapshot(
  wallet: string | null | undefined,
  environment: ArcEnvironment,
): NestChainSnapshot | null {
  if (typeof window === "undefined" || !wallet) return null;
  try {
    const raw = localStorage.getItem(keyFor(wallet, environment));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NestChainSnapshot;
    return parsed?.version === 1 &&
      parsed.wallet?.toLowerCase() === wallet.toLowerCase() &&
      parsed.environment === environment
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function writeChainSnapshot(snapshot: NestChainSnapshot) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      keyFor(snapshot.wallet, snapshot.environment),
      JSON.stringify(snapshot),
    );
  } catch {
    // Chain remains authoritative; cache failure must never block the app.
  }
}
