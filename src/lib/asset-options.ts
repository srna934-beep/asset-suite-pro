import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Opt = { value: string; label: string };

export const assetOptionsQuery = queryOptions({
  queryKey: ["asset-options"],
  queryFn: async () => {
    const [emps, props, units, vehicles, lands] = await Promise.all([
      supabase.from("employees" as any).select("id, full_name").eq("archived", false).order("full_name"),
      supabase.from("properties" as any).select("id, name").order("name"),
      supabase.from("units" as any).select("id, unit_number, property_id").order("unit_number"),
      supabase.from("vehicles" as any).select("id, name, plate_number").eq("archived", false).order("name"),
      supabase.from("lands" as any).select("id, name").eq("archived", false).order("name"),
    ]);
    return {
      employees: (emps.data ?? []) as any[],
      properties: (props.data ?? []) as any[],
      units: (units.data ?? []) as any[],
      vehicles: (vehicles.data ?? []) as any[],
      lands: (lands.data ?? []) as any[],
    };
  },
});

export function useAssetOptions() {
  const { data } = useQuery(assetOptionsQuery);
  const d = data ?? { employees: [], properties: [], units: [], vehicles: [], lands: [] };

  const employeeOpts: Opt[] = d.employees.map((e: any) => ({ value: e.id, label: e.full_name }));
  const propertyOpts: Opt[] = d.properties.map((p: any) => ({ value: p.id, label: p.name }));
  const unitOpts: Opt[] = d.units.map((u: any) => {
    const prop = d.properties.find((p: any) => p.id === u.property_id);
    return { value: u.id, label: `${u.unit_number}${prop ? ` — ${prop.name}` : ""}` };
  });
  const vehicleOpts: Opt[] = d.vehicles.map((v: any) => ({
    value: v.id, label: `${v.name}${v.plate_number ? ` (${v.plate_number})` : ""}`,
  }));
  const landOpts: Opt[] = d.lands.map((l: any) => ({ value: l.id, label: l.name }));

  const assetTypeOptions: Opt[] = [
    { value: "property", label: "عقار" },
    { value: "unit", label: "وحدة" },
    { value: "vehicle", label: "مركبة/معدة" },
    { value: "land", label: "أرض/مزرعة" },
  ];

  const assetOptionsMap: Record<string, Opt[]> = {
    property: propertyOpts,
    unit: unitOpts,
    vehicle: vehicleOpts,
    land: landOpts,
  };

  const nameById: Record<string, string> = {};
  d.employees.forEach((e: any) => (nameById[e.id] = e.full_name));
  d.properties.forEach((p: any) => (nameById[p.id] = p.name));
  d.units.forEach((u: any) => (nameById[u.id] = `وحدة ${u.unit_number}`));
  d.vehicles.forEach((v: any) => (nameById[v.id] = v.name));
  d.lands.forEach((l: any) => (nameById[l.id] = l.name));

  function assetLabel(type?: string | null, id?: string | null) {
    if (!type || !id) return "—";
    const typeLabel = assetTypeOptions.find((t) => t.value === type)?.label ?? type;
    return `${typeLabel}: ${nameById[id] ?? id.slice(0, 8)}`;
  }

  return {
    raw: d,
    employeeOpts,
    propertyOpts,
    unitOpts,
    vehicleOpts,
    landOpts,
    assetTypeOptions,
    assetOptionsMap,
    nameById,
    assetLabel,
  };
}
