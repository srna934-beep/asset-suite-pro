import type { ReactNode } from "react";

export function StatusPill({ tone, children }: { tone: "success" | "danger" | "warning" | "info" | "muted"; children: ReactNode }) {
  const map = {
    success: "bg-emerald-100 text-emerald-700",
    danger: "bg-rose-100 text-rose-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-sky-100 text-sky-700",
    muted: "bg-slate-100 text-slate-700",
  } as const;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${map[tone]}`}>{children}</span>;
}

export function propertyTone(s: string) {
  if (s === "مؤجر") return "success" as const;
  if (s === "متاح") return "info" as const;
  return "muted" as const;
}
export function unitTone(s: string) {
  if (s === "مؤجرة") return "success" as const;
  if (s === "صيانة") return "info" as const;
  return "warning" as const;
}
export function paymentTone(s: string) {
  if (s === "مدفوع") return "success" as const;
  return "danger" as const;
}
export function contractTone(s: string) {
  if (s === "نشط") return "success" as const;
  if (s === "ملغي") return "danger" as const;
  return "muted" as const;
}
