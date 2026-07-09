import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { sb } from "@/lib/sb";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, DashGrid, Section, fmtSAR } from "@/components/dash-bits";
import { Briefcase, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/projects-dashboard/")({
  head: () => ({ meta: [{ title: "لوحة المشاريع | منصة الأصول" }] }),
  component: ProjectsDashboard,
});

function ProjectsDashboard() {
  const { data } = useQuery(queryOptions({
    queryKey: ["projects-dashboard"],
    queryFn: async () => {
      const [p, t] = await Promise.all([
        sb("projects").select("*"),
        supabase.from("transactions" as any).select("amount,txn_type,project_id").limit(3000),
      ]);
      return { projects: (p.data ?? []) as any[], txns: (t.data ?? []) as any[] };
    },
  }));
  const projects = data?.projects ?? [];
  const txns = data?.txns ?? [];
  const active = projects.filter((p: any) => p.status === "نشط").length;
  const late = projects.filter((p: any) => p.status === "متأخر").length;
  const done = projects.filter((p: any) => p.status === "مكتمل").length;
  const budget = projects.reduce((s: number, p: any) => s + Number(p.planned_budget || 0), 0);
  const inc = txns.filter((t: any) => t.project_id && t.txn_type === "إيراد").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  const exp = txns.filter((t: any) => t.project_id && t.txn_type === "مصروف").reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
  const avgProgress = projects.length ? Math.round(projects.reduce((s: number, p: any) => s + Number(p.progress_pct || 0), 0) / projects.length) : 0;

  return (
    <DashboardLayout title="لوحة المشاريع" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Briefcase className="h-6 w-6" /></div>}>
      <div className="space-y-4">
        <DashGrid>
          <StatCard label="إجمالي المشاريع" value={projects.length} tone="primary" />
          <StatCard label="نشطة" value={active} tone="success" />
          <StatCard label="متأخرة" value={late} tone="danger" />
          <StatCard label="مكتملة" value={done} tone="info" />
          <StatCard label="إجمالي الميزانية المخططة" value={fmtSAR(budget)} />
          <StatCard label="إجمالي الإيرادات الفعلية" value={fmtSAR(inc)} tone="success" />
          <StatCard label="إجمالي المصروفات الفعلية" value={fmtSAR(exp)} tone="danger" />
          <StatCard label="صافي الربح" value={fmtSAR(inc - exp)} tone={inc - exp >= 0 ? "success" : "danger"} />
        </DashGrid>
        <Section title="نسبة الإنجاز العامة">
          <div className="w-full h-3 rounded bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${avgProgress}%` }} /></div>
          <div className="mt-1 text-xs text-muted-foreground">{avgProgress}%</div>
        </Section>
        <Section title="روابط سريعة">
          <Link to="/projects" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted">
            فتح قائمة المشاريع <ArrowLeft className="h-3 w-3" />
          </Link>
        </Section>
      </div>
    </DashboardLayout>
  );
}
