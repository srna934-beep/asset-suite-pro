import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill, propertyTone, unitTone } from "@/components/status-pill";
import { getPropertyDetail } from "@/lib/db";
import { Building2, MapPin, Home, User, TrendingUp } from "lucide-react";
import { AssetFinanceTabs, BackNav, AssetDocsAndActivity, Section } from "@/components/asset-detail";
import { RecordDialog, type FieldDef } from "@/components/record-dialog";
import { useAssetOptions } from "@/lib/asset-options";

export const Route = createFileRoute("/properties/$id")({
  head: ({ params }) => ({ meta: [{ title: `تفاصيل العقار | ${params.id.slice(0, 8)}` }] }),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const { employeeOpts, nameById } = useAssetOptions();
  const { data, isLoading } = useQuery(
    queryOptions({ queryKey: ["property", id], queryFn: () => getPropertyDetail(id) }),
  );

  const FIELDS: FieldDef[] = useMemo(() => [
    { name: "name", label: "اسم العقار", required: true },
    { name: "type", label: "النوع", type: "select", required: true, options: [
      { value: "عمارة", label: "عمارة" }, { value: "فيلا", label: "فيلا" }, { value: "مجمع", label: "مجمع" },
      { value: "أرض", label: "أرض" }, { value: "محل", label: "محل" }, { value: "مكتب", label: "مكتب" },
    ]},
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "مؤجر", label: "مؤجر" }, { value: "خاصة", label: "خاصة" }, { value: "متاح", label: "متاح" },
    ]},
    { name: "responsible_employee_id", label: "المسؤول عن العقار (موظف)", type: "select", options: employeeOpts },
    { name: "location", label: "الموقع" },
    { name: "address", label: "العنوان" },
    { name: "description", label: "الوصف", type: "textarea" },
  ], [employeeOpts]);

  if (isLoading || !data) return <DashboardLayout title="جاري التحميل..."><div className="h-64 animate-pulse rounded-2xl bg-card" /></DashboardLayout>;
  if (!data.property) return <DashboardLayout title="غير موجود"><p>العقار غير موجود.</p></DashboardLayout>;

  const { property, units } = data;
  const p: any = property;
  const monthlyIncome = units.filter((u) => u.status === "مؤجرة").reduce((s, u) => s + Number(u.rent_amount), 0);
  const occupied = units.filter((u) => u.status === "مؤجرة").length;
  const occupancy = units.length ? Math.round((occupied / units.length) * 100) : 0;

  return (
    <DashboardLayout
      title={property.name}
      icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" /></div>}
    >
      <BackNav links={[
        { to: "/", label: "لوحة التحكم" },
        { to: "/properties", label: "العقارات" },
        { to: "/properties/$id", params: { id }, label: property.name },
      ]} />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid h-56 place-items-center bg-gradient-to-br from-primary/15 via-sky-100 to-amber-50">
            <Building2 className="h-24 w-24 text-primary/40" />
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <Info label="النوع" value={property.type} />
            <Info label="الحالة" value={<StatusPill tone={propertyTone(property.status)}>{property.status}</StatusPill>} />
            <Info label="الموقع" value={<span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{property.location ?? "—"}</span>} />
            <Info label="العنوان" value={p.address ?? "—"} />
            <Info label="الدخل الشهري" value={`${monthlyIncome.toLocaleString()} ر.س`} />
            <Info label="نسبة الإشغال" value={`${occupancy}% (${occupied}/${units.length})`} />
          </div>
          {property.description && <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-foreground/80">{property.description}</p>}
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-muted-foreground"><User className="h-4 w-4" /> المسؤول عن الأصل</div>
            <div className="text-lg font-extrabold">{p.responsible_employee_id ? (nameById[p.responsible_employee_id] ?? "—") : "غير محدد"}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-muted-foreground"><TrendingUp className="h-4 w-4" /> ملخص سريع</div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">إجمالي الوحدات</span><span className="font-bold">{units.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">المؤجرة</span><span className="font-bold text-emerald-600">{occupied}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الشاغرة</span><span className="font-bold text-amber-600">{units.length - occupied}</span></div>
            </div>
          </div>
          <RecordDialog table="properties" title="تعديل العقار" fields={FIELDS} initial={p} invalidate={[["property", id], ["properties-list"]]} />
        </div>
      </div>

      <Section title="الوحدات" icon={<Home className="h-5 w-5 text-amber-600" />}>
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">رقم الوحدة</th><th className="px-4 py-3">النوع</th>
            <th className="px-4 py-3">الإيجار</th><th className="px-4 py-3">الحالة</th>
          </tr></thead>
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
      </Section>

      <div className="mt-5">
        <AssetFinanceTabs assetType="property" assetId={id} responsibleEmployeeId={p.responsible_employee_id} />
      </div>

      <div className="mt-5">
        <AssetDocsAndActivity entityType="property" entityId={id} />
      </div>
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
