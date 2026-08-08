import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/sb";
import { Banknote } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { ExportCsvButton } from "@/components/export-csv-button";
import { StatMini } from "@/components/asset-detail";
import { fmtSAR } from "@/components/dash-bits";

export const Route = createFileRoute("/payroll/")({
  head: () => ({
    meta: [
      { title: "الرواتب | منصة الأصول" },
      { name: "description", content: "مسيّرات رواتب الموظفين مع مزامنة تلقائية للمصروفات في المالية المركزية" },
      { property: "og:title", content: "الرواتب | منصة الأصول" },
      { property: "og:description", content: "إدارة رواتب الموظفين وربطها تلقائياً بالمالية المركزية" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PayrollPage,
});

const INV = [["payroll-list"], ["transactions-list"], ["dashboard-totals"]];

function PayrollPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data } = useQuery(queryOptions({
    queryKey: ["payroll-list"],
    queryFn: async () => {
      const [rows, emps, projects, accounts] = await Promise.all([
        sb("payroll").select("*").order("period_year", { ascending: false }).order("period_month", { ascending: false }),
        supabase.from("employees" as any).select("id, full_name, basic_salary").eq("archived", false),
        supabase.from("projects" as any).select("id, name").eq("archived", false),
        supabase.from("accounts" as any).select("id, name").eq("archived", false),
      ]);
      return {
        rows: (rows.data ?? []) as any[],
        emps: (emps.data ?? []) as any[],
        projects: (projects.data ?? []) as any[],
        accounts: (accounts.data ?? []) as any[],
      };
    },
  }));

  const empById: Record<string, any> = Object.fromEntries((data?.emps ?? []).map((e: any) => [e.id, e]));

  const FIELDS: FieldDef[] = useMemo(() => [
    { name: "employee_id", label: "الموظف", type: "select", required: true,
      options: (data?.emps ?? []).map((e: any) => ({ value: e.id, label: e.full_name })) },
    { name: "period_year", label: "السنة", type: "number", required: true },
    { name: "period_month", label: "الشهر", type: "number", required: true },
    { name: "basic_salary", label: "الراتب الأساسي", type: "number" },
    { name: "allowances", label: "البدلات", type: "number" },
    { name: "deductions", label: "الخصومات", type: "number" },
    { name: "net_amount", label: "الصافي المستحق", type: "number", required: true },
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "مستحق", label: "مستحق (لم يُدفع)" }, { value: "مدفوع", label: "مدفوع" },
    ]},
    { name: "paid_date", label: "تاريخ الدفع", type: "date", showWhen: { field: "status", equals: ["مدفوع"] } },
    { name: "account_id", label: "الحساب المالي", type: "select",
      options: (data?.accounts ?? []).map((a: any) => ({ value: a.id, label: a.name })) },
    { name: "project_id", label: "المشروع المرتبط", type: "select",
      options: (data?.projects ?? []).map((p: any) => ({ value: p.id, label: p.name })) },
    { name: "notes", label: "ملاحظات", type: "textarea" },
  ], [data]);

  const rows = useMemo(() => {
    let r = (data?.rows ?? []) as any[];
    if (search) {
      const s = search.toLowerCase();
      r = r.filter((x) => (empById[x.employee_id]?.full_name ?? "").toLowerCase().includes(s));
    }
    if (status) r = r.filter((x) => x.status === status);
    return r;
  }, [data, search, status, empById]);

  const paid = rows.filter((r) => r.status === "مدفوع").reduce((s, r) => s + Number(r.net_amount || 0), 0);
  const due = rows.filter((r) => r.status !== "مدفوع").reduce((s, r) => s + Number(r.net_amount || 0), 0);

  const now = new Date();

  return (
    <DashboardLayout
      title="الرواتب"
      icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-100 text-cyan-700"><Banknote className="h-6 w-6" /></div>}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatMini label="رواتب مدفوعة (مصروف في المالية)" value={fmtSAR(paid)} tone="bg-rose-50 border-rose-200 text-rose-700" />
        <StatMini label="رواتب مستحقة (لم تُدفع)" value={fmtSAR(due)} tone="bg-amber-50 border-amber-200 text-amber-700" />
        <StatMini label="عدد المسيّرات" value={String(rows.length)} tone="bg-sky-50 border-sky-200 text-sky-700" />
      </div>

      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="بحث باسم الموظف..."
        filters={[{ value: status, onChange: setStatus, options: [
          { value: "", label: "كل الحالات" },
          { value: "مستحق", label: "مستحق" },
          { value: "مدفوع", label: "مدفوع" },
        ]}]}
        actions={
          <div className="flex gap-2">
            <ExportCsvButton filename="payroll" rows={rows} />
            <RecordDialog
              table="payroll"
              title="إضافة مسيّر راتب"
              fields={FIELDS}
              invalidate={INV}
              defaults={{ status: "مستحق", period_year: now.getFullYear(), period_month: now.getMonth() + 1 }}
            />
          </div>
        }
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[820px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">الموظف</th>
            <th className="px-4 py-3">الفترة</th>
            <th className="px-4 py-3">الأساسي</th>
            <th className="px-4 py-3">البدلات</th>
            <th className="px-4 py-3">الخصومات</th>
            <th className="px-4 py-3">الصافي</th>
            <th className="px-4 py-3">الحالة</th>
            <th className="px-4 py-3">تاريخ الدفع</th>
            <th className="px-4 py-3">إجراءات</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold">{empById[r.employee_id]?.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.period_month}/{r.period_year}</td>
                <td className="px-4 py-3">{Number(r.basic_salary || 0).toLocaleString()}</td>
                <td className="px-4 py-3">{Number(r.allowances || 0).toLocaleString()}</td>
                <td className="px-4 py-3">{Number(r.deductions || 0).toLocaleString()}</td>
                <td className="px-4 py-3 font-bold">{Number(r.net_amount || 0).toLocaleString()} ر.س</td>
                <td className="px-4 py-3"><StatusPill tone={r.status === "مدفوع" ? "success" : "warning"}>{r.status}</StatusPill></td>
                <td className="px-4 py-3 text-muted-foreground">{r.paid_date ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <RecordDialog table="payroll" title="تعديل مسيّر الراتب" fields={FIELDS} initial={r} invalidate={INV} />
                    <DeleteButton table="payroll" id={r.id} invalidate={INV} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">لا توجد مسيّرات رواتب</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        عند تعيين حالة الراتب إلى «مدفوع» يُنشئ النظام تلقائياً حركة مصروف في المالية المركزية مرتبطة بالموظف والفترة والمشروع.
        الرواتب المستحقة تبقى التزامات ولا تُسجَّل كمصروف.
      </p>
    </DashboardLayout>
  );
}
