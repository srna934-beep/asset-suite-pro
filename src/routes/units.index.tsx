import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { unitTone } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Home } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { AssetCard, CardsGrid } from "@/components/asset-card";

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

      <CardsGrid empty={filtered.length === 0}>
        {filtered.map((u: any) => {
          const prop = data!.properties.find((p: any) => p.id === u.property_id);
          const contract = data!.contracts.find((c: any) => c.unit_id === u.id && c.status === "نشط");
          const tenant = contract ? data!.tenants.find((t: any) => t.id === contract.tenant_id) : null;
          return (
            <AssetCard
              key={u.id}
              to="/units/$id"
              params={{ id: u.id }}
              hero={
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50">
                  <Home className="h-16 w-16 text-amber-600/50" />
                </div>
              }
              title={`وحدة ${u.unit_number}`}
              subtitle={
                <>
                  {prop?.name ? <Link to="/properties/$id" params={{ id: prop.id }} className="hover:text-primary">{prop.name}</Link> : "—"} · {u.type}
                </> as any
              }
              statusLabel={u.status}
              statusTone={unitTone(u.status)}
              stats={[
                { label: "الإيجار", value: `${Number(u.rent_amount).toLocaleString()} ر.س` },
                { label: "المساحة", value: u.area_sqm ? `${u.area_sqm} م²` : "—" },
                { label: "المستأجر", value: tenant?.full_name ?? "—" },
                { label: "الغرف", value: u.bedrooms ?? "—" },
              ]}
              actions={
                <div className="flex gap-1">
                  <RecordDialog table="units" title="تعديل الوحدة" fields={unitFields} initial={u} invalidate={INVALIDATE} />
                  <DeleteButton table="units" id={u.id} invalidate={INVALIDATE} />
                </div>
              }
            />
          );
        })}
      </CardsGrid>
    </DashboardLayout>
  );
}
