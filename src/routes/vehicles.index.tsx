import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Car, Eye } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { AttachmentsButton } from "@/components/attachments-panel";
import { ExportCsvButton } from "@/components/export-csv-button";
import { useAssetOptions } from "@/lib/asset-options";
import { Button } from "@/components/ui/button";

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
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">المركبة</th><th className="px-4 py-3">اللوحة</th>
              <th className="px-4 py-3">الماركة/الموديل</th>
              <th className="px-4 py-3">المسؤول</th>
              <th className="px-4 py-3">انتهاء التأمين</th>
              <th className="px-4 py-3">القيمة الحالية</th><th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((v: any) => (
                <tr key={v.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold"><Link to="/vehicles/$id" params={{ id: v.id }} className="text-primary hover:underline">{v.name}</Link></td>
                  <td className="px-4 py-3">{v.plate_number ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{[v.brand, v.model, v.year].filter(Boolean).join(" ")}</td>
                  <td className="px-4 py-3">{v.responsible_employee_id ? nameById[v.responsible_employee_id] ?? "—" : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.insurance_expiry ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{v.current_value ? `${Number(v.current_value).toLocaleString()} ر.س` : "—"}</td>
                  <td className="px-4 py-3"><StatusPill tone={v.status === "نشط" ? "success" : v.status === "صيانة" ? "info" : "muted"}>{v.status}</StatusPill></td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <Link to="/vehicles/$id" params={{ id: v.id }}><Button size="sm" variant="outline" title="عرض التفاصيل"><Eye className="h-3.5 w-3.5" /></Button></Link>
                    <AttachmentsButton entityType="vehicle" entityId={v.id} />
                    <RecordDialog table="vehicles" title="تعديل المركبة" fields={FIELDS} initial={v} invalidate={INV} />
                    <DeleteButton table="vehicles" id={v.id} invalidate={INV} />
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">لا توجد مركبات. أضف أول مركبة باستخدام الزر أعلاه.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
