// Lightweight CSS-only motion primitives. The exported API is unchanged.

import type { HTMLAttributes, ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-150 ease-out motion-reduce:animate-none">
      {children}
    </div>
  );
}

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={`animate-in fade-in duration-150 motion-reduce:animate-none ${className ?? ""}`}>
      {children}
    </div>
  );
}

export function Item({
  children,
  className,
  as = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "section";
} & HTMLAttributes<HTMLElement>) {
  const Tag = as as "div";
  return (
    <Tag
      className={`animate-in fade-in slide-in-from-bottom-1 duration-150 motion-reduce:animate-none ${className ?? ""}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function Tap({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`transition-transform duration-150 active:scale-[0.99] motion-reduce:transition-none ${className ?? ""}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/** Plain formatted number (no counting animation). */
export function AnimatedNumber({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const n = Number.isFinite(value) ? value : 0;
  return (
    <span className={className} suppressHydrationWarning>
      {prefix}
      {n.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
