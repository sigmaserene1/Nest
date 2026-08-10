// Animations were removed in favour of a plain, static UI.
// These components keep the previous API but render plain markup.

import type { HTMLAttributes, ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
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
    <Tag className={className} {...rest}>
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
    <div className={className} {...rest}>
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
  return <div className={className}>{children}</div>;
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
