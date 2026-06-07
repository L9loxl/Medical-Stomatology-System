import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AccentColor {
  id: string;
  label: string;
  hsl: string; // e.g. "199 89% 50%"
  hex: string; // for display swatch
  primaryFg: string; // foreground on primary bg
}

export const ACCENT_COLORS: AccentColor[] = [
  { id: "sky",     label: "Sky",     hsl: "199 89% 48%", hex: "#0ea5e9", primaryFg: "0 0% 100%" },
  { id: "teal",    label: "Teal",    hsl: "172 66% 40%", hex: "#14b8a6", primaryFg: "0 0% 100%" },
  { id: "emerald", label: "Emerald", hsl: "160 84% 39%", hex: "#10b981", primaryFg: "0 0% 100%" },
  { id: "indigo",  label: "Indigo",  hsl: "239 84% 67%", hex: "#6366f1", primaryFg: "0 0% 100%" },
  { id: "violet",  label: "Violet",  hsl: "258 90% 66%", hex: "#8b5cf6", primaryFg: "0 0% 100%" },
  { id: "fuchsia", label: "Fuchsia", hsl: "292 84% 61%", hex: "#d946ef", primaryFg: "0 0% 100%" },
  { id: "rose",    label: "Rose",    hsl: "347 89% 60%", hex: "#f43f5e", primaryFg: "0 0% 100%" },
  { id: "amber",   label: "Amber",   hsl: "38 92% 50%",  hex: "#f59e0b", primaryFg: "30 50% 12%" },
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
