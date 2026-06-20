import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill, unitTone, paymentTone, contractTone } from "@/components/status-pill";
import { getUnitDetail, markPaymentPaid } from "@/lib/db";
import { Home, Building2, User, FileText, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/units/$id")({
  head: ({ params }) => ({ meta: [{ title: `تفاصيل الوحدة | ${params.id.slice(0, 8)}` }] }),
  component: UnitDetail,
});

function UnitDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(
    queryOptions({ queryKey: ["unit", id], queryFn: () => getUnitDetail(id) }),
  );

  if (isLoading || !data) return <DashboardLayout title="جاري التحميل..."><div className="h-64 animate-pulse rounded-2xl bg-card" /></DashboardLayout>;
  if (!data.unit) return <DashboardLayout title="غير موجود"><p>الوحدة غير موجودة.</p></DashboardLayout>;

  const { unit, property, contract, tenant, payments } = data;
  const totalPaid = payments.filter((p) => p.status === "مدفوع").reduce((s, p) => s + Number(p.amount), 0);
  const totalLate = payments.filter((p) => p.status === "متأخر").reduce((s, p) => s + Number(p.amount), 0);

  async function handlePay(pid: string) {
    await markPaymentPaid(pid);
    qc.invalidateQueries({ queryKey: ["unit", id] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  return (
    <DashboardLayout
      title={`الوحدة ${unit.unit_number}`}
      icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Home className="h-6 w-6" /></div>}
    >
      <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">لوحة التحكم</Link><span>/</span>
        {property && <><Link to="/properties/$id" params={{ id: property.id }} className="hover:text-primary">{property.name}</Link><span>/</span></>}
        <span className="font-medium text-foreground">الوحدة {unit.unit_number}</span>
      </nav>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid h-56 place-items-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
            <Home className="h-20 w-20 text-amber-500/40" />
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <Info label="رقم الوحدة" value={unit.unit_number} />
            <Info label="النوع" value={unit.type} />
            <Info label="الإيجار الشهري" value={`${Number(unit.rent_amount).toLocaleString()} ر.س`} />
            <Info label="الحالة" value={<StatusPill tone={unitTone(unit.status)}>{unit.status}</StatusPill>} />
            <Info label="المساحة" value={unit.area_sqm ? `${unit.area_sqm} م²` : "—"} />
            <Info label="الغرف" value={unit.bedrooms ?? "—"} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-muted-foreground"><User className="h-4 w-4" /> المستأجر الحالي</div>
            {tenant ? (
              <div>
                <div className="text-lg font-extrabold">{tenant.full_name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{tenant.phone ?? "—"} · {tenant.email ?? "—"}</div>
              </div>
            ) : <div className="text-sm text-muted-foreground">لا يوجد مستأجر</div>}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-muted-foreground"><FileText className="h-4 w-4" /> العقد</div>
            {contract ? (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">البداية</span><span className="font-medium">{contract.start_date}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">النهاية</span><span className="font-medium">{contract.end_date}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">القيمة</span><span className="font-bold">{Number(contract.monthly_rent).toLocaleString()} ر.س</span></div>
                <div className="pt-1"><StatusPill tone={contractTone(contract.status)}>{contract.status}</StatusPill></div>
              </div>
            ) : <div className="text-sm text-muted-foreground">لا يوجد عقد نشط</div>}
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h3 className="text-base font-extrabold">سجل الدفعات</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">المدفوع: <span className="font-bold text-emerald-600">{totalPaid.toLocaleString()} ر.س</span></span>
            <span className="text-muted-foreground">المتأخر: <span className="font-bold text-rose-600">{totalLate.toLocaleString()} ر.س</span></span>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">الاستحقاق</th><th className="px-4 py-3">تاريخ الدفع</th>
              <th className="px-4 py-3">المبلغ</th><th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">إجراء</th>
            </tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{p.due_date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.paid_date ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{Number(p.amount).toLocaleString()} ر.س</td>
                  <td className="px-4 py-3"><StatusPill tone={paymentTone(p.status)}>{p.status}</StatusPill></td>
                  <td className="px-4 py-3">
                    {p.status !== "مدفوع" && (
                      <button onClick={() => handlePay(p.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> تسجيل دفع
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">لا توجد دفعات</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardLayout>
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
