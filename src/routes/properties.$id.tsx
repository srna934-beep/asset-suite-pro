import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill, unitTone, propertyTone } from "@/components/status-pill";
import { getPropertyDetail } from "@/lib/db";
import { Building2, MapPin, Home, Wrench, FileText, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/properties/$id")({
  head: ({ params }) => ({ meta: [{ title: `تفاصيل العقار | ${params.id.slice(0, 8)}` }] }),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery(
    queryOptions({ queryKey: ["property", id], queryFn: () => getPropertyDetail(id) }),
  );

  if (isLoading || !data) return <DashboardLayout title="جاري التحميل..."><div className="h-64 animate-pulse rounded-2xl bg-card" /></DashboardLayout>;
  if (!data.property) return <DashboardLayout title="غير موجود"><p>العقار غير موجود.</p></DashboardLayout>;

  const { property, units, expenses, maintenance } = data;
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthlyIncome = units.filter((u) => u.status === "مؤجرة").reduce((s, u) => s + Number(u.rent_amount), 0);
  const occupied = units.filter((u) => u.status === "مؤجرة").length;
  const occupancy = units.length ? Math.round((occupied / units.length) * 100) : 0;

  return (
    <DashboardLayout
      title={property.name}
      icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" /></div>}
    >
      <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">لوحة التحكم</Link>
        <span>/</span>
        <Link to="/properties" className="hover:text-primary">العقارات</Link>
        <span>/</span>
        <span className="font-medium text-foreground">{property.name}</span>
      </nav>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid h-64 place-items-center bg-gradient-to-br from-primary/10 via-sky-100 to-amber-50">
            <Building2 className="h-24 w-24 text-primary/40" />
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-extrabold">{property.name}</h2>
              <StatusPill tone={propertyTone(property.status)}>{property.status}</StatusPill>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {property.location ?? "—"}</span>
              <span className="inline-flex items-center gap-1.5"><Home className="h-4 w-4" /> {property.type}</span>
            </div>
            {property.description && <p className="mt-4 text-sm leading-relaxed text-foreground/80">{property.description}</p>}
          </div>
        </div>
        <div className="space-y-3">
          <StatTile label="الدخل الشهري" value={`${monthlyIncome.toLocaleString()} ر.س`} icon={TrendingUp} tone="bg-emerald-50 text-emerald-700" />
          <StatTile label="إجمالي المصاريف" value={`${totalExpenses.toLocaleString()} ر.س`} icon={TrendingDown} tone="bg-rose-50 text-rose-700" />
          <StatTile label="نسبة الإشغال" value={`${occupancy}% (${occupied}/${units.length})`} icon={Home} tone="bg-sky-50 text-sky-700" />
        </div>
      </div>

      <SectionCard title="الوحدات" icon={<Home className="h-5 w-5 text-amber-600" />}>
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead>
            <tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">رقم الوحدة</th><th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">الإيجار</th><th className="px-4 py-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-4 py-3"><Link to="/units/$id" params={{ id: u.id }} className="font-semibold text-primary hover:underline">{u.unit_number}</Link></td>
                <td className="px-4 py-3 text-muted-foreground">{u.type}</td>
                <td className="px-4 py-3 font-semibold">{Number(u.rent_amount).toLocaleString()} ر.س</td>
                <td className="px-4 py-3"><StatusPill tone={unitTone(u.status)}>{u.status}</StatusPill></td>
              </tr>
            ))}
            {units.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">لا توجد وحدات</td></tr>}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="المصاريف" icon={<DollarSign className="h-5 w-5 text-rose-600" />}>
        <table className="w-full min-w-[500px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">الفئة</th>
            <th className="px-4 py-3">الوصف</th><th className="px-4 py-3">المبلغ</th>
          </tr></thead>
          <tbody>
            {expenses.map((e: any) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted-foreground">{e.expense_date}</td>
                <td className="px-4 py-3 font-medium">{e.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.description ?? "—"}</td>
                <td className="px-4 py-3 font-semibold text-rose-600">{Number(e.amount).toLocaleString()} ر.س</td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">لا توجد مصاريف مسجلة</td></tr>}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="طلبات الصيانة" icon={<Wrench className="h-5 w-5 text-sky-600" />}>
        <table className="w-full min-w-[500px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">العنوان</th><th className="px-4 py-3">الفني</th>
            <th className="px-4 py-3">الحالة</th><th className="px-4 py-3">التكلفة</th>
          </tr></thead>
          <tbody>
            {maintenance.map((m: any) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{m.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.assigned_to ?? "—"}</td>
                <td className="px-4 py-3"><StatusPill tone={m.status === "مكتمل" ? "success" : m.status === "قيد التنفيذ" ? "info" : "warning"}>{m.status}</StatusPill></td>
                <td className="px-4 py-3 font-semibold">{Number(m.cost).toLocaleString()} ر.س</td>
              </tr>
            ))}
            {maintenance.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">لا توجد طلبات صيانة</td></tr>}
          </tbody>
        </table>
      </SectionCard>
    </DashboardLayout>
  );
}

function StatTile({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-border p-4 ${tone}`}>
      <Icon className="h-6 w-6 shrink-0" />
      <div className="min-w-0">
        <div className="text-xs font-medium opacity-80">{label}</div>
        <div className="truncate text-lg font-extrabold">{value}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex items-center gap-2 border-b border-border px-5 py-4">{icon}<h3 className="text-base font-extrabold">{title}</h3></header>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
