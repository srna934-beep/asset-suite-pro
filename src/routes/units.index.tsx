import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill, unitTone } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Home } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";

export const Route = createFileRoute("/units/")({
  head: () => ({ meta: [{ title: "الوحدات | إدارة الأملاك" }] }),
  component: UnitsList,
});

const INVALIDATE = [["units-list"], ["dashboard"], ["properties-list"]];

function UnitsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [propertyId, setPropertyId] = useState("");

  const { data } = useQuery(queryOptions({
    queryKey: ["units-list"],
    queryFn: async () => {
      const [{ data: units }, { data: properties }, { data: contracts }, { data: tenants }] = await Promise.all([
        supabase.from("units").select("*").order("unit_number"),
        supabase.from("properties").select("id, name"),
        supabase.from("contracts").select("id, unit_id, tenant_id, status"),
        supabase.from("tenants").select("id, full_name"),
      ]);
      return { units: units ?? [], properties: properties ?? [], contracts: contracts ?? [], tenants: tenants ?? [] };
    },
  }));

  const propOptions = (data?.properties ?? []).map((p: any) => ({ value: p.id, label: p.name }));
  const unitFields: FieldDef[] = [
    { name: "property_id", label: "العقار", type: "select", required: true, options: propOptions },
    { name: "unit_number", label: "رقم الوحدة", required: true },
    { name: "type", label: "النوع", type: "select", required: true, options: [
      { value: "شقة", label: "شقة" }, { value: "محل", label: "محل" }, { value: "مكتب", label: "مكتب" },
      { value: "مستودع", label: "مستودع" }, { value: "استوديو", label: "استوديو" },
    ]},
    { name: "rent_amount", label: "الإيجار الشهري (ر.س)", type: "number", required: true },
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "فارغة", label: "فارغة" }, { value: "مؤجرة", label: "مؤجرة" }, { value: "صيانة", label: "صيانة" },
    ]},
    { name: "area_sqm", label: "المساحة (م²)", type: "number" },
    { name: "bedrooms", label: "غرف النوم", type: "number" },
    { name: "bathrooms", label: "دورات المياه", type: "number" },
    { name: "notes", label: "ملاحظات", type: "textarea" },
  ];

  const filtered = useMemo(() => {
    let r = data?.units ?? [];
    if (search) { const s = search.toLowerCase(); r = r.filter((u: any) => u.unit_number?.toLowerCase().includes(s)); }
    if (status) r = r.filter((u: any) => u.status === status);
    if (propertyId) r = r.filter((u: any) => u.property_id === propertyId);
    return r;
  }, [data, search, status, propertyId]);

  return (
    <DashboardLayout title="الوحدات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Home className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[
          { value: status, onChange: setStatus, placeholder: "كل الحالات", options: [
            { value: "فارغة", label: "فارغة" }, { value: "مؤجرة", label: "مؤجرة" }, { value: "صيانة", label: "صيانة" },
          ]},
          { value: propertyId, onChange: setPropertyId, placeholder: "كل العقارات", options: propOptions },
        ]}
      >
        <RecordDialog table="units" title="إضافة وحدة جديدة" fields={unitFields} invalidate={INVALIDATE} />
      </ListToolbar>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">الوحدة</th><th className="px-4 py-3">العقار</th>
            <th className="px-4 py-3">النوع</th><th className="px-4 py-3">الإيجار</th>
            <th className="px-4 py-3">الحالة</th><th className="px-4 py-3">المستأجر</th>
            <th className="px-4 py-3">إجراءات</th>
          </tr></thead>
          <tbody>
            {filtered.map((u: any) => {
              const prop = data!.properties.find((p: any) => p.id === u.property_id);
              const contract = data!.contracts.find((c: any) => c.unit_id === u.id && c.status === "نشط");
              const tenant = contract ? data!.tenants.find((t: any) => t.id === contract.tenant_id) : null;
              return (
                <tr key={u.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3"><Link to="/units/$id" params={{ id: u.id }} className="font-semibold text-primary hover:underline">{u.unit_number}</Link></td>
                  <td className="px-4 py-3">{prop?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.type}</td>
                  <td className="px-4 py-3 font-semibold">{Number(u.rent_amount).toLocaleString()} ر.س</td>
                  <td className="px-4 py-3"><StatusPill tone={unitTone(u.status)}>{u.status}</StatusPill></td>
                  <td className="px-4 py-3">{tenant?.full_name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <RecordDialog table="units" title="تعديل الوحدة" fields={unitFields} initial={u} invalidate={INVALIDATE} />
                      <DeleteButton table="units" id={u.id} invalidate={INVALIDATE} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">لا توجد وحدات</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
