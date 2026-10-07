import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { NestLogo } from "@/components/nest/logo";
import { ThemeToggle } from "@/components/nest/theme-toggle";

const GITHUB_URL = "https://github.com/sigmaserene1/Nest";

export function PublicShell({
  children,
  eyebrow,
  title,
  description,
}: {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <Link to="/" aria-label="Nest home" className="rounded-xl">
            <NestLogo />
          </Link>
          <nav className="hidden items-center gap-6 text-xs font-semibold text-muted-foreground sm:flex">
            <Link to="/docs" className="transition-colors hover:text-foreground">
              Docs
            </Link>
            <Link to="/support" className="transition-colors hover:text-foreground">
              Support
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {(title || description) && (
        <section className="border-b border-border bg-muted/25">
          <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
            {eyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
            ) : null}
            {title ? (
              <h1 className="mt-3 max-w-4xl font-display text-3xl tracking-[-0.04em] sm:text-5xl">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </section>
      )}

      {children}

      <footer className="mt-20 border-t border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-[1fr_auto] sm:items-end lg:px-8">
          <div>
            <NestLogo />
            <p className="mt-3 max-w-xl text-xs leading-5 text-muted-foreground">
              Nest is an independent onchain group-finance application built on Arc. The current
              public deployment includes testnet functionality; testnet assets have no real-world value.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="rounded-full border border-border bg-card px-2.5 py-1">Built on Arc</span>
              <span className="rounded-full border border-border bg-card px-2.5 py-1">Native USDC</span>
              <span className="rounded-full border border-border bg-card px-2.5 py-1">Circle Wallets</span>
            </div>
          </div>
          <div className="flex max-w-lg flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-muted-foreground sm:justify-end">
            <Link to="/docs" className="hover:text-foreground">Docs</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/support" className="hover:text-foreground">Support</Link>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
