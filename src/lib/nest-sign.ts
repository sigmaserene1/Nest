// Browser helper: ask the connected wallet to sign a Nest action, then send it
// to the server, which verifies the signature before touching the database.

import { signMessage } from "wagmi/actions";
import { wagmiConfig } from "./wagmi";
import { buildNestMessage, type NestAction } from "./nest-message";
import { nestWrite } from "./nest-writes.functions";

export async function signedNestWrite(
  action: NestAction,
  wallet: string,
  payload: Record<string, unknown>,
): Promise<{ ok: true; data?: Record<string, string | number | null> } | { ok: false; error: string }> {
  const ts = Date.now();
  let signature: string;
  try {
    signature = await signMessage(wagmiConfig, {
      account: wallet as `0x${string}`,
      message: buildNestMessage({ action, wallet, ts, payload }),
    });
  } catch {
    return { ok: false, error: "Signature request rejected." };
  }

  try {
    return (await nestWrite({
      data: { action, wallet, ts, signature, payload },
    })) as { ok: true; data?: Record<string, string | number | null> } | { ok: false; error: string };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again." };
  }
}
