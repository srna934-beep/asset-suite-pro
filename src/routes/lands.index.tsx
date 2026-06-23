import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Map } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { AttachmentsButton } from "@/components/attachments-panel";
import { ExportCsvButton } from "@/components/export-csv-button";

export const Route = createFileRoute("/lands/")({
  head: () => ({ meta: [{ title: "الأراضي | منصة الأصول" }] }),
  component: LandsList,
});

const FIELDS: FieldDef[] = [
  { name: "name", label: "اسم/وصف الأرض", required: true },
  { name: "deed_number", label: "رقم الصك" },
  { name: "ownership_type", label: "نوع الملكية", type: "select", options: [
    { value: "ملك حر", label: "ملك حر" }, { value: "وقف", label: "وقف" }, { value: "حكر", label: "حكر" },
  ]},
  { name: "city", label: "المدينة" },
  { name: "region", label: "المنطقة" },
  { name: "location", label: "الموقع التفصيلي" },
  { name: "coordinates", label: "الإحداثيات (Lat,Lng)" },
  { name: "area_sqm", label: "المساحة (م²)", type: "number" },
  { name: "purchase_value", label: "قيمة الشراء", type: "number" },
  { name: "current_value", label: "القيمة الحالية (تقييم)", type: "number" },
  { name: "purchase_date", label: "تاريخ الشراء", type: "date" },
  { name: "status", label: "الحالة", type: "select", required: true, options: [
    { value: "متاحة", label: "متاحة" }, { value: "مباعة", label: "مباعة" }, { value: "مرهونة", label: "مرهونة" }, { value: "قيد التطوير", label: "قيد التطوير" },
  ]},
  { name: "notes", label: "ملاحظات", type: "textarea" },
];
const INV = [["lands-list"], ["dashboard-totals"]];

function LandsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data = [] } = useQuery(queryOptions({
    queryKey: ["lands-list"],
    queryFn: async () => (await supabase.from("lands" as any).select("*").eq("archived", false).order("created_at", { ascending: false })).data ?? [],
  }));
  const filtered = useMemo(() => {
    let r = data as any[];
    if (search) { const s = search.toLowerCase(); r = r.filter(v => v.name?.toLowerCase().includes(s) || v.deed_number?.toLowerCase().includes(s) || v.city?.toLowerCase().includes(s)); }
    if (status) r = r.filter(v => v.status === status);
    return r;
  }, [data, search, status]);

  return (
    <DashboardLayout title="الأراضي" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Map className="h-6 w-6" /></div>}>
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
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">الأرض</th><th className="px-4 py-3">رقم الصك</th>
              <th className="px-4 py-3">المدينة</th><th className="px-4 py-3">المساحة</th>
              <th className="px-4 py-3">قيمة الشراء</th><th className="px-4 py-3">القيمة الحالية</th>
              <th className="px-4 py-3">الحالة</th><th className="px-4 py-3">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((v: any) => (
                <tr key={v.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold">{v.name}</td>
                  <td className="px-4 py-3">{v.deed_number ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.city ?? "—"}</td>
                  <td className="px-4 py-3">{v.area_sqm ? `${Number(v.area_sqm).toLocaleString()} م²` : "—"}</td>
                  <td className="px-4 py-3">{v.purchase_value ? `${Number(v.purchase_value).toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3 font-semibold">{v.current_value ? `${Number(v.current_value).toLocaleString()} ر.س` : "—"}</td>
                  <td className="px-4 py-3"><StatusPill tone={v.status === "متاحة" ? "success" : v.status === "مرهونة" ? "warning" : v.status === "مباعة" ? "muted" : "info"}>{v.status}</StatusPill></td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <AttachmentsButton entityType="land" entityId={v.id} />
                    <RecordDialog table="lands" title="تعديل الأرض" fields={FIELDS} initial={v} invalidate={INV} />
                    <DeleteButton table="lands" id={v.id} invalidate={INV} />
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">لا توجد أراضي مسجلة.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
