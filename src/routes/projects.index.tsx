import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { sb } from "@/lib/sb";
import { supabase } from "@/integrations/supabase/client";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { ExportCsvButton } from "@/components/export-csv-button";
import { StatusPill } from "@/components/status-pill";
import { Briefcase, ArrowLeft, DollarSign } from "lucide-react";
import { StatCard, DashGrid, fmtSAR } from "@/components/dash-bits";
import { Section } from "@/components/asset-detail";
import { projectFinanceQuery, aggregateProject } from "@/lib/project-finance";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "المشاريع | منصة الأصول" },
      { name: "description", content: "إدارة المشاريع: الميزانيات والإيرادات والمصروفات والأرباح ونسب الإنجاز." },
      { property: "og:title", content: "المشاريع | منصة الأصول" },
      { property: "og:description", content: "إدارة المشاريع مرتبطة بالكامل بالنظام المالي." },
    ],
  }),
  component: ProjectsPage,
});

const STATUSES = ["مخطط", "بانتظار الموافقة", "نشط", "متوقف", "متأخر", "مكتمل", "ملغي", "مؤرشف"];
const PRIORITIES = ["منخفضة", "متوسطة", "عالية", "عاجلة"];
const INV = [["projects-list"], ["project-finance"]];

function useFields(employees: any[]): FieldDef[] {
  return [
    { name: "name", label: "اسم المشروع", required: true },
    { name: "code", label: "رقم/رمز المشروع" },
    { name: "project_type", label: "نوع المشروع" },
    { name: "description", label: "وصف المشروع", type: "textarea" },
    { name: "responsible_id", label: "المسؤول عن المشروع", type: "select", options: employees.map(e => ({ value: e.id, label: e.full_name })) },
    { name: "manager_id", label: "المدير/المشرف", type: "select", options: employees.map(e => ({ value: e.id, label: e.full_name })) },
    { name: "start_date", label: "تاريخ البداية", type: "date" },
    { name: "end_date", label: "تاريخ النهاية المتوقعة", type: "date" },
    { name: "status", label: "الحالة", type: "select", options: STATUSES.map(s => ({ value: s, label: s })) },
    { name: "priority", label: "الأولوية", type: "select", options: PRIORITIES.map(s => ({ value: s, label: s })) },
    { name: "progress_pct", label: "نسبة الإنجاز %", type: "number" },
    { name: "planned_budget", label: "الميزانية المخططة", type: "number" },
    { name: "planned_income", label: "الإيراد المتوقع", type: "number" },
    { name: "notes", label: "الملاحظات", type: "textarea" },
  ];
}

