import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill, propertyTone } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/properties/")({
  head: () => ({ meta: [{ title: "العقارات | إدارة الأملاك" }] }),
  component: PropertiesList,
});

function PropertiesList() {
  const { data } = useQuery(queryOptions({
    queryKey: ["properties-list"],
    queryFn: async () => {
      const [{ data: properties }, { data: units }, { data: contracts }] = await Promise.all([
        supabase.from("properties").select("*").order("name"),
        supabase.from("units").select("id, property_id, status, rent_amount"),
        supabase.from("contracts").select("unit_id, monthly_rent, status"),
      ]);
      return { properties: properties ?? [], units: units ?? [], contracts: contracts ?? [] };
    },
  }));

  return (
    <DashboardLayout title="العقارات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" /></div>}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[700px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">اسم العقار</th><th className="px-4 py-3">النوع</th>
            <th className="px-4 py-3">الموقع</th><th className="px-4 py-3">الوحدات</th>
            <th className="px-4 py-3">الدخل الشهري</th><th className="px-4 py-3">الحالة</th>
          </tr></thead>
          <tbody>
            {data?.properties.map((p: any) => {
              const propUnits = data.units.filter((u: any) => u.property_id === p.id);
              const income = data.contracts.filter((c: any) => c.status === "نشط" && propUnits.some((u: any) => u.id === c.unit_id))
                .reduce((s: number, c: any) => s + Number(c.monthly_rent), 0);
              return (
                <tr key={p.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3"><Link to="/properties/$id" params={{ id: p.id }} className="font-semibold text-primary hover:underline">{p.name}</Link></td>
                  <td className="px-4 py-3 text-muted-foreground">{p.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.location ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{propUnits.length}</td>
                  <td className="px-4 py-3 font-semibold">{income ? `${income.toLocaleString()} ر.س` : "—"}</td>
                  <td className="px-4 py-3"><StatusPill tone={propertyTone(p.status)}>{p.status}</StatusPill></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
