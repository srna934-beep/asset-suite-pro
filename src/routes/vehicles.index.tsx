import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Car } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { AttachmentsButton } from "@/components/attachments-panel";
import { ExportCsvButton } from "@/components/export-csv-button";
import { useAssetOptions } from "@/lib/asset-options";
import { AssetCard, CardsGrid } from "@/components/asset-card";

export const Route = createFileRoute("/vehicles/")({
  head: () => ({ meta: [{ title: "المركبات | منصة الأصول" }] }),
  component: VehiclesList,
});

const INV = [["vehicles-list"], ["dashboard-totals"], ["asset-options"]];

function VehiclesList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { employeeOpts, nameById } = useAssetOptions();
  const { data = [] } = useQuery(queryOptions({
    queryKey: ["vehicles-list"],
    queryFn: async () => (await supabase.from("vehicles" as any).select("*").eq("archived", false).order("created_at", { ascending: false })).data ?? [],
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

  const filtered = useMemo(() => {
    let r = data as any[];
    if (search) { const s = search.toLowerCase(); r = r.filter(v => v.name?.toLowerCase().includes(s) || v.plate_number?.toLowerCase().includes(s)); }
    if (status) r = r.filter(v => v.status === status);
    return r;
  }, [data, search, status]);

  return (
    <DashboardLayout title="المركبات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Car className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: [
          { value: "نشط", label: "نشط" }, { value: "صيانة", label: "صيانة" }, { value: "متوقف", label: "متوقف" },
        ]}]}
      >
        <ExportCsvButton rows={filtered} filename="vehicles" columns={[
          { key: "name", label: "المركبة" }, { key: "plate_number", label: "اللوحة" },
          { key: "brand", label: "الماركة" }, { key: "model", label: "الموديل" },
          { key: "driver_name", label: "السائق" }, { key: "insurance_expiry", label: "انتهاء التأمين" },
          { key: "current_value", label: "القيمة" }, { key: "status", label: "الحالة" },
        ]} />
        <RecordDialog table="vehicles" title="إضافة مركبة" fields={FIELDS} invalidate={INV} />
      </ListToolbar>

      <CardsGrid empty={filtered.length === 0}>
        {filtered.map((v: any) => (
          <AssetCard
            key={v.id}
            to="/vehicles/$id"
            params={{ id: v.id }}
            hero={
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-50">
                <Car className="h-16 w-16 text-sky-500/50" />
              </div>
            }
            title={v.name}
            subtitle={[v.brand, v.model, v.year].filter(Boolean).join(" ") || v.vehicle_type || "—"}
            statusLabel={v.status}
            statusTone={v.status === "نشط" ? "success" : v.status === "صيانة" ? "info" : "muted"}
            stats={[
              { label: "اللوحة", value: v.plate_number ?? "—" },
              { label: "السائق", value: v.driver_name ?? "—" },
              { label: "المسؤول", value: v.responsible_employee_id ? nameById[v.responsible_employee_id] ?? "—" : "—" },
              { label: "القيمة", value: v.current_value ? `${Number(v.current_value).toLocaleString()} ر.س` : "—" },
            ]}
            actions={
              <div className="flex gap-1">
                <AttachmentsButton entityType="vehicle" entityId={v.id} />
                <RecordDialog table="vehicles" title="تعديل المركبة" fields={FIELDS} initial={v} invalidate={INV} />
                <DeleteButton table="vehicles" id={v.id} invalidate={INV} />
              </div>
            }
          />
        ))}
      </CardsGrid>
    </DashboardLayout>
  );
}
