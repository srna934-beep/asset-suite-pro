import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { StatusPill } from "@/components/status-pill";
import { MoreHorizontal } from "lucide-react";

type Tone = "success" | "danger" | "warning" | "info" | "muted";

export function AssetCard({
  to,
  params,
  hero,
  title,
  subtitle,
  statusLabel,
  statusTone,
  stats,
  actions,
}: {
  to: any;
  params: any;
  hero: ReactNode;
  title: string;
  subtitle?: string;
  statusLabel?: string;
  statusTone?: Tone;
  stats: { label: string; value: ReactNode }[];
  actions?: ReactNode;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <Link to={to} params={params} className="block">
        <div className="relative h-40 overflow-hidden">
          {hero}
          {statusLabel && (
            <div className="absolute right-3 top-3">
              <StatusPill tone={statusTone ?? "muted"}>{statusLabel}</StatusPill>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={to}
              params={params}
              className="block truncate text-base font-extrabold text-foreground hover:text-primary"
            >
              {title}
            </Link>
            {subtitle && (
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</div>
            )}
          </div>
          {actions && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {stats.map((s, i) => (
            <div key={i} className="rounded-xl bg-muted/40 px-3 py-2">
              <div className="text-[10px] font-medium text-muted-foreground">{s.label}</div>
              <div className="mt-0.5 truncate text-sm font-bold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardsGrid({ children, empty }: { children: ReactNode; empty?: boolean }) {
  if (empty) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 py-16 text-center text-muted-foreground">
        <MoreHorizontal className="mx-auto mb-2 h-8 w-8 opacity-40" />
        لا توجد عناصر لعرضها
      </div>
    );
  }
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
