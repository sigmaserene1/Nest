import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  action: z.enum([
    "claim_profile",
    "add_roommate",
    "delete_roommate",
    "create_request",
    "update_request",
  ]),
  wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  ts: z.number().int(),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
  payload: z.record(z.string(), z.unknown()),
});

export const nestWrite = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { handleNestWrite } = await import("./nest-writes.server");
    return handleNestWrite(data);
  });
