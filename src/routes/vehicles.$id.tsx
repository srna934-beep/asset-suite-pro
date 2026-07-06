import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Car, Calendar, User } from "lucide-react";
import { AssetFinanceTabs, Section, BackNav, AssetDocsAndActivity } from "@/components/asset-detail";
import { RecordDialog } from "@/components/record-dialog";
import { useAssetOptions } from "@/lib/asset-options";
import { useMemo } from "react";
import type { FieldDef } from "@/components/record-dialog";

export const Route = createFileRoute("/vehicles/$id")({
  head: ({ params }) => ({ meta: [{ title: `تفاصيل المركبة | ${params.id.slice(0, 8)}` }] }),
  component: VehicleDetail,
});

function VehicleDetail() {
  const { id } = Route.useParams();
  const { employeeOpts, nameById } = useAssetOptions();
  const { data: v } = useQuery(queryOptions({
    queryKey: ["vehicle", id],
    queryFn: async () => (await supabase.from("vehicles" as any).select("*").eq("id", id).maybeSingle()).data as any,
  }));

  const FIELDS: FieldDef[] = useMemo(() => [
    { name: "name", label: "اسم/وصف المركبة", required: true },
    { name: "vehicle_type", label: "النوع", type: "select", options: [
      { value: "سيارة", label: "سيارة" }, { value: "شاحنة", label: "شاحنة" },
      { value: "حافلة", label: "حافلة" }, { value: "دراجة نارية", label: "دراجة نارية" },
      { value: "معدة", label: "معدة" },
    ]},
    { name: "brand", label: "الماركة" }, { name: "model", label: "الموديل" },
    { name: "year", label: "سنة الصنع", type: "number" },
    { name: "plate_number", label: "رقم اللوحة" }, { name: "chassis_number", label: "رقم الهيكل" },
    { name: "driver_name", label: "اسم السائق" }, { name: "driver_phone", label: "جوال السائق" },
    { name: "responsible_employee_id", label: "المسؤول عن الأصل (موظف)", type: "select", options: employeeOpts },
    { name: "purchase_value", label: "قيمة الشراء", type: "number" },
    { name: "current_value", label: "القيمة الحالية", type: "number" },
    { name: "purchase_date", label: "تاريخ الشراء", type: "date" },
    { name: "insurance_company", label: "شركة التأمين" },
    { name: "insurance_expiry", label: "انتهاء التأمين", type: "date" },
    { name: "license_expiry", label: "انتهاء الاستمارة", type: "date" },
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "نشط", label: "نشط" }, { value: "صيانة", label: "صيانة" }, { value: "متوقف", label: "متوقف" },
    ]},
    { name: "notes", label: "ملاحظات", type: "textarea" },
  ], [employeeOpts]);

  if (!v) return <DashboardLayout title="..."><div className="h-64 animate-pulse rounded-2xl bg-card" /></DashboardLayout>;

  return (
    <DashboardLayout title={v.name} icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Car className="h-6 w-6" /></div>}>
      <BackNav links={[
        { to: "/", label: "لوحة التحكم" },
        { to: "/vehicles", label: "المركبات" },
        { to: "/vehicles/$id", params: { id }, label: v.name },
      ]} />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid h-56 place-items-center bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50"><Car className="h-24 w-24 text-sky-500/40" /></div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <Info label="النوع" value={v.vehicle_type ?? "—"} />
            <Info label="رقم اللوحة" value={v.plate_number ?? "—"} />
            <Info label="الماركة" value={v.brand ?? "—"} />
            <Info label="الموديل" value={v.model ?? "—"} />
            <Info label="سنة الصنع" value={v.year ?? "—"} />
            <Info label="السائق" value={v.driver_name ?? "—"} />
            <Info label="القيمة الحالية" value={v.current_value ? `${Number(v.current_value).toLocaleString()} ر.س` : "—"} />
            <Info label="الحالة" value={<StatusPill tone={v.status === "نشط" ? "success" : v.status === "صيانة" ? "info" : "muted"}>{v.status}</StatusPill>} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-muted-foreground"><User className="h-4 w-4" /> المسؤول عن الأصل</div>
            <div className="text-lg font-extrabold">{v.responsible_employee_id ? (nameById[v.responsible_employee_id] ?? "—") : "غير محدد"}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-muted-foreground"><Calendar className="h-4 w-4" /> التأمين والاستمارة</div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">شركة التأمين</span><span className="font-medium">{v.insurance_company ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">انتهاء التأمين</span><span className="font-medium">{v.insurance_expiry ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">انتهاء الاستمارة</span><span className="font-medium">{v.license_expiry ?? "—"}</span></div>
            </div>
          </div>
          <RecordDialog table="vehicles" title="تعديل المركبة" fields={FIELDS} initial={v} invalidate={[["vehicle", id], ["vehicles-list"]]} />
        </div>
      </div>

      <AssetFinanceTabs assetType="vehicle" assetId={id} responsibleEmployeeId={v.responsible_employee_id} />

      <div className="mt-5">
        <AssetDocsAndActivity entityType="vehicle" entityId={id} />
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
