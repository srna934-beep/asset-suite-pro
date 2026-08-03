import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { sb } from "@/lib/sb";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, DashGrid, fmtSAR } from "@/components/dash-bits";
import { Section, BackNav, AssetDocsAndActivity } from "@/components/asset-detail";
import { StatusPill } from "@/components/status-pill";
import { Briefcase, DollarSign, ListChecks, Users, FileSignature, BarChart3 } from "lucide-react";
import { projectFinanceQuery, aggregateProject } from "@/lib/project-finance";
import { monthlyReport } from "@/lib/entity-finance";
import { useAssetOptions } from "@/lib/asset-options";
import { ExportCsvButton } from "@/components/export-csv-button";

export const Route = createFileRoute("/projects/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل المشروع | منصة الأصول" },
      { name: "description", content: "تفاصيل المشروع: المراحل والميزانية والإيرادات والمصروفات والأرباح والفريق والتقارير." },
      { property: "og:title", content: "تفاصيل المشروع | منصة الأصول" },
      { property: "og:description", content: "تفاصيل المشروع مرتبطة بالنظام المالي بالكامل." },
    ],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const { nameById } = useAssetOptions();
  const { data: fin } = useQuery(projectFinanceQuery);

  const { data } = useQuery(queryOptions({
    queryKey: ["project-detail", id],
    queryFn: async () => {
      const [p, tk, e, a, ec] = await Promise.all([
        sb("projects").select("*").eq("id", id).maybeSingle(),
        supabase.from("tasks" as any).select("*").eq("project_id", id).order("due_date"),
        sb("project_employees").select("*, employees(full_name)").eq("project_id", id),
        sb("project_assets").select("*").eq("project_id", id),
        supabase.from("employment_contracts" as any).select("*").eq("project_id", id),
      ]);
      return {
        p: p.data, tasks: (tk.data ?? []) as any[], emps: (e.data ?? []) as any[],
        assets: (a.data ?? []) as any[], contracts: (ec.data ?? []) as any[],
      };
    },
  }));

  const p: any = data?.p;
  const m = useMemo(() => aggregateProject(fin, id), [fin, id]);
  const report = useMemo(() => monthlyReport(m.rows.map((r) => ({ ...r, entityId: r.projectId })) as any), [m.rows]);

  const tasks = data?.tasks ?? [];
  const tasksDone = tasks.filter((t: any) => t.status === "منجزة").length;
  const progress = tasks.length ? Math.round((tasksDone / tasks.length) * 100) : Number(p?.progress_pct ?? 0);

  if (!p) return <DashboardLayout title="تفاصيل المشروع"><div className="h-64 animate-pulse rounded-2xl bg-card" /></DashboardLayout>;

  const budget = Number(p.planned_budget || 0);
  const consumed = budget ? Math.round((m.expense / budget) * 100) : 0;

  return (
    <DashboardLayout title={p.name} icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Briefcase className="h-6 w-6" /></div>}>
      <BackNav links={[
        { to: "/", label: "لوحة التحكم" },
        { to: "/projects", label: "المشاريع" },
        { to: "/projects/$id", params: { id }, label: p.name },
      ]} />

      <div className="space-y-5">
        {/* البطاقات المالية */}
        <DashGrid>
          <StatCard label="الميزانية المخططة" value={fmtSAR(budget)} tone="primary" />
          <StatCard label="الإيرادات الفعلية" value={fmtSAR(m.income)} tone="success" />
          <StatCard label="المصروفات الفعلية" value={fmtSAR(m.expense)} tone="danger" />
          <StatCard label="صافي الأرباح" value={fmtSAR(m.net)} tone={m.net >= 0 ? "success" : "danger"} />
          <StatCard label="المتبقي من الميزانية" value={fmtSAR(budget - m.expense)} tone={budget - m.expense >= 0 ? "success" : "danger"} />
          <StatCard label="الرواتب المرتبطة" value={fmtSAR(m.salaries)} tone="warning" />
          <StatCard label="نسبة استهلاك الميزانية" value={`${consumed}%`} tone={consumed > 100 ? "danger" : "info"} />
          <StatCard label="نسبة الإنجاز" value={`${progress}%`} tone="info" hint={`${tasksDone} من ${tasks.length} مهمة`} />
        </DashGrid>

        {/* معلومات المشروع */}
        <Section title="معلومات المشروع" icon={<Briefcase className="h-5 w-5 text-violet-600" />}>
          <div className="grid gap-3 p-5 text-sm md:grid-cols-2">
            <Info label="الرمز" value={p.code ?? "—"} />
            <Info label="النوع" value={p.project_type ?? "—"} />
            <Info label="الحالة" value={<StatusPill tone={p.status === "نشط" || p.status === "مكتمل" ? "success" : p.status === "متأخر" || p.status === "ملغي" ? "danger" : "muted"}>{p.status}</StatusPill>} />
            <Info label="الأولوية" value={p.priority ?? "—"} />
            <Info label="تاريخ البداية" value={p.start_date ?? "—"} />
            <Info label="تاريخ النهاية" value={p.end_date ?? "—"} />
            <Info label="المسؤول" value={p.responsible_id ? nameById[p.responsible_id] ?? "—" : "—"} />
            <Info label="المدير/المشرف" value={p.manager_id ? nameById[p.manager_id] ?? "—" : "—"} />
            <div className="md:col-span-2"><Info label="الوصف" value={p.description ?? "—"} /></div>
            <div className="md:col-span-2"><Info label="ملاحظات" value={p.notes ?? "—"} /></div>
          </div>
        </Section>

        {/* نسبة الإنجاز */}
        <Section title="نسبة الإنجاز" icon={<BarChart3 className="h-5 w-5 text-sky-600" />}>
          <div className="p-5">
            <div className="mb-2 flex items-center justify-between text-sm font-bold">
              <span>{progress}% مكتمل</span>
              <span className="text-muted-foreground">{tasksDone} / {tasks.length} مهمة</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
          </div>
        </Section>

        {/* مراحل التنفيذ (المهام) */}
        <Section title="مراحل التنفيذ" icon={<ListChecks className="h-5 w-5 text-violet-600" />}>
          <table className="w-full min-w-[640px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">المرحلة / المهمة</th><th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">الأولوية</th><th className="px-4 py-3">تاريخ الاستحقاق</th>
            </tr></thead>
            <tbody>
              {tasks.map((t: any) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{t.title}</td>
                  <td className="px-4 py-3"><StatusPill tone={t.status === "منجزة" ? "success" : t.status === "قيد التنفيذ" ? "info" : "warning"}>{t.status}</StatusPill></td>
                  <td className="px-4 py-3 text-muted-foreground">{t.priority ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.due_date ?? "—"}</td>
                </tr>
              ))}
              {tasks.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">لا توجد مراحل/مهام — أضفها من صفحة المهام مع ربطها بالمشروع.</td></tr>}
            </tbody>
          </table>
        </Section>

        {/* الإيرادات والمصروفات */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="الإيرادات" icon={<DollarSign className="h-5 w-5 text-emerald-600" />}>
            <MoneyRows rows={m.rows.filter((r) => r.kind === "إيراد")} tone="text-emerald-600" />
          </Section>
          <Section title="المصروفات" icon={<DollarSign className="h-5 w-5 text-rose-600" />}>
            <MoneyRows rows={m.rows.filter((r) => r.kind === "مصروف")} tone="text-rose-600" />
          </Section>
        </div>

        {/* العقود */}
        <Section title="العقود المرتبطة" icon={<FileSignature className="h-5 w-5 text-amber-600" />}>
          <table className="w-full min-w-[600px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">الموظف</th><th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">الراتب</th><th className="px-4 py-3">من → إلى</th><th className="px-4 py-3">الحالة</th>
            </tr></thead>
            <tbody>
              {(data?.contracts ?? []).map((c: any) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{nameById[c.employee_id] ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.contract_type ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{fmtSAR(c.monthly_salary)}</td>
                  <td className="px-4 py-3 text-xs">{c.start_date} → {c.end_date ?? "—"}</td>
                  <td className="px-4 py-3"><StatusPill tone={c.status === "نشط" ? "success" : "muted"}>{c.status}</StatusPill></td>
                </tr>
              ))}
              {(data?.contracts ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">لا توجد عقود مرتبطة بالمشروع</td></tr>}
            </tbody>
          </table>
        </Section>

        {/* الفريق */}
        <Section title="فريق المشروع" icon={<Users className="h-5 w-5 text-cyan-600" />}>
          <table className="w-full min-w-[480px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">الموظف</th><th className="px-4 py-3">الدور في المشروع</th>
            </tr></thead>
            <tbody>
              {(data?.emps ?? []).map((e: any) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">
                    <Link to="/employees/$id" params={{ id: e.employee_id }} className="text-primary hover:underline">
                      {e.employees?.full_name ?? nameById[e.employee_id] ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.role_in_project ?? "—"}</td>
                </tr>
              ))}
              {(data?.emps ?? []).length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">لا يوجد فريق مضاف</td></tr>}
            </tbody>
          </table>
        </Section>

        {/* التقارير */}
        <Section
          title="التقارير المالية (آخر 6 أشهر)"
          icon={<BarChart3 className="h-5 w-5 text-slate-600" />}
          action={<ExportCsvButton rows={report} filename="project-report" columns={[
            { key: "m", label: "الشهر" }, { key: "income", label: "الإيرادات" },
            { key: "expense", label: "المصروفات" }, { key: "net", label: "الصافي" },
          ]} />}
        >
          <table className="w-full min-w-[520px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">الشهر</th><th className="px-4 py-3">الإيرادات</th>
              <th className="px-4 py-3">المصروفات</th><th className="px-4 py-3">الصافي</th>
            </tr></thead>
            <tbody>
              {report.map((b) => (
                <tr key={b.m} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold" dir="ltr">{b.m}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{fmtSAR(b.income)}</td>
                  <td className="px-4 py-3 font-semibold text-rose-600">{fmtSAR(b.expense)}</td>
                  <td className={`px-4 py-3 font-extrabold ${b.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtSAR(b.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* الوثائق والسجل */}
        <AssetDocsAndActivity entityType="project" entityId={id} />
      </div>
    </DashboardLayout>
  );
}

function MoneyRows({ rows, tone }: { rows: { id: string; date: string | null; label: string; amount: number }[]; tone: string }) {
  return (
    <table className="w-full min-w-[380px] text-right text-sm">
      <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
        <th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">البيان</th><th className="px-4 py-3">المبلغ</th>
      </tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-border">
            <td className="px-4 py-3 text-muted-foreground">{r.date ?? "—"}</td>
            <td className="px-4 py-3">{r.label}</td>
            <td className={`px-4 py-3 font-bold ${tone}`}>{fmtSAR(r.amount)}</td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">لا توجد حركات</td></tr>}
      </tbody>
    </table>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-bold">{value}</div>
    </div>
  );
}
