import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { sb } from "@/lib/sb";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, DashGrid, Section, fmtSAR } from "@/components/dash-bits";
import { Briefcase, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/projects/$id")({
  head: () => ({ meta: [{ title: "تفاصيل المشروع | منصة الأصول" }] }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const { data } = useQuery(queryOptions({
    queryKey: ["project-detail", id],
    queryFn: async () => {
      const [p, t, tk, e, a] = await Promise.all([
        sb("projects").select("*").eq("id", id).maybeSingle(),
        supabase.from("transactions" as any).select("*").eq("project_id", id),
        supabase.from("tasks" as any).select("*").eq("project_id", id),
        sb("project_employees").select("*, employees(full_name)").eq("project_id", id),
        sb("project_assets").select("*").eq("project_id", id),
      ]);
      return { p: p.data, txns: t.data ?? [], tasks: tk.data ?? [], emps: e.data ?? [], assets: a.data ?? [] };
    },
  }));
  const p: any = data?.p;
  const txns = (data?.txns ?? []) as any[];
  const inc = txns.filter(t => t.txn_type === "إيراد").reduce((s, t) => s + Number(t.amount || 0), 0);
  const exp = txns.filter(t => t.txn_type === "مصروف").reduce((s, t) => s + Number(t.amount || 0), 0);
  const tasksDone = (data?.tasks ?? []).filter((t: any) => t.status === "منجزة").length;

  if (!p) return <DashboardLayout title="تفاصيل المشروع"><div className="py-16 text-center text-muted-foreground">جارٍ التحميل...</div></DashboardLayout>;

  return (
    <DashboardLayout title={p.name} icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Briefcase className="h-6 w-6" /></div>}>
      <Link to="/projects" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowRight className="h-4 w-4" /> رجوع للمشاريع</Link>
      <div className="space-y-4">
        <DashGrid>
          <StatCard label="الميزانية المخططة" value={fmtSAR(p.planned_budget)} tone="primary" />
          <StatCard label="المصروف الفعلي" value={fmtSAR(exp)} tone="danger" />
          <StatCard label="الإيراد الفعلي" value={fmtSAR(inc)} tone="success" />
          <StatCard label="صافي الربح" value={fmtSAR(inc - exp)} tone={inc - exp >= 0 ? "success" : "danger"} />
          <StatCard label="المتبقي من الميزانية" value={fmtSAR(Number(p.planned_budget || 0) - exp)} />
          <StatCard label="نسبة الإنجاز" value={`${Number(p.progress_pct ?? 0)}%`} tone="info" />
          <StatCard label="المهام المكتملة" value={tasksDone} />
          <StatCard label="الحالة" value={p.status} />
        </DashGrid>

        <Section title="البيانات الأساسية">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <div><b>الرمز:</b> {p.code ?? "—"}</div>
            <div><b>النوع:</b> {p.project_type ?? "—"}</div>
            <div><b>البداية:</b> {p.start_date ?? "—"}</div>
            <div><b>النهاية:</b> {p.end_date ?? "—"}</div>
            <div><b>الأولوية:</b> {p.priority}</div>
            <div className="md:col-span-2"><b>الوصف:</b> {p.description ?? "—"}</div>
            <div className="md:col-span-2"><b>ملاحظات:</b> {p.notes ?? "—"}</div>
          </div>
        </Section>

        <Section title="العمليات المالية المرتبطة">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-right text-sm">
              <thead><tr className="bg-muted/40 text-xs"><th className="px-3 py-2">التاريخ</th><th className="px-3 py-2">النوع</th><th className="px-3 py-2">التصنيف</th><th className="px-3 py-2">المبلغ</th></tr></thead>
              <tbody>
                {txns.map((t: any) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-3 py-2 text-xs">{t.txn_date}</td>
                    <td className="px-3 py-2">{t.txn_type}</td>
                    <td className="px-3 py-2 text-xs">{t.category ?? "—"}</td>
                    <td className={`px-3 py-2 font-bold ${t.txn_type === "إيراد" ? "text-emerald-700" : "text-rose-700"}`}>{fmtSAR(t.amount)}</td>
                  </tr>
                ))}
                {txns.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">لا توجد عمليات مرتبطة بعد.</td></tr>}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}
