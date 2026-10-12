/**
 * Public Privy application identifier used by the browser OTP client.
 *
 * Privy app IDs are public client configuration. The Privy app secret must
 * remain server-only in PRIVY_APP_SECRET and must never be committed here.
 */
export const NEST_PRIVY_APP_ID = "cmv5efqvk00ww0fl8ml51vbbm";

export function privyAppId() {
  const override = String(import.meta.env.VITE_PRIVY_APP_ID ?? "").trim();
  return override || NEST_PRIVY_APP_ID;
}
