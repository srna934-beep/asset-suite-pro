import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill, paymentTone } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { markPaymentPaid, refreshLatePayments } from "@/lib/db";
import { DollarSign, BellRing, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";

export const Route = createFileRoute("/payments/")({
  head: () => ({ meta: [{ title: "الدفعات | إدارة الأملاك" }] }),
  component: PaymentsList,
});

const INVALIDATE = [["payments-list"], ["dashboard"]];

function PaymentsList() {
  const qc = useQueryClient();
  const { data } = useQuery(queryOptions({
    queryKey: ["payments-list"],
    queryFn: async () => {
      const [{ data: payments }, { data: contracts }, { data: units }, { data: properties }, { data: tenants }] = await Promise.all([
        supabase.from("payments").select("*").order("due_date", { ascending: false }),
        supabase.from("contracts").select("id, unit_id, tenant_id, monthly_rent"),
        supabase.from("units").select("id, property_id, unit_number"),
        supabase.from("properties").select("id, name"),
        supabase.from("tenants").select("id, full_name"),
      ]);
      return { payments: payments ?? [], contracts: contracts ?? [], units: units ?? [], properties: properties ?? [], tenants: tenants ?? [] };
    },
  }));

  useEffect(() => { refreshLatePayments().then(() => qc.invalidateQueries({ queryKey: ["payments-list"] })); }, [qc]);

  async function handlePay(id: string) {
    await markPaymentPaid(id);
    qc.invalidateQueries({ queryKey: ["payments-list"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  if (!data) return <DashboardLayout title="الدفعات"><div className="h-64 animate-pulse rounded-2xl bg-card" /></DashboardLayout>;

  const { payments, contracts, units, properties, tenants } = data;
  const totalPaid = payments.filter((p: any) => p.status === "مدفوع").reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalLate = payments.filter((p: any) => p.status === "متأخر").reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalUnpaid = payments.filter((p: any) => p.status === "غير مدفوع").reduce((s: number, p: any) => s + Number(p.amount), 0);
  const lateCount = payments.filter((p: any) => p.status === "متأخر").length;

  // Monthly summary (last 6 months)
  const months: { key: string; label: string; paid: number; due: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: d.toLocaleDateString("ar", { month: "short", year: "numeric" }), paid: 0, due: 0 });
  }
  payments.forEach((p: any) => {
    const key = p.due_date.slice(0, 7);
    const m = months.find((mm) => mm.key === key);
    if (!m) return;
    m.due += Number(p.amount);
    if (p.status === "مدفوع") m.paid += Number(p.amount);
  });
  const maxBar = Math.max(...months.map((m) => m.due), 1);

  return (
    <DashboardLayout title="الدفعات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><DollarSign className="h-6 w-6" /></div>}>
      {lateCount > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <BellRing className="h-5 w-5 shrink-0 text-rose-600" />
          <div className="text-sm leading-relaxed text-rose-700">
            <span className="font-bold">تنبيه: </span>
            {lateCount} دفعات متأخرة بإجمالي {totalLate.toLocaleString()} ر.س
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SumCard label="المدفوع" value={totalPaid} tone="text-emerald-700" bg="bg-emerald-50 border-emerald-200" />
        <SumCard label="المتأخر" value={totalLate} tone="text-rose-700" bg="bg-rose-50 border-rose-200" />
        <SumCard label="غير مدفوع" value={totalUnpaid} tone="text-amber-700" bg="bg-amber-50 border-amber-200" />
      </div>

      <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-base font-extrabold">الدخل الشهري — آخر 6 أشهر</h3>
        <div className="flex items-end gap-3 h-48">
          {months.map((m) => {
            const h = Math.max(8, (m.paid / maxBar) * 100);
            const totalH = Math.max(8, (m.due / maxBar) * 100);
            return (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative flex w-full max-w-12 flex-1 items-end">
                  <div className="absolute inset-x-0 bottom-0 rounded-t-lg bg-muted" style={{ height: `${totalH}%` }} />
                  <div className="absolute inset-x-0 bottom-0 rounded-t-lg bg-emerald-500" style={{ height: `${h}%` }} />
                </div>
                <div className="text-[11px] font-semibold text-muted-foreground">{m.label}</div>
                <div className="text-xs font-bold text-emerald-700">{m.paid.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <header className="border-b border-border px-5 py-4"><h3 className="text-base font-extrabold">كل الدفعات</h3></header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">الاستحقاق</th><th className="px-4 py-3">العقار</th>
              <th className="px-4 py-3">الوحدة</th><th className="px-4 py-3">المستأجر</th>
              <th className="px-4 py-3">المبلغ</th><th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">إجراء</th>
            </tr></thead>
            <tbody>
              {payments.map((p: any) => {
                const c = contracts.find((cc: any) => cc.id === p.contract_id);
                const u = c ? units.find((uu: any) => uu.id === c.unit_id) : null;
                const pr = u ? properties.find((pp: any) => pp.id === u.property_id) : null;
                const t = c ? tenants.find((tt: any) => tt.id === c.tenant_id) : null;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{p.due_date}</td>
                    <td className="px-4 py-3">{pr?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u?.unit_number ?? "—"}</td>
                    <td className="px-4 py-3">{t?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold">{Number(p.amount).toLocaleString()} ر.س</td>
                    <td className="px-4 py-3"><StatusPill tone={paymentTone(p.status)}>{p.status}</StatusPill></td>
                    <td className="px-4 py-3">
                      {p.status !== "مدفوع" && (
                        <button onClick={() => handlePay(p.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> تسجيل
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SumCard({ label, value, tone, bg }: { label: string; value: number; tone: string; bg: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${tone}`}>{value.toLocaleString()} <span className="text-base">ر.س</span></div>
    </div>
  );
}
