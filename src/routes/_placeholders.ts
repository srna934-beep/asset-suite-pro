import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import type { LucideIcon } from "lucide-react";
import { FolderOpen, Bell, Calculator, BarChart3, Settings, Construction } from "lucide-react";

function makePlaceholder(title: string, Icon: LucideIcon, desc: string) {
  return function Page() {
    return (
      <DashboardLayout title={title} icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>}>
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Construction className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-extrabold">{title}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{desc}</p>
        </div>
      </DashboardLayout>
    );
  };
}

export const documentsRoute = createFileRoute("/documents/")({
  head: () => ({ meta: [{ title: "الوثائق | إدارة الأملاك" }] }),
  component: makePlaceholder("الوثائق", FolderOpen, "أرشيف الوثائق الرسمية لكل عقار ومستأجر وعقد."),
});

export const tasksRoute = createFileRoute("/tasks/")({
  head: () => ({ meta: [{ title: "المهام والتنبيهات" }] }),
  component: makePlaceholder("المهام والتنبيهات", Bell, "المهام اليومية وتنبيهات الدفعات والعقود."),
});

export const accountingRoute = createFileRoute("/accounting/")({
  head: () => ({ meta: [{ title: "المحاسبة والمالية" }] }),
  component: makePlaceholder("المحاسبة والمالية", Calculator, "دفاتر الإيرادات والمصاريف والأرباح والخسائر."),
});

export const reportsRoute = createFileRoute("/reports/")({
  head: () => ({ meta: [{ title: "التقارير" }] }),
  component: makePlaceholder("التقارير", BarChart3, "تقارير الدخل والمصاريف والإشغال الشهرية والسنوية."),
});

export const settingsRoute = createFileRoute("/settings/")({
  head: () => ({ meta: [{ title: "الإعدادات" }] }),
  component: makePlaceholder("الإعدادات", Settings, "إعدادات النظام والمستخدمين والصلاحيات."),
});
