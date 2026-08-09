import {
  motion,
  useSpring,
  useTransform,
  type HTMLMotionProps,
  type Transition,
} from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

const ease: Transition["ease"] = [0.22, 1, 0.36, 1];

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.24, ease }}
    >
      {children}
    </motion.div>
  );
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
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.045, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
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
} & HTMLMotionProps<"div">) {
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      variants={{
        hidden: { opacity: 0, y: 10, scale: 0.99 },
        show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease } },
      }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export function Tap({
  children,
  className,
  ...rest
}: HTMLMotionProps<"div"> & { children: ReactNode }) {
  return (
    <motion.div
      whileTap={{ scale: 0.975 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 520, damping: 28, mass: 0.6 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Reveals content on first paint with a soft rise. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Smoothly animated numeric counter. Purely visual — value is passed through. */
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
  const spring = useSpring(0, { stiffness: 140, damping: 22, mass: 0.8 });
  const text = useTransform(spring, (v) =>
    `${prefix}${v.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`,
  );
  const [display, setDisplay] = useState(
    `${prefix}${(0).toFixed(decimals)}${suffix}`,
  );

  useEffect(() => {
    spring.set(Number.isFinite(value) ? value : 0);
  }, [value, spring]);

  useEffect(() => text.on("change", setDisplay), [text]);

  return (
    <span className={className} suppressHydrationWarning>
      {display}
    </span>
  );
}
