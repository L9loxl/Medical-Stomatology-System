import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AccentColor {
  id: string;
  label: string;
  hsl: string; // e.g. "199 89% 50%"
  hex: string; // for display swatch
  primaryFg: string; // foreground on primary bg
}

export const ACCENT_COLORS: AccentColor[] = [
  { id: "green",   label: "Green",   hsl: "142 71% 42%", hex: "#22c55e", primaryFg: "0 0% 100%" },
  { id: "sky",     label: "Sky",     hsl: "199 89% 48%", hex: "#0ea5e9", primaryFg: "0 0% 100%" },
  { id: "teal",    label: "Teal",    hsl: "172 66% 40%", hex: "#14b8a6", primaryFg: "0 0% 100%" },
  { id: "emerald", label: "Emerald", hsl: "160 84% 39%", hex: "#10b981", primaryFg: "0 0% 100%" },
  { id: "indigo",  label: "Indigo",  hsl: "239 84% 67%", hex: "#6366f1", primaryFg: "0 0% 100%" },
  { id: "violet",  label: "Violet",  hsl: "258 90% 66%", hex: "#8b5cf6", primaryFg: "0 0% 100%" },
  { id: "fuchsia", label: "Fuchsia", hsl: "292 84% 61%", hex: "#d946ef", primaryFg: "0 0% 100%" },
  { id: "rose",    label: "Rose",    hsl: "347 89% 60%", hex: "#f43f5e", primaryFg: "0 0% 100%" },
  { id: "amber",   label: "Amber",   hsl: "38 92% 50%",  hex: "#f59e0b", primaryFg: "30 50% 12%" },
];

const DEFAULT_ACCENT = ACCENT_COLORS.find((a) => a.id === "sky") ?? ACCENT_COLORS[0];

function hueOf(hsl: string): string {
  return hsl.trim().split(/\s+/)[0];
}

/**
 * Applies the chosen accent across the whole UI so the app reads as ~80% themed
 * (sidebar, surfaces, borders, charts), not just the primary button color.
 * Theme-aware: re-derives tints from the active light/dark mode.
 */
function applyAccent(ac: AccentColor) {
  const r = document.documentElement;
  const dark = r.classList.contains("dark");
  const h = hueOf(ac.hsl);

  // Primary / interactive accents
  r.style.setProperty("--primary", ac.hsl);
  r.style.setProperty("--primary-foreground", ac.primaryFg);
  r.style.setProperty("--ring", ac.hsl);
  r.style.setProperty("--sidebar-primary", ac.hsl);
  r.style.setProperty("--sidebar-primary-foreground", ac.primaryFg);
  r.style.setProperty("--sidebar-ring", ac.hsl);
  r.style.setProperty("--chart-1", ac.hsl);

  // Whole-UI hue tint (theme-aware)
  if (dark) {
    r.style.setProperty("--background", `${h} 32% 7%`);
    r.style.setProperty("--card", `${h} 28% 10%`);
    r.style.setProperty("--popover", `${h} 28% 10%`);
    r.style.setProperty("--muted", `${h} 22% 14%`);
    r.style.setProperty("--accent", `${h} 30% 16%`);
    r.style.setProperty("--accent-foreground", `${h} 25% 90%`);
    r.style.setProperty("--secondary", `${h} 24% 15%`);
    r.style.setProperty("--sidebar", `${h} 40% 7%`);
    r.style.setProperty("--sidebar-accent", `${h} 34% 14%`);
    r.style.setProperty("--sidebar-foreground", `${h} 18% 86%`);
    r.style.setProperty("--border", `${h} 24% 18%`);
  } else {
    r.style.setProperty("--background", `${h} 38% 97%`);
    r.style.setProperty("--card", `0 0% 100%`);
    r.style.setProperty("--popover", `0 0% 100%`);
    r.style.setProperty("--muted", `${h} 30% 93%`);
    r.style.setProperty("--accent", `${h} 55% 94%`);
    r.style.setProperty("--accent-foreground", `${h} 45% 22%`);
    r.style.setProperty("--secondary", `${h} 32% 91%`);
    r.style.setProperty("--sidebar", `${h} 42% 11%`);
    r.style.setProperty("--sidebar-accent", `${h} 32% 20%`);
    r.style.setProperty("--sidebar-foreground", `${h} 18% 90%`);
    r.style.setProperty("--border", `${h} 25% 86%`);
  }
}

type AccentContextType = {
  accent: AccentColor;
  setAccent: (ac: AccentColor) => void;
};

const AccentContext = createContext<AccentContextType>({
  accent: DEFAULT_ACCENT,
  setAccent: () => {},
});

export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem("ams-accent");
    return ACCENT_COLORS.find((a) => a.id === saved) ?? DEFAULT_ACCENT;
  });

  useEffect(() => {
    applyAccent(accent);
    // Re-derive tints whenever the light/dark class on <html> changes.
    const obs = new MutationObserver(() => applyAccent(accent));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [accent]);

  const setAccent = (ac: AccentColor) => {
    localStorage.setItem("ams-accent", ac.id);
    setAccentState(ac);
    applyAccent(ac);
  };

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  return useContext(AccentContext);
}
