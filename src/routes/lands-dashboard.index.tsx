import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, DashGrid, Section, fmtSAR } from "@/components/dash-bits";
import { Map, DollarSign, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/lands-dashboard/")({
  head: () => ({ meta: [{ title: "لوحة الأراضي" }] }),
  component: LandsDashboard,
});

function LandsDashboard() {
  const { data } = useQuery(queryOptions({
    queryKey: ["dash-lands"],
    queryFn: async () => {
      const [l, t, m, e] = await Promise.all([
        (supabase as any).from("lands").select("*").eq("archived", false),
        (supabase as any).from("transactions").select("amount,txn_type,category,txn_date").eq("entity_type", "land"),
        (supabase as any).from("maintenance_requests").select("cost,reported_at,completed_at,entity_type").eq("entity_type", "land"),
        (supabase as any).from("expenses").select("amount,expense_date,entity_type").eq("entity_type", "land"),
      ]);
      return { lands: l.data ?? [], txns: t.data ?? [], maint: m.data ?? [], expenses: e.data ?? [] };
    },
  }));
  const d: any = data ?? {};
  const lands = d.lands ?? []; const txns = d.txns ?? []; const maint = d.maint ?? []; const expenses = d.expenses ?? [];
  const byType = (k: string) => lands.filter((x: any) => (x.ownership_type || "").includes(k) || (x.status || "").includes(k)).length;
  const agri = byType("زراع"); const indu = byType("صناع"); const comm = byType("تجار"); const resi = byType("سكن");
  const leased = lands.filter((x: any) => (x.status || "").includes("مؤجر")).length;
  const active = lands.filter((x: any) => (x.status || "").includes("تشغيل") || (x.status || "").includes("نشط")).length;
  const unused = lands.filter((x: any) => (x.status || "").includes("غير")).length;
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const inMonth = (dt?: string | null) => !!dt && dt.startsWith(ym);
  const sumF = (arr: any[], f: (x: any) => number) => arr.reduce((s, x) => s + f(x), 0);

  const revenue = sumF(txns.filter((x: any) => x.txn_type === "إيراد"), (x) => Number(x.amount || 0));
  const incomeMonth = sumF(txns.filter((x: any) => x.txn_type === "إيراد" && inMonth(x.txn_date)), (x) => Number(x.amount || 0));
  const txnExpAll = sumF(txns.filter((x: any) => x.txn_type === "مصروف"), (x) => Number(x.amount || 0));
  const txnExpMonth = sumF(txns.filter((x: any) => x.txn_type === "مصروف" && inMonth(x.txn_date)), (x) => Number(x.amount || 0));
  const expAll = sumF(expenses, (x) => Number(x.amount || 0));
  const expMonth = sumF(expenses.filter((x: any) => inMonth(x.expense_date)), (x) => Number(x.amount || 0));
  const maintAll = sumF(maint, (x) => Number(x.cost || 0));
  const maintMonth = sumF(maint.filter((x: any) => inMonth(x.completed_at) || inMonth(x.reported_at)), (x) => Number(x.cost || 0));
  const expensesMonth = txnExpMonth + expMonth + maintMonth;
  const expensesAll = txnExpAll + expAll + maintAll;
  const netMonth = incomeMonth - expensesMonth;
  const netAll = revenue - expensesAll;
  const salaries = sumF(txns.filter((x: any) => x.txn_type === "مصروف" && ((x.category || "").includes("راتب") || (x.category || "").includes("رواتب"))), (x) => Number(x.amount || 0));
  const assets = lands.reduce((s: number, x: any) => s + Number(x.current_value || 0), 0);

  return (
    <DashboardLayout title="لوحة الأراضي" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Map className="h-6 w-6" /></div>}>
      <div className="space-y-4">
        <DashGrid>
          <StatCard label="عدد الأراضي" value={lands.length} icon={<Map className="h-5 w-5 text-emerald-600" />} />
          <StatCard label="زراعية" value={agri} tone="success" />
          <StatCard label="صناعية" value={indu} tone="info" />
          <StatCard label="تجارية" value={comm} tone="warning" />
          <StatCard label="سكنية" value={resi} />
          <StatCard label="مؤجرة" value={leased} tone="info" />
          <StatCard label="مشغّلة" value={active} tone="success" />
          <StatCard label="غير مستخدمة" value={unused} tone="warning" />
          <StatCard label="قيمة الأصول" value={fmtSAR(assets)} tone="primary" />
          <StatCard label="الإيرادات" value={fmtSAR(revenue)} tone="success" icon={<DollarSign className="h-5 w-5" />} />
          <StatCard label="المصروفات (منها رواتب)" value={fmtSAR(expenses)} hint={`رواتب: ${fmtSAR(salaries)}`} tone="warning" />
          <StatCard label="صافي الربح" value={fmtSAR(net)} tone={net >= 0 ? "success" : "danger"} />
        </DashGrid>
        <Section title="روابط سريعة">
          <div className="flex flex-wrap gap-2">
            {[["/lands","الأراضي"],["/transactions","الحركات المالية"],["/documents","الوثائق"],["/employees","الموظفين"]].map(([to,l]) => (
              <Link key={to} to={to} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted">{l}<ArrowLeft className="h-3 w-3" /></Link>
            ))}
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}
