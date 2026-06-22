import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { sb } from "@/lib/sb";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";

export const Route = createFileRoute("/accounting/")({
  head: () => ({ meta: [{ title: "المحاسبة | منصة الأصول" }] }),
  component: AccountingPage,
});

function AccountingPage() {
  const { data } = useQuery(queryOptions({
    queryKey: ["accounting-overview"],
    queryFn: async () => {
      const [{ data: txns }, { data: accs }] = await Promise.all([
        sb("transactions").select("*"),
        sb("accounts").select("*").eq("archived", false),
      ]);
      return { txns: (txns ?? []) as any[], accs: (accs ?? []) as any[] };
    },
  }));

  const txns = data?.txns ?? [];
  const accs = data?.accs ?? [];
  const totalIn = txns.filter(t => t.txn_type === "إيراد").reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = txns.filter(t => t.txn_type === "مصروف").reduce((s, t) => s + Number(t.amount), 0);
  const totalBalance = accs.reduce((s, a) => {
    const opening = Number(a.opening_balance ?? 0);
    const moves = txns.filter(t => t.account_id === a.id).reduce((ss, t) => ss + (t.txn_type === "إيراد" ? Number(t.amount) : t.txn_type === "مصروف" ? -Number(t.amount) : 0), 0);
    return s + opening + moves;
  }, 0);

  const byMonth: Record<string, { in: number; out: number }> = {};
  for (const t of txns) {
    const m = (t.txn_date as string).slice(0, 7);
    byMonth[m] ??= { in: 0, out: 0 };
    if (t.txn_type === "إيراد") byMonth[m].in += Number(t.amount);
    else if (t.txn_type === "مصروف") byMonth[m].out += Number(t.amount);
  }
  const months = Object.keys(byMonth).sort().slice(-12);

  return (
    <DashboardLayout title="المحاسبة والمالية" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><DollarSign className="h-6 w-6" /></div>}>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={<TrendingUp className="h-5 w-5" />} tint="bg-emerald-50 border-emerald-200 text-emerald-700" label="إجمالي الإيرادات" value={`${totalIn.toLocaleString()} ر.س`} />
        <Card icon={<TrendingDown className="h-5 w-5" />} tint="bg-rose-50 border-rose-200 text-rose-700" label="إجمالي المصاريف" value={`${totalOut.toLocaleString()} ر.س`} />
        <Card icon={<DollarSign className="h-5 w-5" />} tint="bg-primary/5 border-primary/30 text-primary" label="صافي الربح" value={`${(totalIn - totalOut).toLocaleString()} ر.س`} />
        <Card icon={<Wallet className="h-5 w-5" />} tint="bg-sky-50 border-sky-200 text-sky-700" label="رصيد الحسابات" value={`${totalBalance.toLocaleString()} ر.س`} />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold">قائمة الدخل (آخر 12 شهراً)</h3>
          <Link to="/transactions" className="text-sm font-bold text-primary hover:underline">عرض الحركات ←</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-xs"><th className="px-3 py-2">الشهر</th><th className="px-3 py-2">إيرادات</th><th className="px-3 py-2">مصاريف</th><th className="px-3 py-2">الصافي</th></tr></thead>
            <tbody>
              {months.map(m => {
                const r = byMonth[m];
                const net = r.in - r.out;
                return (
                  <tr key={m} className="border-t border-border">
                    <td className="px-3 py-2 font-semibold">{m}</td>
                    <td className="px-3 py-2 text-emerald-600 font-bold">{r.in.toLocaleString()}</td>
                    <td className="px-3 py-2 text-rose-600 font-bold">{r.out.toLocaleString()}</td>
                    <td className={`px-3 py-2 font-extrabold ${net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{net.toLocaleString()}</td>
                  </tr>
                );
              })}
              {months.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">لا توجد حركات مسجلة بعد. ابدأ من <Link to="/transactions" className="text-primary underline">صفحة الحركات</Link>.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
  );
}

function Card({ icon, tint, label, value }: { icon: any; tint: string; label: string; value: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${tint}`}>
      <div className="flex items-center gap-2 text-xs font-bold">{icon} {label}</div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
    </div>
  );
}
