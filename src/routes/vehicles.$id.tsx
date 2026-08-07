import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Car, Calendar, User } from "lucide-react";
import { AssetFinanceTabs, Section, BackNav, AssetDocsAndActivity, StatMini } from "@/components/asset-detail";
import { AssetLedgerAndReport } from "@/components/money-table";
import { useEntityFinance } from "@/lib/entity-finance";
import { fmtSAR } from "@/components/dash-bits";
import { Fuel, Wrench, ShieldCheck } from "lucide-react";

import { RecordDialog } from "@/components/record-dialog";
import { useAssetOptions } from "@/lib/asset-options";
import { useAssetTypes } from "@/lib/asset-types";
import { QrButton } from "@/components/qr-card";
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

  const { options: typeOpts, typeName } = useAssetTypes("vehicle");

  const FIELDS: FieldDef[] = useMemo(() => [
    { name: "name", label: "اسم/وصف المركبة", required: true },
    { name: "type_id", label: "نوع المركبة/المعدة التفصيلي", type: "select", options: typeOpts },
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
    { name: "qr_code", label: "رمز الأصل (باركود)" },
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
  ], [employeeOpts, typeOpts]);

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
            <Info label="النوع التفصيلي" value={v.type_id ? typeName(v.type_id) : "غير محدد"} />
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
          <div className="flex gap-2">
            <RecordDialog table="vehicles" title="تعديل المركبة" fields={FIELDS} initial={v} invalidate={[["vehicle", id], ["vehicles-list"]]} />
            <QrButton path={`/vehicles/${id}`} title={v.name} subtitle={v.plate_number ?? typeName(v.type_id)} code={v.qr_code} />
          </div>
        </div>
      </div>

      <AssetFinanceTabs assetType="vehicle" assetId={id} responsibleEmployeeId={v.responsible_employee_id} />

      <div className="mt-5">
        <FuelAndOps id={id} />
      </div>

      <div className="mt-5">
        <AssetLedgerAndReport kind="vehicle" id={id} />
      </div>

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

/** الوقود والصيانة والتأمين — مشتقة من الحركات المالية للمركبة (مصدر واحد). */
function FuelAndOps({ id }: { id: string }) {
  const { rows } = useEntityFinance("vehicle");
  const mine = rows.filter((r) => r.entityId === id);
  const has = (r: any, ...keys: string[]) => keys.some((k) => String(r.label ?? "").includes(k));
  const fuel = mine.filter((r) => r.kind === "مصروف" && has(r, "وقود", "بنزين", "ديزل"));
  const maint = mine.filter((r) => r.kind === "مصروف" && (r.id.startsWith("m-") || has(r, "صيانة")));
  const insurance = mine.filter((r) => r.kind === "مصروف" && has(r, "تأمين"));
  const sum = (a: typeof mine) => a.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatMini label="مصروف الوقود" value={fmtSAR(sum(fuel))} icon={<Fuel className="h-5 w-5" />} tone="bg-amber-50 border-amber-200 text-amber-700" />
        <StatMini label="مصروف الصيانة" value={fmtSAR(sum(maint))} icon={<Wrench className="h-5 w-5" />} tone="bg-violet-50 border-violet-200 text-violet-700" />
        <StatMini label="مصروف التأمين" value={fmtSAR(sum(insurance))} icon={<ShieldCheck className="h-5 w-5" />} tone="bg-sky-50 border-sky-200 text-sky-700" />
      </div>
      <Section title="سجل الوقود" icon={<Fuel className="h-5 w-5 text-amber-600" />}>
        <table className="w-full min-w-[420px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">البيان</th><th className="px-4 py-3">المبلغ</th>
          </tr></thead>
          <tbody>
            {fuel.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted-foreground">{r.date ?? "—"}</td>
                <td className="px-4 py-3">{r.label}</td>
                <td className="px-4 py-3 font-bold text-rose-600">{fmtSAR(r.amount)}</td>
              </tr>
            ))}
            {fuel.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">لا توجد حركات وقود — أضف مصروفاً بتصنيف "وقود" مرتبطاً بهذه المركبة.</td></tr>}
          </tbody>
        </table>
      </Section>
    </div>
  );
}
