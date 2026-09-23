import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { generateDocsConcept, type DocsConcept } from "@/lib/docs-concept.functions";
import { NestLogo } from "@/components/nest/logo";

export const Route = createFileRoute("/docs-lab")({
  component: DocsLab,
  head: () => ({
    meta: [
      { title: "Docs Lab — Turn an idea into an Arc docs concept | Nest" },
      {
        name: "description",
        content:
          "Describe a documentation idea and get a structured Arc docs concept: audience, Arc primitives, section outline and open questions.",
      },
      {
        property: "og:title",
        content: "Docs Lab — Structured Arc documentation concepts",
      },
      {
        property: "og:description",
        content:
          "Turn a rough documentation idea into an Arc-native outline with audience, primitives and sections.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const EXAMPLES = [
  "Explain how to sponsor gas for USDC payments on Arc",
  "A guide to moving USDC from Base to Arc with CCTP v2",
  "Onboarding doc for a treasury app settling shared expenses onchain",
];

function DocsLab() {
  const [idea, setIdea] = useState("");
  const run = useServerFn(generateDocsConcept);

  const mutation = useMutation({
    mutationFn: (value: string) => run({ data: { idea: value } }) as Promise<DocsConcept>,
  });

  const concept = mutation.data;
  const canSubmit = idea.trim().length >= 8 && !mutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 lg:px-8">
          <NestLogo />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Docs Lab
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Describe a documentation idea in your own words. You'll get back a structured Arc docs
          concept: who it's for, which Arc building blocks it touches, and a section-by-section
          outline.
        </p>

        <form
          className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) mutation.mutate(idea.trim());
          }}
        >
          <label htmlFor="idea" className="text-xs font-semibold text-foreground">
            Your idea
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="e.g. A guide showing how an app can pay gas for its users on Arc"
            className="mt-2 w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setIdea(example)}
                className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                {example}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Shaping the concept…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate concept
              </>
            )}
          </button>

          {mutation.isError ? (
            <p className="mt-3 text-xs font-medium text-destructive">
              {(mutation.error as Error).message || "Something went wrong. Please try again."}
            </p>
          ) : null}
        </form>

        {concept ? <ConceptView concept={concept} /> : null}
      </main>
    </div>
  );
}

function ConceptView({ concept }: { concept: DocsConcept }) {
  return (
    <section className="mt-8 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold text-foreground">{concept.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{concept.summary}</p>
        <p className="mt-3 text-xs font-semibold text-foreground">
          Written for: <span className="font-medium text-muted-foreground">{concept.audience}</span>
        </p>
        {concept.primitives.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {concept.primitives.map((item) => (
              <span
                key={item}
                className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {concept.sections.map((section, index) => (
          <article
            key={`${section.heading}-${index}`}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <h3 className="text-sm font-bold text-foreground">
              {index + 1}. {section.heading}
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{section.purpose}</p>
            <ul className="mt-3 space-y-1.5">
              {section.keyPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-xs leading-5 text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-xs font-bold text-foreground">Example to include</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{concept.codeExampleIdea}</p>
        </div>
        {concept.openQuestions.length ? (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-xs font-bold text-foreground">Open questions</h3>
            <ul className="mt-2 space-y-1.5">
              {concept.openQuestions.map((question, i) => (
                <li key={i} className="text-xs leading-5 text-muted-foreground">
                  • {question}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
