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
      const [p, u, t, c, pay, m, exp] = await Promise.all([
        supabase.from("properties").select("id,status"),
        supabase.from("units").select("id,status,property_id"),
        supabase.from("tenants").select("id"),
        supabase.from("contracts").select("id,status,monthly_rent"),
        supabase.from("payments").select("id,amount,status"),
        supabase.from("maintenance_requests").select("id,cost,status"),
        (supabase as any).from("expenses").select("amount"),
      ]);
      return {
        props: p.data ?? [], units: u.data ?? [], tenants: t.data ?? [],
        contracts: c.data ?? [], payments: pay.data ?? [],
        maint: m.data ?? [], expenses: exp.data ?? [],
      };
    },
  }));
  const d: any = data ?? {};
  const props = d.props ?? []; const units = d.units ?? []; const contracts = d.contracts ?? [];
  const payments = d.payments ?? []; const maint = d.maint ?? []; const expenses = d.expenses ?? [];
  const occupied = units.filter((x: any) => x.status === "مؤجرة" || x.status === "مشغولة").length;
  const available = units.filter((x: any) => x.status === "متاحة" || x.status === "شاغرة").length;
  const activeC = contracts.filter((x: any) => x.status === "نشط").length;
  const expiredC = contracts.filter((x: any) => x.status === "منتهي").length;
  const revenue = payments.filter((x: any) => x.status === "مدفوع").reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const outstanding = payments.filter((x: any) => x.status !== "مدفوع").reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const maintCost = maint.reduce((s: number, x: any) => s + Number(x.cost || 0), 0);
  const expensesTotal = expenses.reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const net = revenue - expensesTotal - maintCost;
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
          <StatCard label="الإيرادات" value={fmtSAR(revenue)} tone="success" icon={<DollarSign className="h-5 w-5" />} />
          <StatCard label="المستحقات" value={fmtSAR(outstanding)} tone="danger" />
          <StatCard label="تكلفة الصيانة" value={fmtSAR(maintCost)} tone="warning" icon={<Wrench className="h-5 w-5" />} />
          <StatCard label="إجمالي المصروفات" value={fmtSAR(expensesTotal)} tone="warning" />
          <StatCard label="صافي الربح" value={fmtSAR(net)} tone={net >= 0 ? "success" : "danger"} />
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
