import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/sb";
import { BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reports/")({
  head: () => ({ meta: [{ title: "التقارير | منصة الأصول" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data } = useQuery(queryOptions({
    queryKey: ["reports-overview"],
    queryFn: async () => {
      const [{ data: totals }, { data: payments }, { data: contracts }] = await Promise.all([
        supabase.rpc("dashboard_totals" as any),
        supabase.from("payments").select("status, amount, due_date"),
        supabase.from("contracts").select("status, monthly_rent"),
      ]);
      const txns = (await sb("transactions").select("*")).data as any[] ?? [];
      return { totals, payments: payments ?? [], contracts: contracts ?? [], txns };
    },
  }));

  const totals: any = data?.totals ?? {};
  const payments = (data?.payments ?? []) as any[];
  const paidTotal = payments.filter(p => p.status === "مدفوع").reduce((s, p) => s + Number(p.amount), 0);
  const lateTotal = payments.filter(p => p.status === "متأخر").reduce((s, p) => s + Number(p.amount), 0);

  function exportCsv(name: string, rows: any[]) {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout title="التقارير والتحليلات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><BarChart3 className="h-6 w-6" /></div>}>
      <div className="mb-5 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => exportCsv("payments", payments)}><Download className="h-4 w-4 ml-2" /> تصدير الدفعات CSV</Button>
        <Button variant="outline" onClick={() => exportCsv("transactions", data?.txns ?? [])}><Download className="h-4 w-4 ml-2" /> تصدير الحركات CSV</Button>
        <Button variant="outline" onClick={() => window.print()}>طباعة هذه الصفحة</Button>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 mb-5">
        <h3 className="text-base font-extrabold mb-4">ملخص شامل</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="عقارات" value={totals.properties_count ?? 0} />
          <Stat label="وحدات" value={totals.units_count ?? 0} />
          <Stat label="مركبات" value={totals.vehicles_count ?? 0} />
          <Stat label="أراضي" value={totals.lands_count ?? 0} />
          <Stat label="مستأجرين" value={totals.tenants_count ?? 0} />
          <Stat label="عقود نشطة" value={totals.active_contracts ?? 0} />
          <Stat label="موظفين" value={totals.employees_count ?? 0} />
          <Stat label="مهام مفتوحة" value={totals.open_tasks ?? 0} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Box title="ملخص الدفعات">
          <Row label="إجمالي المدفوع" value={`${paidTotal.toLocaleString()} ر.س`} color="text-emerald-700" />
          <Row label="إجمالي المتأخر" value={`${lateTotal.toLocaleString()} ر.س`} color="text-rose-700" />
          <Row label="عدد الدفعات" value={payments.length} />
        </Box>
        <Box title="القيمة الإجمالية للأصول">
          <Row label="إيرادات إجمالية" value={`${Number(totals.revenue_total ?? 0).toLocaleString()} ر.س`} color="text-emerald-700" />
          <Row label="مصاريف إجمالية" value={`${Number(totals.expense_total ?? 0).toLocaleString()} ر.س`} color="text-rose-700" />
          <Row label="قيمة المركبات والأراضي" value={`${Number(totals.assets_value ?? 0).toLocaleString()} ر.س`} color="text-primary" />
        </Box>
      </section>
    </DashboardLayout>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return <div className="rounded-xl border border-border bg-background p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-extrabold">{value}</div></div>;
}
function Box({ title, children }: any) {
  return <div className="rounded-2xl border border-border bg-card p-5"><h3 className="text-base font-extrabold mb-3">{title}</h3><div className="space-y-2">{children}</div></div>;
}
function Row({ label, value, color }: any) {
  return <div className="flex justify-between border-b border-border/50 py-2 text-sm"><span className="text-muted-foreground">{label}</span><span className={`font-extrabold ${color ?? ""}`}>{value}</span></div>;
}
