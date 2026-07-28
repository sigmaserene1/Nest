// Canonical message a wallet signs to authorise a Nest write.
// Shared by the browser (signing) and the server (verification).

export type NestAction =
  | "claim_profile"
  | "add_roommate"
  | "delete_roommate"
  | "create_request"
  | "update_request";

export function buildNestMessage(input: {
  action: NestAction;
  wallet: string;
  ts: number;
  payload: unknown;
}) {
  return [
    "Nest · Arc",
    `action: ${input.action}`,
    `wallet: ${input.wallet.toLowerCase()}`,
    `ts: ${input.ts}`,
    `payload: ${JSON.stringify(input.payload)}`,
  ].join("\n");
}
