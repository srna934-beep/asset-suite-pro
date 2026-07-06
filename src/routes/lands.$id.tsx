import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Map as MapIcon, User, FileText } from "lucide-react";
import { AssetFinanceTabs, BackNav, AssetDocsAndActivity } from "@/components/asset-detail";
import { RecordDialog } from "@/components/record-dialog";
import { useAssetOptions } from "@/lib/asset-options";
import { useMemo } from "react";
import type { FieldDef } from "@/components/record-dialog";

export const Route = createFileRoute("/lands/$id")({
  head: ({ params }) => ({ meta: [{ title: `تفاصيل الأرض | ${params.id.slice(0, 8)}` }] }),
  component: LandDetail,
});

function LandDetail() {
  const { id } = Route.useParams();
  const { employeeOpts, nameById } = useAssetOptions();
  const { data: v } = useQuery(queryOptions({
    queryKey: ["land", id],
    queryFn: async () => (await supabase.from("lands" as any).select("*").eq("id", id).maybeSingle()).data as any,
  }));

  const FIELDS: FieldDef[] = useMemo(() => [
    { name: "name", label: "اسم/وصف الأرض", required: true },
    { name: "deed_number", label: "رقم الصك" },
    { name: "ownership_type", label: "نوع الملكية", type: "select", options: [
      { value: "ملك حر", label: "ملك حر" }, { value: "وقف", label: "وقف" }, { value: "حكر", label: "حكر" },
    ]},
    { name: "city", label: "المدينة" }, { name: "region", label: "المنطقة" },
    { name: "location", label: "الموقع التفصيلي" }, { name: "coordinates", label: "الإحداثيات" },
    { name: "area_sqm", label: "المساحة (م²)", type: "number" },
    { name: "responsible_employee_id", label: "المسؤول عن الأصل (موظف)", type: "select", options: employeeOpts },
    { name: "purchase_value", label: "قيمة الشراء", type: "number" },
    { name: "current_value", label: "القيمة الحالية", type: "number" },
    { name: "purchase_date", label: "تاريخ الشراء", type: "date" },
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "متاحة", label: "متاحة" }, { value: "مباعة", label: "مباعة" }, { value: "مرهونة", label: "مرهونة" }, { value: "قيد التطوير", label: "قيد التطوير" },
    ]},
    { name: "notes", label: "ملاحظات", type: "textarea" },
  ], [employeeOpts]);

  if (!v) return <DashboardLayout title="..."><div className="h-64 animate-pulse rounded-2xl bg-card" /></DashboardLayout>;

  return (
    <DashboardLayout title={v.name} icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><MapIcon className="h-6 w-6" /></div>}>
      <BackNav links={[
        { to: "/", label: "لوحة التحكم" },
        { to: "/lands", label: "الأراضي" },
        { to: "/lands/$id", params: { id }, label: v.name },
      ]} />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid h-56 place-items-center bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50"><MapIcon className="h-24 w-24 text-emerald-500/40" /></div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <Info label="رقم الصك" value={v.deed_number ?? "—"} />
            <Info label="نوع الملكية" value={v.ownership_type ?? "—"} />
            <Info label="المدينة" value={v.city ?? "—"} />
            <Info label="المنطقة" value={v.region ?? "—"} />
            <Info label="المساحة" value={v.area_sqm ? `${Number(v.area_sqm).toLocaleString()} م²` : "—"} />
            <Info label="القيمة الحالية" value={v.current_value ? `${Number(v.current_value).toLocaleString()} ر.س` : "—"} />
            <Info label="تاريخ الشراء" value={v.purchase_date ?? "—"} />
            <Info label="الحالة" value={<StatusPill tone={v.status === "متاحة" ? "success" : v.status === "مرهونة" ? "warning" : v.status === "مباعة" ? "muted" : "info"}>{v.status}</StatusPill>} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-muted-foreground"><User className="h-4 w-4" /> المسؤول عن الأصل</div>
            <div className="text-lg font-extrabold">{v.responsible_employee_id ? (nameById[v.responsible_employee_id] ?? "—") : "غير محدد"}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-muted-foreground"><FileText className="h-4 w-4" /> الموقع</div>
            <div className="text-sm text-muted-foreground">{v.location ?? "—"}</div>
            {v.coordinates && <div className="mt-1 text-xs text-muted-foreground">إحداثيات: {v.coordinates}</div>}
          </div>
          <RecordDialog table="lands" title="تعديل الأرض" fields={FIELDS} initial={v} invalidate={[["land", id], ["lands-list"]]} />
        </div>
      </div>

      <AssetFinanceTabs assetType="land" assetId={id} responsibleEmployeeId={v.responsible_employee_id} />

      <div className="mt-5">
        <AssetDocsAndActivity entityType="land" entityId={id} />
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
