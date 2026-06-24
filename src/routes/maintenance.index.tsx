import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Wrench } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { ApprovalButtons } from "@/components/approval-buttons";
import { ExportCsvButton } from "@/components/export-csv-button";

export const Route = createFileRoute("/maintenance/")({
  head: () => ({ meta: [{ title: "الصيانة | إدارة الأملاك" }] }),
  component: MaintenanceList,
});

const INV = [["maintenance-list"]];

function MaintenanceList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data } = useQuery(queryOptions({
    queryKey: ["maintenance-list"],
    queryFn: async () => {
      const [{ data: rows }, { data: props }, { data: units }] = await Promise.all([
        supabase.from("maintenance_requests").select("*, properties(name), units(unit_number)").order("reported_at", { ascending: false }),
        supabase.from("properties").select("id, name"),
        supabase.from("units").select("id, unit_number"),
      ]);
      return { rows: (rows ?? []) as any[], props: props ?? [], units: units ?? [] };
    },
  }));
  const rows = data?.rows ?? [];
  const props = data?.props ?? [];
  const units = data?.units ?? [];

  const FIELDS: FieldDef[] = useMemo(() => [
    { name: "title", label: "العنوان", required: true },
    { name: "description", label: "الوصف", type: "textarea" },
    { name: "property_id", label: "العقار", type: "select",
      options: props.map((p: any) => ({ value: p.id, label: p.name })) },
    { name: "unit_id", label: "الوحدة", type: "select",
      options: units.map((u: any) => ({ value: u.id, label: u.unit_number })) },
    { name: "assigned_to", label: "الفني المسؤول" },
    { name: "cost", label: "التكلفة", type: "number" },
    { name: "priority", label: "الأولوية", type: "select", options: [
      { value: "منخفضة", label: "منخفضة" }, { value: "متوسطة", label: "متوسطة" }, { value: "عالية", label: "عالية" },
    ]},
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "جديد", label: "جديد" }, { value: "قيد التنفيذ", label: "قيد التنفيذ" }, { value: "مكتمل", label: "مكتمل" }, { value: "ملغي", label: "ملغي" },
    ]},
    { name: "reported_at", label: "تاريخ البلاغ", type: "date" },
  ], [props, units]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search) { const s = search.toLowerCase(); r = r.filter((x: any) => (x.title ?? "").toLowerCase().includes(s)); }
    if (status) r = r.filter((x: any) => x.status === status);
    return r;
  }, [rows, search, status]);

  return (
    <DashboardLayout title="الصيانة" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Wrench className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: [
          { value: "جديد", label: "جديد" }, { value: "قيد التنفيذ", label: "قيد التنفيذ" }, { value: "مكتمل", label: "مكتمل" }, { value: "ملغي", label: "ملغي" },
        ]}]}
      >
        <ExportCsvButton filename="maintenance" rows={filtered} columns={[
          { key: "title", label: "العنوان" }, { key: "assigned_to", label: "الفني" },
          { key: "cost", label: "التكلفة" }, { key: "status", label: "الحالة" }, { key: "reported_at", label: "التاريخ" },
        ]} />
        <RecordDialog table="maintenance_requests" title="طلب صيانة" fields={FIELDS} invalidate={INV} defaults={{ status: "جديد", priority: "متوسطة" }} />
      </ListToolbar>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">العنوان</th><th className="px-4 py-3">العقار</th>
              <th className="px-4 py-3">الوحدة</th><th className="px-4 py-3">الفني</th>
              <th className="px-4 py-3">التكلفة</th><th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((m: any) => (
                <tr key={m.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{m.title}</td>
                  <td className="px-4 py-3">{m.properties?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.units?.unit_number ?? "—"}</td>
                  <td className="px-4 py-3">{m.assigned_to ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{Number(m.cost ?? 0).toLocaleString()} ر.س</td>
                  <td className="px-4 py-3"><StatusPill tone={m.status === "مكتمل" ? "success" : m.status === "قيد التنفيذ" ? "info" : m.status === "ملغي" ? "danger" : "warning"}>{m.status}</StatusPill></td>
                  <td className="px-4 py-3 text-muted-foreground">{m.reported_at}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1">
                    <ApprovalButtons table="maintenance_requests" id={m.id} current={m.status} approveValue="مكتمل" rejectValue="ملغي" invalidate={INV} />
                    <RecordDialog table="maintenance_requests" title="تعديل طلب الصيانة" fields={FIELDS} initial={m} invalidate={INV} />
                    <DeleteButton table="maintenance_requests" id={m.id} invalidate={INV} />
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">لا توجد طلبات صيانة.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
