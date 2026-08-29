// Configuration + run log for the Nest auto-settle agent.
//
// The agent is a client-side co-signer: it watches your net debts in the active
// home and, once the schedule is due, walks every open debt and submits the
// real onchain settlement for you. Spend limits are enforced before signing so
// the agent can never move more USDC than you authorised.

import { useLocalStore } from "./local-store";

export type AgentConfig = {
  enabled: boolean;
  /** Day of month (1-28) the agent nets and settles balances. */
  dayOfMonth: number;
  /** Hard cap, in USDC, the agent may move in a single run. */
  maxPerRun: number;
  /** Skip debts smaller than this to avoid dust transactions. */
  minDebt: number;
  /** Require a manual tap before each signature (agent still batches the work). */
  requireApproval: boolean;
  /** ISO timestamp of the last completed run. */
  lastRunAt: string | null;
};

export type AgentRun = {
  id: string;
  date: string;
  trigger: "scheduled" | "manual";
  settled: number;
  total: number;
  hashes: string[];
  status: "success" | "partial" | "failed";
  message?: string;
};

export const DEFAULT_AGENT: AgentConfig = {
  enabled: false,
  dayOfMonth: 1,
  maxPerRun: 250,
  minDebt: 1,
  requireApproval: true,
  lastRunAt: null,
};

const EMPTY_RUNS: AgentRun[] = [];

const cfgKey = (wallet: string) => `nest.agent.cfg.${wallet.toLowerCase()}`;
const logKey = (wallet: string) => `nest.agent.log.${wallet.toLowerCase()}`;

export function useAgentConfig(wallet: string | null) {
  return useLocalStore<AgentConfig>(cfgKey(wallet ?? "anon"), DEFAULT_AGENT);
}

export function useAgentRuns(wallet: string | null) {
  return useLocalStore<AgentRun[]>(logKey(wallet ?? "anon"), EMPTY_RUNS);
}

/** Next scheduled run for a given day-of-month, relative to now. */
export function nextRunDate(dayOfMonth: number, from = new Date()): Date {
  const day = Math.min(Math.max(Math.round(dayOfMonth), 1), 28);
  const next = new Date(from.getFullYear(), from.getMonth(), day, 9, 0, 0, 0);
  if (next.getTime() <= from.getTime()) next.setMonth(next.getMonth() + 1);
  return next;
}

export function fmtCountdown(target: Date, from = new Date()): string {
  const ms = target.getTime() - from.getTime();
  if (ms <= 0) return "due now";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `in ${days}d ${hours}h`;
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return `in ${hours}h ${mins}m`;
}
