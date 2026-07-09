import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { sb } from "@/lib/sb";
import { supabase } from "@/integrations/supabase/client";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { StatusPill } from "@/components/status-pill";
import { PieChart } from "lucide-react";
import { fmtSAR } from "@/components/dash-bits";

export const Route = createFileRoute("/budgets/")({
  head: () => ({ meta: [{ title: "الميزانيات والتخطيط | منصة الأصول" }] }),
  component: BudgetsPage,
});

const SCOPES = [
  { value: "system", label: "النظام بالكامل" },
  { value: "properties", label: "العقارات" },
  { value: "vehicles", label: "المركبات والمعدات" },
  { value: "lands", label: "الأراضي والمزارع" },
  { value: "employees", label: "الرواتب" },
  { value: "maintenance", label: "الصيانة" },
  { value: "expenses", label: "المصروفات العامة" },
  { value: "projects", label: "المشاريع" },
];
const STATUSES = ["مسودة", "بانتظار الموافقة", "معتمدة", "مرفوضة", "منتهية", "مؤرشفة"];

const FIELDS: FieldDef[] = [
  { name: "name", label: "اسم الميزانية", required: true },
  { name: "period", label: "الفترة", type: "select", required: true, options: [{ value: "شهرية", label: "شهرية" }, { value: "سنوية", label: "سنوية" }] },
  { name: "start_date", label: "تاريخ البداية", type: "date", required: true },
  { name: "end_date", label: "تاريخ النهاية", type: "date", required: true },
  { name: "scope", label: "النطاق", type: "select", required: true, options: SCOPES },
  { name: "planned_income", label: "الدخل المتوقع", type: "number" },
  { name: "planned_expense", label: "المصروف المتوقع", type: "number" },
  { name: "status", label: "الحالة", type: "select", options: STATUSES.map(s => ({ value: s, label: s })) },
  { name: "notes", label: "ملاحظات", type: "textarea" },
];
const INV = [["budgets-list"]];

function BudgetsPage() {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("");
  const { data = [] } = useQuery(queryOptions({
    queryKey: ["budgets-list"],
    queryFn: async () => (await sb("budgets").select("*").order("created_at", { ascending: false })).data ?? [],
  }));
  const { data: txns = [] } = useQuery(queryOptions({
    queryKey: ["all-txns-budgets"],
    queryFn: async () => (await supabase.from("transactions" as any).select("amount,txn_type,txn_date,budget_id,entity_type").limit(2000)).data ?? [],
  }));

  const filtered = useMemo(() => {
    let r = data as any[];
    if (search) { const s = search.toLowerCase(); r = r.filter(b => b.name?.toLowerCase().includes(s)); }
    if (scope) r = r.filter(b => b.scope === scope);
    return r;
  }, [data, search, scope]);

  function actuals(b: any) {
    const rows = (txns as any[]).filter(t => {
      if (t.budget_id === b.id) return true;
      // fallback: scope + date range
      if (t.txn_date < b.start_date || t.txn_date > b.end_date) return false;
      const map: Record<string, string> = { properties: "property", vehicles: "vehicle", lands: "land", projects: "project", employees: "employee" };
      if (b.scope === "system") return true;
      return map[b.scope] && t.entity_type === map[b.scope];
    });
    const inc = rows.filter(t => t.txn_type === "إيراد").reduce((s, t) => s + Number(t.amount || 0), 0);
    const exp = rows.filter(t => t.txn_type === "مصروف").reduce((s, t) => s + Number(t.amount || 0), 0);
    return { inc, exp };
  }

  return (
    <DashboardLayout title="الميزانيات والتخطيط المالي" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700"><PieChart className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: scope, onChange: setScope, placeholder: "كل النطاقات", options: SCOPES }]}
      >
        <RecordDialog table="budgets" title="إضافة ميزانية" fields={FIELDS} invalidate={INV} />
      </ListToolbar>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">الاسم</th>
              <th className="px-4 py-3">الفترة</th>
              <th className="px-4 py-3">النطاق</th>
              <th className="px-4 py-3">المخطط (دخل / مصروف)</th>
              <th className="px-4 py-3">الفعلي</th>
              <th className="px-4 py-3">الإنجاز</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((b: any) => {
                const a = actuals(b);
                const pct = b.planned_expense > 0 ? Math.min(100, Math.round((a.exp / Number(b.planned_expense)) * 100)) : 0;
                return (
                  <tr key={b.id} className="border-t border-border">
                    <td className="px-4 py-3 font-bold">{b.name}</td>
                    <td className="px-4 py-3">{b.period}<div className="text-[10px] text-muted-foreground">{b.start_date} → {b.end_date}</div></td>
                    <td className="px-4 py-3">{SCOPES.find(s => s.value === b.scope)?.label ?? b.scope}</td>
                    <td className="px-4 py-3 text-xs"><span className="text-emerald-700">{fmtSAR(b.planned_income)}</span> / <span className="text-rose-700">{fmtSAR(b.planned_expense)}</span></td>
                    <td className="px-4 py-3 text-xs"><span className="text-emerald-700">{fmtSAR(a.inc)}</span> / <span className="text-rose-700">{fmtSAR(a.exp)}</span></td>
                    <td className="px-4 py-3">
                      <div className="w-24 h-2 rounded bg-muted overflow-hidden"><div className={`h-full ${pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} /></div>
                      <div className="mt-0.5 text-[10px]">{pct}%</div>
                    </td>
                    <td className="px-4 py-3"><StatusPill tone={b.status === "معتمدة" ? "success" : b.status === "مرفوضة" ? "danger" : "muted"}>{b.status}</StatusPill></td>
                    <td className="px-4 py-3"><div className="flex gap-1">
                      <RecordDialog table="budgets" title="تعديل الميزانية" fields={FIELDS} initial={b} invalidate={INV} />
                      <DeleteButton table="budgets" id={b.id} invalidate={INV} />
                    </div></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">لا توجد ميزانيات — أنشئ ميزانيتك الأولى.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
