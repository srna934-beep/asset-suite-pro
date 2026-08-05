import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";
const KEY = "app-theme";

function apply(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
}

/** مبدّل الوضع الليلي/الفاتح — الافتراضي فاتح، ويُحفظ لكل مستخدم محلياً. */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as ThemeMode | null) ?? "light";
    setMode(saved);
    apply(saved);
  }, []);

  const set = useCallback((next: ThemeMode) => {
    setMode(next);
    localStorage.setItem(KEY, next);
    apply(next);
  }, []);

  const toggle = useCallback(() => set(mode === "dark" ? "light" : "dark"), [mode, set]);

  return { mode, set, toggle };
}
