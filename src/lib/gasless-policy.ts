import type { ArcEnvironment } from "./arc-network";
export type SponsorshipPolicy = { enabled: boolean; recipients: string[]; maxValue: bigint; maxGas: bigint };
export function sponsorshipPolicy(environment: ArcEnvironment, settings: Record<string, string | undefined>): SponsorshipPolicy {
  const prefix = environment === "mainnet" ? "GASLESS_MAINNET" : "GASLESS_TESTNET";
  const recipients = (settings[`${prefix}_RECIPIENTS`] ?? "").split(",").map((value) => value.trim().toLowerCase()).filter((value) => /^0x[\da-f]{40}$/.test(value));
  const positive = (value: string | undefined) => value && /^\d+$/.test(value) ? BigInt(value) : 0n;
  const maxValue = positive(settings[`${prefix}_MAX_VALUE_UNITS`]);
  const maxGas = positive(settings[`${prefix}_MAX_GAS_UNITS`]);
  return { enabled: settings[`${prefix}_ENABLED`] === "true" && recipients.length > 0 && maxValue > 0n && maxGas > 0n, recipients, maxValue, maxGas };
}
export function assertSponsorshipAuthorization(policy: SponsorshipPolicy, data: { to: string; value: string; validAfter: string; validBefore: string }, now: bigint) {
  if (!policy.enabled) throw new Error("Gas sponsorship is not enabled by a matching policy.");
  if (!policy.recipients.includes(data.to.toLowerCase())) throw new Error("This recipient is not covered by the gas sponsorship policy.");
  if (BigInt(data.value) <= 0n || BigInt(data.value) > policy.maxValue) throw new Error("The transfer exceeds the sponsorship amount policy.");
  if (BigInt(data.validAfter) > now || BigInt(data.validBefore) <= now || BigInt(data.validBefore) > now + 1800n) throw new Error("The authorization is expired or outside the sponsorship time window.");
}