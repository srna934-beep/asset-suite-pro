import { ReactNode } from "react";

export function StatCard({ label, value, hint, tone = "default", icon }: {
  label: string; value: ReactNode; hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info" | "primary";
  icon?: ReactNode;
}) {
  const toneMap: Record<string, string> = {
    default: "bg-card border-border",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    danger:  "bg-rose-50 border-rose-200 text-rose-900",
    info:    "bg-sky-50 border-sky-200 text-sky-900",
    primary: "bg-primary/5 border-primary/30",
  };
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneMap[tone]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function DashGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function fmtSAR(n: number | null | undefined) {
  return `${Number(n ?? 0).toLocaleString()} ر.س`;
}
