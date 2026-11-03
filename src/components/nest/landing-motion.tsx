import { useEffect, useRef } from "react";

/** Live light ribbons: browser-only, bounded resolution and paused offscreen. */
export function LandingMotion() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lightMode = !document.documentElement.classList.contains("dark");
    let palette: string[] = [];
    const updatePalette = () => {
      lightMode = !document.documentElement.classList.contains("dark");
      const colors = getComputedStyle(canvas);
      palette = ["--light-mint", "--light-pink", "--light-gold", "--brand"].map(
        (token) => colors.getPropertyValue(token).trim(),
      );
    };
    updatePalette();
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;
    let elapsed = 0;
    let visible = true;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const time = elapsed / 1000;
      ctx.globalCompositeOperation = lightMode ? "source-over" : "lighter";
      for (let ribbon = 0; ribbon < 8; ribbon++) {
        const phase = ribbon * 0.79;
        const path = new Path2D();
        for (let step = 0; step <= 90; step++) {
          const x = (step / 90) * (width + 120) - 60;
          const progress = x / width;
          const y = height * (0.73 + Math.sin(progress * 4.2 + time * 0.85 + phase) * 0.13)
            + Math.cos(progress * 7 - time * 0.6 + phase) * height * 0.05
            + (ribbon - 3.5) * 10;
          if (step === 0) path.moveTo(x, y);
          else path.lineTo(x, y);
        }
        ctx.strokeStyle = palette[ribbon % palette.length];
        for (const [lineWidth, opacity] of [[28, 0.025], [12, 0.07], [3, 0.4], [1, 0.8]]) {
          ctx.lineWidth = lineWidth;
          ctx.globalAlpha = opacity;
          ctx.stroke(path);
        }
        // Traveling highlights make the flow apparent even at a glance.
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.9;
        ctx.setLineDash([24, 140, 5, 210]);
        ctx.lineDashOffset = -time * (65 + ribbon * 8);
        ctx.stroke(path);
        ctx.setLineDash([]);
      }
      ctx.globalAlpha = 1;
    };
    const tick = (now: number) => {
      if (now - last >= 32) {
        elapsed += Math.min(now - last, 64);
        last = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = performance.now();
      draw();
      if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(() => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      sync();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      sync();
    });
    resize.observe(canvas);
    intersection.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      updatePalette();
      draw();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return <canvas ref={ref} className="landing-motion" aria-hidden="true" />;
}