import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AccentColor {
  id: string;
  label: string;
  hsl: string; // e.g. "199 89% 50%"
  hex: string; // for display swatch
  primaryFg: string; // foreground on primary bg
}

export const ACCENT_COLORS: AccentColor[] = [
  { id: "cyan",   label: "Cyan",   hsl: "199 89% 50%", hex: "#03a9f4", primaryFg: "0 0% 100%" },
  { id: "green",  label: "Green",  hsl: "142 71% 45%", hex: "#22c55e", primaryFg: "0 0% 100%" },
  { id: "blue",   label: "Blue",   hsl: "217 91% 60%", hex: "#3b82f6", primaryFg: "0 0% 100%" },
  { id: "purple", label: "Purple", hsl: "280 65% 60%", hex: "#a855f7", primaryFg: "0 0% 100%" },
  { id: "amber",  label: "Amber",  hsl: "38 92% 50%",  hex: "#f59e0b", primaryFg: "0 0% 10%" },
  { id: "rose",   label: "Rose",   hsl: "345 85% 58%", hex: "#f43f5e", primaryFg: "0 0% 100%" },
];

const DEFAULT_ACCENT = ACCENT_COLORS[0];

function applyAccent(ac: AccentColor) {
  const r = document.documentElement;
  r.style.setProperty("--primary", ac.hsl);
  r.style.setProperty("--primary-foreground", ac.primaryFg);
  r.style.setProperty("--ring", ac.hsl);
  r.style.setProperty("--sidebar-primary", ac.hsl);
  r.style.setProperty("--sidebar-primary-foreground", ac.primaryFg);
  r.style.setProperty("--sidebar-ring", ac.hsl);
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
    return ACCENT_COLORS.find(a => a.id === saved) ?? DEFAULT_ACCENT;
  });

  useEffect(() => {
    applyAccent(accent);
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
