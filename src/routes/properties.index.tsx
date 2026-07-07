import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { propertyTone } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { useAssetOptions } from "@/lib/asset-options";
import { AssetCard, CardsGrid } from "@/components/asset-card";

export const Route = createFileRoute("/properties/")({
  head: () => ({ meta: [{ title: "العقارات | إدارة الأملاك" }] }),
  component: PropertiesList,
});

const INVALIDATE = [["properties-list"], ["dashboard"], ["units-list"], ["asset-options"]];

function PropertiesList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("name");
  const { employeeOpts, nameById } = useAssetOptions();

  const PROPERTY_FIELDS: FieldDef[] = useMemo(() => [
    { name: "name", label: "اسم العقار", required: true },
    { name: "type", label: "النوع", type: "select", required: true, options: [
      { value: "عمارة", label: "عمارة" }, { value: "فيلا", label: "فيلا" }, { value: "مجمع", label: "مجمع" },
      { value: "أرض", label: "أرض" }, { value: "محل", label: "محل" }, { value: "مكتب", label: "مكتب" },
    ]},
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "مؤجر", label: "مؤجر" }, { value: "خاصة", label: "خاصة" }, { value: "متاح", label: "متاح" },
    ]},
    { name: "responsible_employee_id", label: "المسؤول عن العقار (موظف)", type: "select", options: employeeOpts },
    { name: "location", label: "الموقع" },
    { name: "address", label: "العنوان" },
    { name: "description", label: "الوصف", type: "textarea" },
  ], [employeeOpts]);

  const { data } = useQuery(queryOptions({
    queryKey: ["properties-list"],
    queryFn: async () => {
      const [{ data: properties }, { data: units }, { data: contracts }] = await Promise.all([
        supabase.from("properties").select("*"),
        supabase.from("units").select("id, property_id, status, rent_amount"),
        supabase.from("contracts").select("unit_id, monthly_rent, status"),
      ]);
      return { properties: properties ?? [], units: units ?? [], contracts: contracts ?? [] };
    },
  }));

  const filtered = useMemo(() => {
    let r = data?.properties ?? [];
    if (search) { const s = search.toLowerCase(); r = r.filter((p: any) => p.name?.toLowerCase().includes(s) || p.location?.toLowerCase().includes(s)); }
    if (status) r = r.filter((p: any) => p.status === status);
    r = [...r].sort((a: any, b: any) => sort === "name" ? a.name.localeCompare(b.name) : (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return r;
  }, [data, search, status, sort]);

  return (
    <DashboardLayout title="العقارات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: [
          { value: "مؤجر", label: "مؤجر" }, { value: "خاصة", label: "خاصة" }, { value: "متاح", label: "متاح" },
        ]}]}
        sort={{ value: sort, onChange: setSort, options: [{ value: "name", label: "الاسم" }, { value: "newest", label: "الأحدث" }] }}
      >
        <RecordDialog table="properties" title="إضافة عقار جديد" fields={PROPERTY_FIELDS} invalidate={INVALIDATE} />
      </ListToolbar>

      <CardsGrid empty={filtered.length === 0}>
        {filtered.map((p: any) => {
          const propUnits = data!.units.filter((u: any) => u.property_id === p.id);
          const income = data!.contracts
            .filter((c: any) => c.status === "نشط" && propUnits.some((u: any) => u.id === c.unit_id))
            .reduce((s: number, c: any) => s + Number(c.monthly_rent), 0);
          const occupied = propUnits.filter((u: any) => u.status === "مؤجرة").length;
          return (
            <AssetCard
              key={p.id}
              to="/properties/$id"
              params={{ id: p.id }}
              hero={
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/15 via-sky-100 to-amber-50">
                  <Building2 className="h-16 w-16 text-primary/40" />
                </div>
              }
              title={p.name}
              subtitle={
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {p.location ?? "—"} · {p.type}
                </span> as any
              }
              statusLabel={p.status}
              statusTone={propertyTone(p.status)}
              stats={[
                { label: "الوحدات", value: `${occupied}/${propUnits.length}` },
                { label: "الدخل الشهري", value: income ? `${income.toLocaleString()} ر.س` : "—" },
                { label: "المسؤول", value: p.responsible_employee_id ? (nameById[p.responsible_employee_id] ?? "—") : "—" },
                { label: "النوع", value: p.type },
              ]}
              actions={
                <div className="flex gap-1">
                  <RecordDialog table="properties" title="تعديل العقار" fields={PROPERTY_FIELDS} initial={p} invalidate={INVALIDATE} />
                  <DeleteButton table="properties" id={p.id} invalidate={INVALIDATE} />
                </div>
              }
            />
          );
        })}
      </CardsGrid>
    </DashboardLayout>
  );
}
