import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "nest-theme";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const switchTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(KEY)) as
      "light" | "dark" | null;
    const initial =
      stored ??
      (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  useEffect(
    () => () => {
      if (switchTimer.current !== undefined) window.clearTimeout(switchTimer.current);
    },
    [],
  );

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      const root = document.documentElement;

      // Enable colour-only transitions for the duration of the swap so the
      // change reads as one continuous fade instead of an instant flip.
      root.classList.add("theme-switching");
      if (switchTimer.current !== undefined) window.clearTimeout(switchTimer.current);
      switchTimer.current = window.setTimeout(() => root.classList.remove("theme-switching"), 500);

      root.classList.toggle("dark", next === "dark");
      root.style.colorScheme = next;
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  return { theme, toggle };
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`relative grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground ring-1 ring-border transition-transform hover:scale-105 ${className}`}
    >
      <Sun
        className={`absolute h-4 w-4 transition-all duration-300 ${
          isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
        }`}
      />
      <Moon
        className={`absolute h-4 w-4 transition-all duration-300 ${
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"
        }`}
      />
    </button>
  );
}
