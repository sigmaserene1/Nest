// Nest runs in two shapes: a shared household, or a project syndicate for
// freelancers and small squads. Only vocabulary and a few extra panels change —
// the onchain expense/settlement model is identical.

import { useLocalStore } from "./local-store";

export type WorkspaceMode = "household" | "syndicate";

export type ModeCopy = {
  mode: WorkspaceMode;
  label: string;
  space: string;
  people: string;
  person: string;
  expenses: string;
  tagline: string;
};

export const MODE_COPY: Record<WorkspaceMode, ModeCopy> = {
  household: {
    mode: "household",
    label: "Household",
    space: "Home",
    people: "Roommates",
    person: "Roommate",
    expenses: "Shared bills",
    tagline: "Rent, groceries and utilities, split and settled in USDC.",
  },
  syndicate: {
    mode: "syndicate",
    label: "Project Syndicate",
    space: "Syndicate",
    people: "Collaborators",
    person: "Collaborator",
    expenses: "Project costs",
    tagline: "Track shared tooling costs, then split client revenue in USDC.",
  },
};

const KEY = (roomId: number | null) => `nest.mode.room.${roomId ?? 0}`;

export function useWorkspaceMode(roomId: number | null) {
  const [mode, setMode] = useLocalStore<WorkspaceMode>(KEY(roomId), "household");
  return { mode, setMode, copy: MODE_COPY[mode] ?? MODE_COPY.household };
}

export type PayoutRow = { id: string; name: string; weight: number; payout: number };

/**
 * Client revenue payout: shared costs are reimbursed first, the remainder is
 * distributed by weight (equal weights = equal split).
 */
export function computePayouts(
  revenue: number,
  costs: number,
  people: { id: string; name: string; weight: number }[],
): { distributable: number; rows: PayoutRow[] } {
  const distributable = Math.max(revenue - costs, 0);
  const totalWeight = people.reduce((s, p) => s + Math.max(p.weight, 0), 0);
  const rows = people.map((p) => ({
    id: p.id,
    name: p.name,
    weight: p.weight,
    payout: totalWeight > 0 ? (distributable * Math.max(p.weight, 0)) / totalWeight : 0,
  }));
  return { distributable, rows };
}
