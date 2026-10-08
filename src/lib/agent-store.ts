// Local preferences and run history for Nest's settlement assistant.
//
// The assistant prepares a wallet-confirmed batch while this browser is open.
// It is not an autonomous signer, scheduler, or onchain policy engine.

import { useEffect, useRef } from "react";
import { useLocalStore } from "./local-store";
import { pullAccountCache, pushAccountCache } from "@/lib/account-cache";

export type AgentConfig = {
  enabled: boolean;
  /** Legacy local reminder preference, kept so existing browser data remains readable. */
  dayOfMonth: number;
  /** Local review cap, in USDC, checked before a transaction is requested. */
  maxPerRun: number;
  /** Skip debts smaller than this to avoid dust transactions. */
  minDebt: number;
  /** Legacy local preference, retained for backwards compatibility. */
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
  const [config, setConfig] = useLocalStore<AgentConfig>(
    cfgKey(wallet ?? "anon"),
    DEFAULT_AGENT,
  );
  const hydrated = useRef(false);

  useEffect(() => {
    hydrated.current = false;
    if (!wallet) return;

    let cancelled = false;
    void pullAccountCache("global").then((cache) => {
      if (cancelled) return;
      const remote = cache?.agentConfig as AgentConfig | null | undefined;
      if (remote && typeof remote === "object") {
        setConfig({ ...DEFAULT_AGENT, ...remote });
      } else {
        void pushAccountCache("global", { agentConfig: config });
      }
      hydrated.current = true;
    });

    return () => {
      cancelled = true;
    };
    // Intentionally hydrate once per wallet; local changes sync below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  useEffect(() => {
    if (!wallet || !hydrated.current) return;
    void pushAccountCache("global", { agentConfig: config });
  }, [config, wallet]);

  return [config, setConfig] as const;
}

export function useAgentRuns(wallet: string | null) {
  const [runs, setRuns] = useLocalStore<AgentRun[]>(
    logKey(wallet ?? "anon"),
    EMPTY_RUNS,
  );
  const hydrated = useRef(false);

  useEffect(() => {
    hydrated.current = false;
    if (!wallet) return;

    let cancelled = false;
    void pullAccountCache("global").then((cache) => {
      if (cancelled) return;
      const remote = cache?.agentRuns as AgentRun[] | undefined;
      if (Array.isArray(remote) && remote.length > 0) {
        setRuns(remote);
      } else if (runs.length > 0) {
        void pushAccountCache("global", { agentRuns: runs });
      }
      hydrated.current = true;
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  useEffect(() => {
    if (!wallet || !hydrated.current) return;
    void pushAccountCache("global", { agentRuns: runs });
  }, [runs, wallet]);

  return [runs, setRuns] as const;
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
