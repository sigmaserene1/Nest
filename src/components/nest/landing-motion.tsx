import { useEffect, useRef } from "react";

/** Broad moving color washes: bounded resolution and paused offscreen. */
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
      if (!width || !height) return;
      for (let wash = 0; wash < 4; wash++) {
        const phase = wash * 1.57;
        const center = width * (.5 + Math.sin(time * .35 + phase) * .45);
        const tilt = Math.cos(time * .25 + phase) * width * .3;
        const gradient = ctx.createLinearGradient(center - width * .55, 0, center + width * .55 + tilt, height);
        gradient.addColorStop(0, "transparent");
        gradient.addColorStop(.5, palette[wash]);
        gradient.addColorStop(1, "transparent");
        ctx.globalAlpha = (lightMode ? .13 : .19) + Math.sin(time * .5 + phase) * .035;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
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