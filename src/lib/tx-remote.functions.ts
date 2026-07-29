import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const hash = z.string().regex(/^0x[0-9a-fA-F]{64}$/);
const wallet = z.string().regex(/^0x[0-9a-fA-F]{40}$/);

const recordSchema = z.object({
  txHash: hash,
  fromWallet: wallet,
  toWallet: wallet,
  toName: z.string().max(80).nullish(),
  amount: z.number().positive().max(1_000_000),
  mode: z.string().max(20),
  note: z.string().max(200).nullish(),
});

const finalizeSchema = z.object({ txHash: hash });

export const recordTx = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => recordSchema.parse(data))
  .handler(async ({ data }) => {
    const { recordTransaction } = await import("./tx-remote.server");
    return recordTransaction(data);
  });

export const finalizeTx = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => finalizeSchema.parse(data))
  .handler(async ({ data }) => {
    const { finalizeTransaction } = await import("./tx-remote.server");
    return finalizeTransaction(data);
  });
