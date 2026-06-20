import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill, unitTone } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Home } from "lucide-react";

export const Route = createFileRoute("/units/")({
  head: () => ({ meta: [{ title: "الوحدات | إدارة الأملاك" }] }),
  component: UnitsList,
});

function UnitsList() {
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

  return (
    <DashboardLayout title="الوحدات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Home className="h-6 w-6" /></div>}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[700px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">الوحدة</th><th className="px-4 py-3">العقار</th>
            <th className="px-4 py-3">النوع</th><th className="px-4 py-3">الإيجار</th>
            <th className="px-4 py-3">الحالة</th><th className="px-4 py-3">المستأجر</th>
          </tr></thead>
          <tbody>
            {data?.units.map((u: any) => {
              const prop = data.properties.find((p: any) => p.id === u.property_id);
              const contract = data.contracts.find((c: any) => c.unit_id === u.id && c.status === "نشط");
              const tenant = contract ? data.tenants.find((t: any) => t.id === contract.tenant_id) : null;
              return (
                <tr key={u.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3"><Link to="/units/$id" params={{ id: u.id }} className="font-semibold text-primary hover:underline">{u.unit_number}</Link></td>
                  <td className="px-4 py-3">{prop?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.type}</td>
                  <td className="px-4 py-3 font-semibold">{Number(u.rent_amount).toLocaleString()} ر.س</td>
                  <td className="px-4 py-3"><StatusPill tone={unitTone(u.status)}>{u.status}</StatusPill></td>
                  <td className="px-4 py-3">{tenant?.full_name ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
