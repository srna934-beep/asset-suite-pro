import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { sb } from "@/lib/sb";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, DashGrid, Section, fmtSAR } from "@/components/dash-bits";
import { PieChart, ArrowRight } from "lucide-react";
import { StatusPill } from "@/components/status-pill";

export const Route = createFileRoute("/budgets/$id")({
  head: () => ({ meta: [{ title: "تفاصيل الميزانية | منصة الأصول" }] }),
  component: BudgetDetail,
});

function BudgetDetail() {
  const { id } = Route.useParams();
  const { data } = useQuery(queryOptions({
    queryKey: ["budget-detail", id],
    queryFn: async () => {
      const [b, items, txns] = await Promise.all([
        sb("budgets").select("*").eq("id", id).maybeSingle(),
        sb("budget_items").select("*").eq("budget_id", id),
        supabase.from("transactions" as any).select("*").eq("budget_id", id).order("txn_date", { ascending: false }),
      ]);
      return { b: b.data, items: items.data ?? [], txns: txns.data ?? [] };
    },
  }));
  const b: any = data?.b;
  const txns = (data?.txns ?? []) as any[];
  const items = (data?.items ?? []) as any[];

  if (!b) return <DashboardLayout title="تفاصيل الميزانية"><div className="py-16 text-center text-muted-foreground">جارٍ التحميل...</div></DashboardLayout>;

  const inc = txns.filter(t => t.txn_type === "إيراد").reduce((s, t) => s + Number(t.amount || 0), 0);
  const exp = txns.filter(t => t.txn_type === "مصروف").reduce((s, t) => s + Number(t.amount || 0), 0);
  const plannedInc = Number(b.planned_income || 0);
  const plannedExp = Number(b.planned_expense || 0);
  const balance = inc - exp;
  const pct = plannedExp > 0 ? Math.min(100, Math.round((exp / plannedExp) * 100)) : 0;
  const overBudget = plannedExp > 0 && exp > plannedExp;
  const near = pct >= 80 && !overBudget;

  return (
    <DashboardLayout title={b.name} icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700"><PieChart className="h-6 w-6" /></div>}>
      <Link to="/budgets" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowRight className="h-4 w-4" /> رجوع للميزانيات</Link>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <StatusPill tone={b.status === "معتمدة" ? "success" : b.status === "مرفوضة" ? "danger" : "muted"}>{b.status}</StatusPill>
        <span>الفترة: {b.period} — {b.start_date} → {b.end_date}</span>
        <span>النطاق: {b.scope}</span>
      </div>

      {(overBudget || near) && (
        <div className={`mb-4 rounded-2xl border p-4 text-sm font-semibold ${overBudget ? "border-rose-300 bg-rose-50 text-rose-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
          {overBudget ? `تم تجاوز الميزانية المخططة بمقدار ${fmtSAR(exp - plannedExp)}` : `اقتربت من حد الميزانية (${pct}%)`}
        </div>
      )}

      <DashGrid>
        <StatCard label="الدخل المخطط" value={fmtSAR(plannedInc)} tone="emerald" />
        <StatCard label="الدخل الفعلي" value={fmtSAR(inc)} tone="emerald" />
        <StatCard label="المصروف المخطط" value={fmtSAR(plannedExp)} tone="rose" />
        <StatCard label="المصروف الفعلي" value={fmtSAR(exp)} tone="rose" />
        <StatCard label="الرصيد" value={fmtSAR(balance)} tone={balance >= 0 ? "sky" : "rose"} />
        <StatCard label="نسبة الإنفاق" value={`${pct}%`} tone={overBudget ? "rose" : near ? "amber" : "sky"} />
      </DashGrid>

      <Section title="بنود الميزانية">
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[600px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">البند</th>
              <th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">المخطط</th>
              <th className="px-4 py-3">ملاحظات</th>
            </tr></thead>
            <tbody>
              {items.map((it: any) => (
                <tr key={it.id} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold">{it.name}</td>
                  <td className="px-4 py-3">{it.item_type}</td>
                  <td className="px-4 py-3">{fmtSAR(it.planned_amount)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{it.notes ?? "—"}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">لا توجد بنود.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="الحركات المالية المرتبطة">
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[700px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">المبلغ</th>
              <th className="px-4 py-3">الوصف</th>
            </tr></thead>
            <tbody>
              {txns.slice(0, 100).map((t: any) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3 text-xs">{t.txn_date}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={t.txn_type === "إيراد" ? "success" : "danger"}>{t.txn_type}</StatusPill>
                  </td>
                  <td className={`px-4 py-3 font-bold ${t.txn_type === "إيراد" ? "text-emerald-700" : "text-rose-700"}`}>{fmtSAR(t.amount)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.description ?? "—"}</td>
                </tr>
              ))}
              {txns.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">لا توجد حركات مرتبطة بهذه الميزانية.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </DashboardLayout>
  );
}
