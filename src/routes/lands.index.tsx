import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Map as MapIcon } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { AttachmentsButton } from "@/components/attachments-panel";
import { ExportCsvButton } from "@/components/export-csv-button";
import { useAssetOptions } from "@/lib/asset-options";
import { AssetCard, CardsGrid } from "@/components/asset-card";

export const Route = createFileRoute("/lands/")({
  head: () => ({ meta: [{ title: "الأراضي | منصة الأصول" }] }),
  component: LandsList,
});

const INV = [["lands-list"], ["dashboard-totals"], ["asset-options"]];

function LandsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { employeeOpts, nameById } = useAssetOptions();
  const { data = [] } = useQuery(queryOptions({
    queryKey: ["lands-list"],
    queryFn: async () => (await supabase.from("lands" as any).select("*").eq("archived", false).order("created_at", { ascending: false })).data ?? [],
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
    { name: "current_value", label: "القيمة الحالية (تقييم)", type: "number" },
    { name: "purchase_date", label: "تاريخ الشراء", type: "date" },
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "متاحة", label: "متاحة" }, { value: "مباعة", label: "مباعة" }, { value: "مرهونة", label: "مرهونة" }, { value: "قيد التطوير", label: "قيد التطوير" },
    ]},
    { name: "notes", label: "ملاحظات", type: "textarea" },
  ], [employeeOpts]);

  const filtered = useMemo(() => {
    let r = data as any[];
    if (search) { const s = search.toLowerCase(); r = r.filter(v => v.name?.toLowerCase().includes(s) || v.deed_number?.toLowerCase().includes(s) || v.city?.toLowerCase().includes(s)); }
    if (status) r = r.filter(v => v.status === status);
    return r;
  }, [data, search, status]);

  return (
    <DashboardLayout title="الأراضي" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><MapIcon className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: [
          { value: "متاحة", label: "متاحة" }, { value: "مباعة", label: "مباعة" }, { value: "مرهونة", label: "مرهونة" }, { value: "قيد التطوير", label: "قيد التطوير" },
        ]}]}
      >
        <ExportCsvButton rows={filtered} filename="lands" columns={[
          { key: "name", label: "الأرض" }, { key: "deed_number", label: "رقم الصك" },
          { key: "city", label: "المدينة" }, { key: "area_sqm", label: "المساحة" },
          { key: "current_value", label: "القيمة الحالية" }, { key: "status", label: "الحالة" },
        ]} />
        <RecordDialog table="lands" title="إضافة أرض" fields={FIELDS} invalidate={INV} />
      </ListToolbar>

      <CardsGrid empty={filtered.length === 0}>
        {filtered.map((v: any) => (
          <AssetCard
            key={v.id}
            to="/lands/$id"
            params={{ id: v.id }}
            hero={
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-emerald-100 via-green-50 to-lime-50">
                <MapIcon className="h-16 w-16 text-emerald-600/50" />
              </div>
            }
            title={v.name}
            subtitle={[v.city, v.region].filter(Boolean).join(" — ") || v.ownership_type || "—"}
            statusLabel={v.status}
            statusTone={v.status === "متاحة" ? "success" : v.status === "مرهونة" ? "warning" : v.status === "مباعة" ? "muted" : "info"}
            stats={[
              { label: "رقم الصك", value: v.deed_number ?? "—" },
              { label: "المساحة", value: v.area_sqm ? `${Number(v.area_sqm).toLocaleString()} م²` : "—" },
              { label: "المسؤول", value: v.responsible_employee_id ? nameById[v.responsible_employee_id] ?? "—" : "—" },
              { label: "القيمة", value: v.current_value ? `${Number(v.current_value).toLocaleString()} ر.س` : "—" },
            ]}
            actions={
              <div className="flex gap-1">
                <AttachmentsButton entityType="land" entityId={v.id} />
                <RecordDialog table="lands" title="تعديل الأرض" fields={FIELDS} initial={v} invalidate={INV} />
                <DeleteButton table="lands" id={v.id} invalidate={INV} />
              </div>
            }
          />
        ))}
      </CardsGrid>
    </DashboardLayout>
  );
}
