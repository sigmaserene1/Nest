import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./ai-gateway.server";

const Input = z.object({
  idea: z.string().min(8).max(2000),
});

const ConceptSchema = z.object({
  title: z.string(),
  summary: z.string(),
  audience: z.string(),
  primitives: z.array(z.string()),
  sections: z.array(
    z.object({
      heading: z.string(),
      purpose: z.string(),
      keyPoints: z.array(z.string()),
    }),
  ),
  codeExampleIdea: z.string(),
  openQuestions: z.array(z.string()),
});

export type DocsConcept = z.infer<typeof ConceptSchema>;

const SYSTEM = `You are a technical documentation architect for Arc (docs.arc.io), a Circle-built
EVM chain where native USDC is the gas and settlement asset. Turn a rough idea into a structured
Arc documentation concept. Be concrete and Arc-native: reference things like native USDC gas,
EIP-3009 gasless transfers, relayers and paymasters, CCTP v2 cross-chain transfers, and onchain
settlement where relevant. Keep every field short and practical. Produce 3 to 5 sections,
2 to 4 key points per section, and at most 3 open questions.`;

export const generateDocsConcept = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured.");

    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const lovable = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    try {
      const result = streamText({
        model: lovable.responses("openai/gpt-6-astra"),
        system: SYSTEM,
        prompt: `Documentation idea: ${data.idea}`,
        output: Output.object({ schema: ConceptSchema }),
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });

      return (await result.output) as DocsConcept;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("The model couldn't structure that idea. Try describing it with more detail.");
      }
      throw error;
    }
  });
