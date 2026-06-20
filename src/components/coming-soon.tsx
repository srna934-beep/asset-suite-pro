import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Construction, type LucideIcon } from "lucide-react";

export function ComingSoon({ title, icon: Icon, desc, tone = "bg-primary/10 text-primary" }: { title: string; icon: LucideIcon; desc: string; tone?: string }) {
  const iconNode: ReactNode = (
    <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon className="h-6 w-6" /></div>
  );
  return (
    <DashboardLayout title={title} icon={iconNode}>
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <Construction className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-extrabold">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{desc}</p>
      </div>
    </DashboardLayout>
  );
}
