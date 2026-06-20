import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { properties, units, payments, stats, type PaymentStatus, type UnitStatus, type PropertyStatus } from "@/lib/mock-data";
import {
  DollarSign,
  AlertCircle,
  Building2,
  Home,
  Users,
  CalendarClock,
  Plus,
  Building,
} from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | إدارة الأملاك" },
      { name: "description", content: "نظرة شاملة على العقارات والوحدات والدفعات" },
    ],
  }),
  component: Dashboard,
});

const statCards = [
  { key: "income", label: "إجمالي الدخل الشهري", value: `${stats.monthlyIncome.toLocaleString()} $`, icon: DollarSign, tint: "bg-stat-income", iconBg: "bg-emerald-500", text: "text-emerald-700" },
  { key: "late", label: "إجمالي المتأخرات", value: `${stats.totalLate} $`, icon: AlertCircle, tint: "bg-stat-late", iconBg: "bg-rose-500", text: "text-rose-700" },
  { key: "props", label: "عدد العقارات", value: stats.propertiesCount, icon: Building2, tint: "bg-stat-properties", iconBg: "bg-sky-500", text: "text-sky-700" },
  { key: "units", label: "عدد الوحدات", value: stats.unitsCount, icon: Home, tint: "bg-stat-units", iconBg: "bg-amber-500", text: "text-amber-700" },
  { key: "tenants", label: "عدد المستأجرين", value: stats.tenantsCount, icon: Users, tint: "bg-stat-tenants", iconBg: "bg-violet-500", text: "text-violet-700" },
  { key: "contracts", label: "العقود التي ستنتهي قريباً", value: stats.expiringContracts, icon: CalendarClock, tint: "bg-stat-contracts", iconBg: "bg-emerald-600", text: "text-emerald-700" },
];

function Dashboard() {
  return (
    <DashboardLayout
      title="إدارة الأملاك"
      icon={
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Building className="h-6 w-6" />
        </div>
      }
    >
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-muted-foreground">لوحة التحكم</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statCards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.key}
                className={`${c.tint} relative overflow-hidden rounded-2xl border border-border/60 p-4 shadow-sm transition hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.iconBg} text-white shadow`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 text-[12px] font-medium text-foreground/70">{c.label}</div>
                <div className={`mt-1 text-xl font-extrabold ${c.text}`}>{c.value}</div>
              </div>
            );
          })}
        </div>
      </section>

      <Section title="العقارات" icon={<Building2 className="h-5 w-5 text-primary" />}>
        <Table headers={["اسم العقار", "النوع", "الموقع", "عدد الوحدات", "إجمالي الدخل الشهري", "الحالة"]}>
          {properties.map((p) => (
            <tr key={p.id} className="border-t border-border hover:bg-muted/40">
              <td className="px-4 py-3"><a className="font-semibold text-primary hover:underline" href="#">{p.name}</a></td>
              <td className="px-4 py-3 text-muted-foreground">{p.type}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.location}</td>
              <td className="px-4 py-3 font-semibold">{p.units}</td>
              <td className="px-4 py-3 font-semibold">{p.income ? `${p.income.toLocaleString()} $` : "—"}</td>
              <td className="px-4 py-3"><StatusPill status={p.status} /></td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="الوحدات" icon={<Home className="h-5 w-5 text-amber-600" />}>
        <Table headers={["العقار", "النوع", "الإيجار الشهري", "الحالة", "المستأجر"]}>
          {units.map((u) => (
            <tr key={u.id} className="border-t border-border hover:bg-muted/40">
              <td className="px-4 py-3"><a className="font-semibold text-primary hover:underline" href="#">{u.property}</a></td>
              <td className="px-4 py-3 text-muted-foreground">{u.type}</td>
              <td className="px-4 py-3 font-semibold">{u.rent} $</td>
              <td className="px-4 py-3"><UnitStatusPill status={u.status} /></td>
              <td className="px-4 py-3 font-medium">{u.tenant ?? "—"}</td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="الدفعات الأخيرة" icon={<DollarSign className="h-5 w-5 text-emerald-600" />}>
        <Table headers={["الحالة", "تاريخ", "العقار", "المبلغ", "المستأجر", "الشهر"]}>
          {payments.map((p) => (
            <tr key={p.id} className="border-t border-border hover:bg-muted/40">
              <td className="px-4 py-3"><PaymentStatusPill status={p.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
              <td className="px-4 py-3 font-medium">{p.property}</td>
              <td className="px-4 py-3 font-semibold">{p.amount} $</td>
              <td className="px-4 py-3">{p.tenant}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.month}</td>
            </tr>
          ))}
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3 text-xs sm:text-sm">
          <div className="flex flex-wrap gap-4">
            <Totals label="إجمالي المدفوع" value={`${stats.paidThisMonth.toLocaleString()} $`} tone="text-emerald-600" />
            <Totals label="إجمالي المتأخرات" value={`${stats.totalLateAll} $`} tone="text-rose-600" />
            <Totals label="مترلق عليّ" value={`${stats.owedTo} $`} tone="text-rose-600" />
          </div>
          <div className="text-muted-foreground">إجمالي هذا الشهر: <span className="font-bold text-foreground">1,900 $</span></div>
        </div>
      </Section>

      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-center text-sm leading-relaxed text-foreground/80">
        جميع الجداول مرتبطة مع بعضها (<span className="font-bold">Relations</span>) ويتم الحساب تلقائياً باستخدام (<span className="font-bold">Rollups</span>) للحصول على الدخل الإجمالي، المتأخرات، وعدد الوحدات وغيرها.
      </div>
    </DashboardLayout>
  );
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-base font-extrabold">{title}</h3>
        </div>
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
          {headers.map((h) => (
            <th key={h} className="px-4 py-3 font-bold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Totals({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-bold ${tone}`}>{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: PropertyStatus }) {
  const map: Record<PropertyStatus, string> = {
    "مؤجر": "bg-emerald-100 text-emerald-700",
    "خاصة": "bg-slate-100 text-slate-700",
    "متاح": "bg-sky-100 text-sky-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${map[status]}`}>{status}</span>;
}

function UnitStatusPill({ status }: { status: UnitStatus }) {
  const map: Record<UnitStatus, string> = {
    "مؤجرة": "bg-emerald-100 text-emerald-700",
    "فارغة": "bg-amber-100 text-amber-700",
    "صيانة": "bg-sky-100 text-sky-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${map[status]}`}>{status}</span>;
}

function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, string> = {
    "مدفوع": "bg-emerald-100 text-emerald-700",
    "متأخر": "bg-rose-100 text-rose-700",
    "غير مدفوع": "bg-rose-100 text-rose-700",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${map[status]}`}>{status}</span>;
}
