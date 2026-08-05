import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={mode === "dark" ? "الوضع الفاتح" : "الوضع الليلي"}
      title={mode === "dark" ? "الوضع الفاتح" : "الوضع الليلي"}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground"
    >
      {mode === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </button>
  );
}
