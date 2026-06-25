import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, DashGrid, Section, fmtSAR } from "@/components/dash-bits";
import { Wallet, DollarSign, ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/finance-dashboard/")({
  head: () => ({ meta: [{ title: "لوحة المالية" }] }),
  component: FinanceDashboard,
});

function FinanceDashboard() {
  const { data } = useQuery(queryOptions({
    queryKey: ["dash-finance"],
    queryFn: async () => {
      const [t, p, a] = await Promise.all([
        (supabase as any).from("transactions").select("*").order("txn_date", { ascending: false }),
        supabase.from("payments").select("amount,status"),
        (supabase as any).from("accounts").select("*"),
      ]);
      return { txns: t.data ?? [], payments: p.data ?? [], accounts: a.data ?? [] };
    },
  }));
  const d: any = data ?? {};
  const txns = d.txns ?? []; const payments = d.payments ?? [];
  const revenue = txns.filter((x: any) => x.txn_type === "إيراد").reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const expenses = txns.filter((x: any) => x.txn_type === "مصروف").reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const net = revenue - expenses;
  const outstanding = payments.filter((x: any) => x.status !== "مدفوع").reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const collected = payments.filter((x: any) => x.status === "مدفوع").reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const byEntity = (et: string, type: string) => txns.filter((x: any) => x.entity_type === et && x.txn_type === type).reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const groups = [
    { name: "العقارات", rev: byEntity("property", "إيراد") || collected, exp: byEntity("property", "مصروف") },
    { name: "المركبات", rev: byEntity("vehicle", "إيراد"), exp: byEntity("vehicle", "مصروف") },
    { name: "الأراضي", rev: byEntity("land", "إيراد"), exp: byEntity("land", "مصروف") },
  ];

  // Monthly trend (last 6 months)
  const months: { key: string; rev: number; exp: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = dt.toISOString().slice(0, 7);
    months.push({ key, rev: 0, exp: 0 });
  }
  for (const t of txns) {
    const k = (t.txn_date || "").slice(0, 7);
    const m = months.find((x) => x.key === k);
    if (!m) continue;
    if (t.txn_type === "إيراد") m.rev += Number(t.amount || 0);
    else if (t.txn_type === "مصروف") m.exp += Number(t.amount || 0);
  }
  const maxVal = Math.max(1, ...months.flatMap((m) => [m.rev, m.exp]));

  return (
    <DashboardLayout title="لوحة المالية" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Wallet className="h-6 w-6" /></div>}>
      <div className="space-y-4">
        <DashGrid>
          <StatCard label="إجمالي الإيرادات" value={fmtSAR(revenue)} tone="success" icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard label="إجمالي المصروفات" value={fmtSAR(expenses)} tone="danger" icon={<TrendingDown className="h-5 w-5" />} />
          <StatCard label="صافي الربح" value={fmtSAR(net)} tone={net >= 0 ? "success" : "danger"} />
          <StatCard label="مستحقات معلّقة" value={fmtSAR(outstanding)} tone="warning" />
          <StatCard label="إيرادات محصّلة" value={fmtSAR(collected)} tone="success" />
          <StatCard label="عدد الحركات" value={txns.length} icon={<DollarSign className="h-5 w-5" />} />
          <StatCard label="عدد الحسابات" value={(d.accounts ?? []).length} />
          <StatCard label="عدد الدفعات" value={payments.length} />
        </DashGrid>

        <Section title="الإيرادات والمصروفات حسب الأصول">
          <div className="grid gap-3 md:grid-cols-3">
            {groups.map((g) => (
              <div key={g.name} className="rounded-xl border border-border bg-background p-4">
                <div className="text-sm font-bold">{g.name}</div>
                <div className="mt-2 text-xs text-emerald-700">إيرادات: {fmtSAR(g.rev)}</div>
                <div className="text-xs text-rose-700">مصروفات: {fmtSAR(g.exp)}</div>
                <div className="mt-1 text-sm font-bold">صافي: {fmtSAR(g.rev - g.exp)}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="التدفق الشهري (آخر 6 أشهر)">
          <div className="space-y-2">
            {months.map((m) => (
              <div key={m.key}>
                <div className="mb-1 flex justify-between text-xs"><span>{m.key}</span><span>إيراد {fmtSAR(m.rev)} • مصروف {fmtSAR(m.exp)}</span></div>
                <div className="flex h-3 gap-1 overflow-hidden rounded">
                  <div className="bg-emerald-500" style={{ width: `${(m.rev / maxVal) * 50}%` }} />
                  <div className="bg-rose-500" style={{ width: `${(m.exp / maxVal) * 50}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="روابط سريعة">
          <div className="flex flex-wrap gap-2">
            {[["/transactions","الحركات"],["/accounts","الحسابات"],["/payments","الدفعات"],["/reports","التقارير"],["/accounting","المحاسبة"]].map(([to,l]) => (
              <Link key={to} to={to} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted">{l}<ArrowLeft className="h-3 w-3" /></Link>
            ))}
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}
