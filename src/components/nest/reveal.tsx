import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll-reveal wrapper.
 * A single shared IntersectionObserver handles every element on the page so
 * long landing pages don't allocate one observer per card. `will-change` is
 * dropped as soon as the entrance transition ends to free compositor layers.
 */

type Registered = { el: HTMLElement };

let observer: IntersectionObserver | null = null;

function reveal(el: HTMLElement) {
  el.classList.add("is-visible");
  const clear = () => {
    el.style.willChange = "auto";
    el.removeEventListener("transitionend", clear);
  };
  el.addEventListener("transitionend", clear);
}

function getObserver() {
  if (observer || typeof window === "undefined") return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer?.unobserve(el);
        reveal(el);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
  );
  return observer;
}

export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "span";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current as Registered["el"] | null;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Anything already in view on first paint reveals immediately — no observer
    // round-trip, no flash of hidden content above the fold.
    if (reduced || el.getBoundingClientRect().top < window.innerHeight) {
      reveal(el);
      return;
    }
    const io = getObserver();
    io?.observe(el);
    return () => io?.unobserve(el);
  }, []);

  return (
    // @ts-expect-error dynamic tag ref typing
    <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
