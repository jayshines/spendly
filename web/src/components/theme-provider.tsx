"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";

type Ctx = {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<Ctx | null>(null);
const KEY = "spendly-theme";

const systemDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  const apply = useCallback((t: Theme) => {
    const dark = t === "dark" || (t === "system" && systemDark());
    document.documentElement.classList.toggle("dark", dark);
    setResolved(dark ? "dark" : "light");
  }, []);

  // Read the saved choice once on mount (the inline script in layout already
  // applied the class, so there is no flash).
  useEffect(() => {
    let saved: Theme = "light";
    try {
      const v = localStorage.getItem(KEY);
      if (v === "light" || v === "dark" || v === "system") saved = v;
    } catch {}
    setThemeState(saved);
    apply(saved);
  }, [apply]);

  // Follow the OS when set to "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, apply]);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      apply(t);
      try {
        localStorage.setItem(KEY, t);
      } catch {}
    },
    [apply]
  );

  const toggle = useCallback(
    () => setTheme(resolved === "dark" ? "light" : "dark"),
    [resolved, setTheme]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

// Runs before first paint so the page never flashes the wrong theme.
export const themeScript = `(function(){try{var t=localStorage.getItem('${KEY}')||'light';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
