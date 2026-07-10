import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, DashGrid, Section, fmtSAR } from "@/components/dash-bits";
import { Building2, Home, Users, FileText, DollarSign, Wrench, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/properties-dashboard/")({
  head: () => ({ meta: [{ title: "لوحة العقارات" }] }),
  component: PropertiesDashboard,
});

function PropertiesDashboard() {
  const { data } = useQuery(queryOptions({
    queryKey: ["dash-props"],
    queryFn: async () => {
      const [p, u, t, c, pay, m, txn] = await Promise.all([
        supabase.from("properties").select("id,status"),
        supabase.from("units").select("id,status,property_id"),
        supabase.from("tenants").select("id"),
        supabase.from("contracts").select("id,status,monthly_rent"),
        supabase.from("payments").select("id,amount,status,paid_date,due_date"),
        supabase.from("maintenance_requests").select("id,cost,status,reported_at,completed_at,entity_type,property_id"),
        (supabase as any).from("transactions").select("amount,txn_type,txn_date,entity_type"),
      ]);
      return {
        props: p.data ?? [], units: u.data ?? [], tenants: t.data ?? [],
        contracts: c.data ?? [], payments: pay.data ?? [],
        maint: m.data ?? [], txns: txn.data ?? [],
      };
    },
  }));
  const d: any = data ?? {};
  const props = d.props ?? []; const units = d.units ?? []; const contracts = d.contracts ?? [];
  const payments = d.payments ?? []; const maint = d.maint ?? []; const txns = d.txns ?? [];
  const occupied = units.filter((x: any) => x.status === "مؤجرة" || x.status === "مشغولة").length;
  const available = units.filter((x: any) => x.status === "متاحة" || x.status === "شاغرة" || x.status === "فارغة").length;
  const activeC = contracts.filter((x: any) => x.status === "نشط").length;
  const expiredC = contracts.filter((x: any) => x.status === "منتهي").length;

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const inMonth = (dt?: string | null) => !!dt && dt.startsWith(ym);
  const sum = (arr: any[], f: (x: any) => number) => arr.reduce((s, x) => s + f(x), 0);
  const isProp = (x: any) => !x.entity_type || x.entity_type === "property" || !!x.property_id;

  // الإيجار الشهري: مجموع إيجارات العقود النشطة
  const monthlyRent = sum(contracts.filter((x: any) => x.status === "نشط"), (x) => Number(x.monthly_rent || 0));
  // المحصّل هذا الشهر
  const collected = sum(payments.filter((x: any) => x.status === "مدفوع" && inMonth(x.paid_date)), (x) => Number(x.amount || 0));
  // المتأخر
  const late = sum(payments.filter((x: any) => x.status === "متأخر" || (x.status === "غير مدفوع" && x.due_date && x.due_date < now.toISOString().slice(0, 10))), (x) => Number(x.amount || 0));
  // المصروفات هذا الشهر (من الحركات المالية + الصيانة فقط، بدون المصروفات المباشرة)
  const expensesMonth =
    sum(txns.filter((x: any) => x.txn_type === "مصروف" && x.entity_type === "property" && inMonth(x.txn_date)), (x) => Number(x.amount || 0)) +
    sum(maint.filter((x: any) => isProp(x) && (inMonth(x.completed_at) || inMonth(x.reported_at))), (x) => Number(x.cost || 0));
  // الصافي = المحصّل − المصروفات
  const net = collected - expensesMonth;
  // المجموع (كل ما مرّ على العقارات)
  const totalCollected = sum(payments.filter((x: any) => x.status === "مدفوع"), (x) => Number(x.amount || 0));
  const totalExpenses =
    sum(txns.filter((x: any) => x.txn_type === "مصروف" && x.entity_type === "property"), (x) => Number(x.amount || 0)) +
    sum(maint.filter(isProp), (x: any) => Number(x.cost || 0));
  const totalNet = totalCollected - totalExpenses;

  return (
    <DashboardLayout title="لوحة العقارات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-orange-700"><Building2 className="h-6 w-6" /></div>}>
      <div className="space-y-4">
        <DashGrid>
          <StatCard label="عدد العقارات" value={props.length} icon={<Building2 className="h-5 w-5 text-orange-600" />} />
          <StatCard label="إجمالي الوحدات" value={units.length} icon={<Home className="h-5 w-5" />} />
          <StatCard label="مؤجرة" value={occupied} tone="success" />
          <StatCard label="متاحة" value={available} tone="info" />
          <StatCard label="المستأجرين" value={(d.tenants ?? []).length} icon={<Users className="h-5 w-5" />} />
          <StatCard label="عقود نشطة" value={activeC} tone="success" icon={<FileText className="h-5 w-5" />} />
          <StatCard label="عقود منتهية" value={expiredC} tone="warning" />
          <StatCard label="الإيجار الشهري" value={fmtSAR(monthlyRent)} tone="info" icon={<DollarSign className="h-5 w-5" />} hint="من العقود النشطة" />
          <StatCard label="المحصّل هذا الشهر" value={fmtSAR(collected)} tone="success" />
          <StatCard label="المتأخر" value={fmtSAR(late)} tone="danger" />
          <StatCard label="مصروفات الشهر" value={fmtSAR(expensesMonth)} tone="warning" icon={<Wrench className="h-5 w-5" />} />
          <StatCard label="صافي الشهر" value={fmtSAR(net)} tone={net >= 0 ? "success" : "danger"} />
          <StatCard label="المجموع الكلي (صافي)" value={fmtSAR(totalNet)} tone={totalNet >= 0 ? "success" : "danger"} hint={`المحصّل ${fmtSAR(totalCollected)} - المصروفات ${fmtSAR(totalExpenses)}`} />
        </DashGrid>
        <Section title="روابط سريعة">
          <div className="flex flex-wrap gap-2">
            {[["/properties","العقارات"],["/units","الوحدات"],["/tenants","المستأجرين"],["/contracts","العقود"],["/payments","الدفعات"],["/maintenance","الصيانة"]].map(([to,l]) => (
              <Link key={to} to={to} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted">{l}<ArrowLeft className="h-3 w-3" /></Link>
            ))}
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}
