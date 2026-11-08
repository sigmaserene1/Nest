import { useEffect, useRef, type PointerEvent } from "react";

export function LandingHeadline() {
  const heading = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => { clearTimeout(timer.current); }, []);

  function move(event: PointerEvent<HTMLHeadingElement>) {
    const element = heading.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    element.style.setProperty("--headline-x", `${((event.clientX - bounds.left) / bounds.width - .5) * 10}px`);
    element.style.setProperty("--headline-y", `${((event.clientY - bounds.top) / bounds.height - .5) * 6}px`);
  }

  function pulse() {
    const element = heading.current;
    if (!element) return;
    clearTimeout(timer.current);
    element.dataset.energized = "true";
    timer.current = setTimeout(() => { delete element.dataset.energized; }, 1100);
  }

  return (
    <h1 ref={heading} aria-label="Shared treasury. Clear every balance."
      className="landing-headline mt-5 text-foreground"
      onPointerMove={move} onPointerDown={pulse}
      onPointerLeave={() => {
        heading.current?.style.setProperty("--headline-x", "0px");
        heading.current?.style.setProperty("--headline-y", "0px");
      }}>
      <span aria-hidden="true" className="headline-primary">Shared <em>treasury.</em></span>
      <span aria-hidden="true" className="headline-signature">
        {"Clear every balance.".split(" ").map((word, index) => (
          <span className={`headline-word headline-word-${index}`} key={word}>{word}{index < 2 ? "\u00a0" : ""}</span>
        ))}
      </span>
    </h1>
  );
}