import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Renders fixed overlays on document.body so ancestor transforms/stacking contexts can't trap them. */
export function ViewportPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
