import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ViewportBounds = {
  height: number;
  offsetTop: number;
};

/**
 * Renders fixed overlays on document.body so ancestor transforms/stacking
 * contexts cannot trap them. It also publishes the live visual viewport
 * bounds for mobile sheets while the on-screen keyboard is open.
 */
export function ViewportPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [viewport, setViewport] = useState<ViewportBounds | null>(null);

  useEffect(() => {
    setMounted(true);

    const visualViewport = window.visualViewport;
    const updateViewport = () => {
      setViewport({
        height: Math.round(visualViewport?.height ?? window.innerHeight),
        offsetTop: Math.round(visualViewport?.offsetTop ?? 0),
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    visualViewport?.addEventListener("resize", updateViewport);
    visualViewport?.addEventListener("scroll", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
      visualViewport?.removeEventListener("resize", updateViewport);
      visualViewport?.removeEventListener("scroll", updateViewport);
    };
  }, []);

  if (!mounted) return null;

  const style = {
    display: "contents",
    "--nest-viewport-height": viewport ? `${viewport.height}px` : "100dvh",
    "--nest-viewport-offset-top": viewport ? `${viewport.offsetTop}px` : "0px",
  } as CSSProperties;

  return createPortal(<div style={style}>{children}</div>, document.body);
}
