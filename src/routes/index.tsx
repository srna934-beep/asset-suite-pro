import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill, propertyTone, unitTone, paymentTone } from "@/components/status-pill";
import { getDashboardData, refreshLatePayments } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign, AlertCircle, Building2, Home, Users, CalendarClock, Plus, Building, BellRing,
  Car, Map, UserCog, ListChecks, Wallet, TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

const dashboardQuery = queryOptions({
  queryKey: ["dashboard"],
  queryFn: getDashboardData,
});

const totalsQuery = queryOptions({
  queryKey: ["dashboard-totals"],
  queryFn: async () => ((await supabase.rpc("dashboard_totals" as any)).data ?? {}) as any,
});

const expiringQuery = queryOptions({
  queryKey: ["expiring-assets"],
  queryFn: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const end = in30.toISOString().slice(0, 10);
    const [{ data: v1 }, { data: v2 }, { data: ec }] = await Promise.all([
      supabase.from("vehicles" as any).select("id,name,plate_number,insurance_expiry").gte("insurance_expiry", today).lte("insurance_expiry", end),
      supabase.from("vehicles" as any).select("id,name,plate_number,license_expiry").gte("license_expiry", today).lte("license_expiry", end),
      supabase.from("employment_contracts" as any).select("id,end_date,employee_id").gte("end_date", today).lte("end_date", end).eq("status", "نشط"),
    ]);
    return { insurance: (v1 ?? []) as any[], license: (v2 ?? []) as any[], empContracts: (ec ?? []) as any[] };
  },
});


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | إدارة الأملاك" },
      { name: "description", content: "نظرة شاملة على العقارات والوحدات والدفعات" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(dashboardQuery);
  const { data: totals } = useQuery(totalsQuery);
  const { data: expiring } = useQuery(expiringQuery);


  useEffect(() => {
    refreshLatePayments().then(() => qc.invalidateQueries({ queryKey: ["dashboard"] }));
  }, [qc]);

  if (isLoading || !data) return <LoadingShell />;

  const t: any = totals ?? {};

  const { properties, units, tenants, contracts, payments } = data;
  const propsById = Object.fromEntries(properties.map((p) => [p.id, p]));
  const unitsById = Object.fromEntries(units.map((u) => [u.id, u]));
  const tenantsById = Object.fromEntries(tenants.map((t) => [t.id, t]));
  const contractsById = Object.fromEntries(contracts.map((c) => [c.id, c]));

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().slice(0, 10);
  const thisMonthPayments = payments.filter((p) => p.due_date >= monthStart && p.due_date < monthEnd);
  const paidThisMonth = thisMonthPayments.filter((p) => p.status === "مدفوع").reduce((s, p) => s + Number(p.amount), 0);
  const lateTotal = payments.filter((p) => p.status === "متأخر").reduce((s, p) => s + Number(p.amount), 0);
  const unpaidTotal = payments.filter((p) => p.status === "غير مدفوع").reduce((s, p) => s + Number(p.amount), 0);
  const monthlyIncome = contracts.filter((c) => c.status === "نشط").reduce((s, c) => s + Number(c.monthly_rent), 0);

  // Expiring contracts in next 60 days
  const in60 = new Date(today); in60.setDate(in60.getDate() + 60);
  const expiringContracts = contracts.filter(
    (c) => c.status === "نشط" && new Date(c.end_date) <= in60 && new Date(c.end_date) >= today,
  );

  const latePayments = payments.filter((p) => p.status === "متأخر").slice(0, 5);

  const statCards = [
    { label: "إجمالي الدخل الشهري", value: `${monthlyIncome.toLocaleString()} ر.س`, icon: DollarSign, tint: "bg-stat-income", iconBg: "bg-emerald-500", text: "text-emerald-700", to: "/payments" as const },
    { label: "إجمالي المتأخرات", value: `${lateTotal.toLocaleString()} ر.س`, icon: AlertCircle, tint: "bg-stat-late", iconBg: "bg-rose-500", text: "text-rose-700", to: "/payments" as const },
    { label: "عدد العقارات", value: properties.length, icon: Building2, tint: "bg-stat-properties", iconBg: "bg-sky-500", text: "text-sky-700", to: "/properties" as const },
    { label: "عدد الوحدات", value: units.length, icon: Home, tint: "bg-stat-units", iconBg: "bg-amber-500", text: "text-amber-700", to: "/units" as const },
    { label: "عدد المستأجرين", value: tenants.length, icon: Users, tint: "bg-stat-tenants", iconBg: "bg-violet-500", text: "text-violet-700", to: "/tenants" as const },
    { label: "العقود التي ستنتهي قريباً", value: expiringContracts.length, icon: CalendarClock, tint: "bg-stat-contracts", iconBg: "bg-emerald-600", text: "text-emerald-700", to: "/contracts" as const },
  ];

  const quickAccess = [
    { to: "/properties" as const, label: "العقارات", icon: Building2, color: "bg-sky-100 text-sky-700" },
    { to: "/vehicles" as const, label: "المركبات", icon: Car, color: "bg-emerald-100 text-emerald-700" },
    { to: "/lands" as const, label: "الأراضي", icon: Map, color: "bg-amber-100 text-amber-700" },
    { to: "/employees" as const, label: "الموظفين", icon: UserCog, color: "bg-violet-100 text-violet-700" },
    { to: "/accounts" as const, label: "الحسابات", icon: Wallet, color: "bg-rose-100 text-rose-700" },
    { to: "/tasks" as const, label: "المهام", icon: ListChecks, color: "bg-indigo-100 text-indigo-700" },
  ];

  return (
    <DashboardLayout
      title="منصة إدارة الأصول والأعمال"
      icon={
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Building className="h-6 w-6" />
        </div>
      }
    >
      {latePayments.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <BellRing className="h-5 w-5 shrink-0 text-rose-600" />
          <div className="min-w-0 flex-1 text-sm leading-relaxed">
            <span className="font-bold text-rose-700">تنبيه: </span>
            <span className="text-rose-700">
              يوجد {latePayments.length} دفعات متأخرة بإجمالي {lateTotal.toLocaleString()} ر.س — راجع قسم الدفعات لاتخاذ الإجراء.
            </span>
          </div>
        </div>
      )}

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-muted-foreground">لوحة التحكم</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.label} to={c.to} className={`${c.tint} relative overflow-hidden rounded-2xl border border-border/60 p-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5`}>
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.iconBg} text-white shadow`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-3 text-[12px] font-medium text-foreground/70">{c.label}</div>
                <div className={`mt-1 text-xl font-extrabold ${c.text}`}>{c.value}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile icon={Building2} label="إجمالي العقارات" value={t.properties_count ?? properties.length} tint="bg-sky-50 text-sky-700 border-sky-200" />
        <SummaryTile icon={Car} label="إجمالي المركبات" value={t.vehicles_count ?? 0} tint="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <SummaryTile icon={Map} label="إجمالي الأراضي" value={t.lands_count ?? 0} tint="bg-amber-50 text-amber-700 border-amber-200" />
        <SummaryTile icon={UserCog} label="إجمالي الموظفين" value={t.employees_count ?? 0} tint="bg-violet-50 text-violet-700 border-violet-200" />
        <SummaryTile icon={TrendingUp} label="قيمة الأصول (مركبات+أراضي)" value={`${Number(t.assets_value ?? 0).toLocaleString()} ر.س`} tint="bg-primary/5 text-primary border-primary/30" />
        <SummaryTile icon={DollarSign} label="إجمالي الإيرادات" value={`${Number(t.revenue_total ?? 0).toLocaleString()} ر.س`} tint="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <SummaryTile icon={AlertCircle} label="إجمالي المصاريف" value={`${Number(t.expense_total ?? 0).toLocaleString()} ر.س`} tint="bg-rose-50 text-rose-700 border-rose-200" />
        <SummaryTile icon={ListChecks} label="مهام مفتوحة" value={t.open_tasks ?? 0} tint="bg-indigo-50 text-indigo-700 border-indigo-200" />
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-muted-foreground">الوصول السريع</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {quickAccess.map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.to} to={q.to} className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-4 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${q.color}`}><Icon className="h-5 w-5" /></div>
                <div className="mt-2 text-xs font-bold">{q.label}</div>
              </Link>
            );
          })}
        </div>
      </section>


      <Section title="العقارات" icon={<Building2 className="h-5 w-5 text-primary" />}>
        <Table headers={["اسم العقار", "النوع", "الموقع", "عدد الوحدات", "إجمالي الدخل الشهري", "الحالة"]}>
          {properties.map((p) => {
            const propUnits = units.filter((u) => u.property_id === p.id);
            const income = contracts.filter((c) => c.status === "نشط" && propUnits.some((u) => u.id === c.unit_id))
              .reduce((s, c) => s + Number(c.monthly_rent), 0);
            return (
              <tr key={p.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link to="/properties/$id" params={{ id: p.id }} className="font-semibold text-primary hover:underline">{p.name}</Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.location ?? "—"}</td>
                <td className="px-4 py-3 font-semibold">{propUnits.length}</td>
                <td className="px-4 py-3 font-semibold">{income ? `${income.toLocaleString()} ر.س` : "—"}</td>
                <td className="px-4 py-3"><StatusPill tone={propertyTone(p.status)}>{p.status}</StatusPill></td>
              </tr>
            );
          })}
        </Table>
      </Section>

      <Section title="الوحدات" icon={<Home className="h-5 w-5 text-amber-600" />}>
        <Table headers={["العقار", "الوحدة", "النوع", "الإيجار الشهري", "الحالة", "المستأجر"]}>
          {units.slice(0, 8).map((u) => {
            const contract = contracts.find((c) => c.unit_id === u.id && c.status === "نشط");
            const tenant = contract ? tenantsById[contract.tenant_id] : null;
            return (
              <tr key={u.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link to="/properties/$id" params={{ id: u.property_id }} className="font-semibold text-primary hover:underline">
                    {propsById[u.property_id]?.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link to="/units/$id" params={{ id: u.id }} className="font-medium text-primary hover:underline">{u.unit_number}</Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.type}</td>
                <td className="px-4 py-3 font-semibold">{Number(u.rent_amount).toLocaleString()} ر.س</td>
                <td className="px-4 py-3"><StatusPill tone={unitTone(u.status)}>{u.status}</StatusPill></td>
                <td className="px-4 py-3">{tenant?.full_name ?? "—"}</td>
              </tr>
            );
          })}
        </Table>
      </Section>

      <Section title="الدفعات الأخيرة" icon={<DollarSign className="h-5 w-5 text-emerald-600" />}>
        <Table headers={["الحالة", "تاريخ الاستحقاق", "العقار", "المبلغ", "المستأجر", "الوحدة"]}>
          {payments.slice(0, 8).map((p) => {
            const contract = contractsById[p.contract_id];
            const unit = contract ? unitsById[contract.unit_id] : null;
            const property = unit ? propsById[unit.property_id] : null;
            const tenant = contract ? tenantsById[contract.tenant_id] : null;
            return (
              <tr key={p.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3"><StatusPill tone={paymentTone(p.status)}>{p.status}</StatusPill></td>
                <td className="px-4 py-3 text-muted-foreground">{p.due_date}</td>
                <td className="px-4 py-3 font-medium">{property?.name ?? "—"}</td>
                <td className="px-4 py-3 font-semibold">{Number(p.amount).toLocaleString()} ر.س</td>
                <td className="px-4 py-3">{tenant?.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{unit?.unit_number ?? "—"}</td>
              </tr>
            );
          })}
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3 text-xs sm:text-sm">
          <div className="flex flex-wrap gap-4">
            <Totals label="إجمالي المدفوع هذا الشهر" value={`${paidThisMonth.toLocaleString()} ر.س`} tone="text-emerald-600" />
            <Totals label="إجمالي المتأخرات" value={`${lateTotal.toLocaleString()} ر.س`} tone="text-rose-600" />
            <Totals label="غير مدفوع" value={`${unpaidTotal.toLocaleString()} ر.س`} tone="text-amber-600" />
          </div>
          <Link to="/payments" className="font-semibold text-primary hover:underline">عرض كل الدفعات ←</Link>
        </div>
      </Section>

      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-center text-sm leading-relaxed text-foreground/80">
        جميع الجداول مرتبطة بقاعدة البيانات تلقائياً — البيانات تتحدث مباشرة عند إضافة عقار أو وحدة أو تسجيل دفعة.
      </div>
    </DashboardLayout>
  );
}

function SummaryTile({ icon: Icon, label, value, tint }: { icon: any; label: string; value: any; tint: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${tint}`}>
      <div className="flex items-center gap-2 text-xs font-bold opacity-90"><Icon className="h-4 w-4" /> {label}</div>
      <div className="mt-2 text-xl font-extrabold">{value}</div>
    </div>
  );
}


function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">{icon}<h3 className="text-base font-extrabold">{title}</h3></div>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary">
          <Plus className="h-3.5 w-3.5" /> جديد
        </button>
      </header>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <table className="w-full min-w-[640px] text-right text-sm">
      <thead>
        <tr className="bg-muted/40 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
          {headers.map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Totals({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="flex items-center gap-1.5"><span className="text-muted-foreground">{label}:</span><span className={`font-bold ${tone}`}>{value}</span></div>;
}

function LoadingShell() {
  return (
    <DashboardLayout title="إدارة الأملاك">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="mt-6 h-64 animate-pulse rounded-2xl border border-border bg-card" />
    </DashboardLayout>
  );
}
