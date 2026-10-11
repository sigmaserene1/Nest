// Lightweight CSS-only motion primitives used across the Nest app.
// Motion stays compositor-friendly (opacity + transform) and respects
// prefers-reduced-motion in the global stylesheet.

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type MotionStyle = CSSProperties & {
  "--nest-motion-delay"?: string;
  "--nest-stagger-delay"?: string;
};

function delayStyle(delay?: number, variable: "--nest-motion-delay" | "--nest-stagger-delay" = "--nest-motion-delay"): MotionStyle | undefined {
  if (!delay) return undefined;
  return { [variable]: `${Math.max(0, delay)}ms` } as MotionStyle;
}

export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="nest-page-transition">{children}</div>;
}

export function Stagger({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`nest-stagger ${className ?? ""}`}
      style={delayStyle(delay, "--nest-stagger-delay")}
    >
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
    <Tag className={`nest-motion-item ${className ?? ""}`} {...rest}>
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
    <div className={`nest-tap ${className ?? ""}`} {...rest}>
      {children}
    </div>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`nest-reveal ${className ?? ""}`}
      style={delayStyle(delay)}
    >
      {children}
    </div>
  );
}

/** Plain formatted number. Motion is handled by the surrounding card/layout. */
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