function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data = [] } = useQuery(queryOptions({
    queryKey: ["projects-list"],
    queryFn: async () => (await sb("projects").select("*").order("created_at", { ascending: false })).data ?? [],
  }));
  const { data: employees = [] } = useQuery(queryOptions({
    queryKey: ["employees-lite"],
    queryFn: async () => (await sb("employees").select("id, full_name").eq("archived", false).order("full_name")).data ?? [],
  }));
  const { data: fin } = useQuery(projectFinanceQuery);
  const fields = useFields(employees as any[]);

  const projects = data as any[];
  const nameById = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.name])), [projects]);

  const agg = useMemo(() => {
    const map: Record<string, ReturnType<typeof aggregateProject>> = {};
    for (const p of projects) map[p.id] = aggregateProject(fin, p.id);
    return map;
  }, [projects, fin]);

  const totals = useMemo(() => aggregateProject(fin), [fin]);
  const plannedBudget = projects.reduce((s, p) => s + Number(p.planned_budget || 0), 0);
  const plannedIncome = projects.reduce((s, p) => s + Number(p.planned_income || 0), 0);
  const activeCount = projects.filter((p) => p.status === "نشط").length;
  const doneCount = projects.filter((p) => p.status === "مكتمل").length;
  const avgProgress = projects.length ? Math.round(projects.reduce((s, p) => s + Number(p.progress_pct || 0), 0) / projects.length) : 0;

  const filtered = useMemo(() => {
    let r = projects;
    if (search) { const s = search.toLowerCase(); r = r.filter((p: any) => p.name?.toLowerCase().includes(s) || p.code?.toLowerCase().includes(s)); }
    if (status) r = r.filter((p: any) => p.status === status);
    return r;
  }, [projects, search, status]);

  const movements = (fin?.rows ?? []).slice(0, 40);

  return (
    <DashboardLayout title="المشاريع" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Briefcase className="h-6 w-6" /></div>}>
      <div className="space-y-5">
        {/* بطاقات مختصرة */}
        <DashGrid>
          <StatCard label="عدد المشاريع" value={projects.length} icon={<Briefcase className="h-5 w-5 text-violet-600" />} />
          <StatCard label="مشاريع نشطة" value={activeCount} tone="success" />
          <StatCard label="مشاريع مكتملة" value={doneCount} tone="info" />
          <StatCard label="متوسط الإنجاز" value={`${avgProgress}%`} tone="primary" />
        </DashGrid>

        {/* البطاقات المالية */}
        <DashGrid>
          <StatCard label="الميزانية المخططة" value={fmtSAR(plannedBudget)} tone="primary" />
          <StatCard label="الإيراد المتوقع" value={fmtSAR(plannedIncome)} tone="info" />
          <StatCard label="الإيرادات الفعلية" value={fmtSAR(totals.income)} tone="success" />
          <StatCard label="المصروفات الفعلية" value={fmtSAR(totals.expense)} tone="danger" />
          <StatCard label="الرواتب" value={fmtSAR(totals.salaries)} tone="warning" />
          <StatCard label="المتبقي من الميزانية" value={fmtSAR(plannedBudget - totals.expense)} tone={plannedBudget - totals.expense >= 0 ? "success" : "danger"} />
          <StatCard label="صافي الأرباح" value={fmtSAR(totals.net)} tone={totals.net >= 0 ? "success" : "danger"} />
          <StatCard label="نسبة الاستهلاك" value={`${plannedBudget ? Math.round((totals.expense / plannedBudget) * 100) : 0}%`} tone="warning" />
        </DashGrid>

        <ListToolbar
          search={search} onSearch={setSearch}
          filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: STATUSES.map(s => ({ value: s, label: s })) }]}
        >
          <ExportCsvButton rows={filtered.map((p: any) => ({ ...p, income: agg[p.id]?.income ?? 0, expense: agg[p.id]?.expense ?? 0, net: agg[p.id]?.net ?? 0 }))} filename="projects" columns={[
            { key: "name", label: "المشروع" }, { key: "code", label: "الرمز" },
            { key: "status", label: "الحالة" }, { key: "planned_budget", label: "الميزانية" },
            { key: "expense", label: "المصروف" }, { key: "income", label: "الإيراد" },
            { key: "net", label: "الصافي" }, { key: "progress_pct", label: "الإنجاز" },
          ]} />
          <RecordDialog table="projects" title="إضافة مشروع" fields={fields} invalidate={INV} />
        </ListToolbar>

        {/* جدول المشاريع */}
        <Section title="جدول المشاريع" icon={<Briefcase className="h-5 w-5 text-violet-600" />}>
          <table className="w-full min-w-[1100px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">اسم المشروع</th>
              <th className="px-4 py-3">الرمز</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">البداية → النهاية</th>
              <th className="px-4 py-3">الميزانية</th>
              <th className="px-4 py-3">المصروف</th>
              <th className="px-4 py-3">الإيراد</th>
              <th className="px-4 py-3">الصافي</th>
              <th className="px-4 py-3">الإنجاز</th>
              <th className="px-4 py-3">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((p: any) => {
                const m = agg[p.id] ?? { income: 0, expense: 0, net: 0 };
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-bold"><Link to="/projects/$id" params={{ id: p.id }} className="text-primary hover:underline">{p.name}</Link></td>
                    <td className="px-4 py-3 text-xs" dir="ltr">{p.code ?? "—"}</td>
                    <td className="px-4 py-3"><StatusPill tone={p.status === "نشط" || p.status === "مكتمل" ? "success" : p.status === "متأخر" || p.status === "ملغي" ? "danger" : "muted"}>{p.status}</StatusPill></td>
                    <td className="px-4 py-3 text-xs">{p.start_date ?? "—"} → {p.end_date ?? "—"}</td>
                    <td className="px-4 py-3">{fmtSAR(p.planned_budget)}</td>
                    <td className="px-4 py-3 font-semibold text-rose-600">{fmtSAR(m.expense)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{fmtSAR(m.income)}</td>
                    <td className={`px-4 py-3 font-extrabold ${m.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtSAR(m.net)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, Number(p.progress_pct ?? 0))}%` }} />
                        </div>
                        <span className="text-xs font-bold">{Number(p.progress_pct ?? 0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to="/projects/$id" params={{ id: p.id }} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-semibold hover:bg-muted">
                          تفاصيل <ArrowLeft className="h-3 w-3" />
                        </Link>
                        <RecordDialog table="projects" title="تعديل المشروع" fields={fields} initial={p} invalidate={INV} />
                        <DeleteButton table="projects" id={p.id} invalidate={INV} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">لا توجد مشاريع</td></tr>}
            </tbody>
          </table>
        </Section>

        {/* الحركات المالية للمشاريع */}
        <Section title="الحركات المالية للمشاريع" icon={<DollarSign className="h-5 w-5 text-emerald-600" />}>
          <table className="w-full min-w-[820px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">البيان</th><th className="px-4 py-3">المشروع</th>
              <th className="px-4 py-3">المبلغ</th>
            </tr></thead>
            <tbody>
              {movements.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{r.date ?? "—"}</td>
                  <td className="px-4 py-3"><StatusPill tone={r.kind === "إيراد" ? "success" : "danger"}>{r.kind}</StatusPill></td>
                  <td className="px-4 py-3">{r.label}</td>
                  <td className="px-4 py-3">
                    {r.projectId ? <Link to="/projects/$id" params={{ id: r.projectId }} className="font-semibold text-primary hover:underline">{nameById[r.projectId] ?? "—"}</Link> : "—"}
                  </td>
                  <td className={`px-4 py-3 font-bold ${r.kind === "إيراد" ? "text-emerald-600" : "text-rose-600"}`}>{fmtSAR(r.amount)}</td>
                </tr>
              ))}
              {movements.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">لا توجد حركات مالية مرتبطة بالمشاريع</td></tr>}
            </tbody>
          </table>
        </Section>
      </div>
    </DashboardLayout>
  );
}
