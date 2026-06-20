import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/maintenance/")({
  head: () => ({ meta: [{ title: "الصيانة | إدارة الأملاك" }] }),
  component: MaintenanceList,
});

function MaintenanceList() {
  const { data } = useQuery(queryOptions({
    queryKey: ["maintenance-list"],
    queryFn: async () => {
      const { data } = await supabase.from("maintenance_requests").select("*, properties(name), units(unit_number)").order("reported_at", { ascending: false });
      return data ?? [];
    },
  }));

  return (
    <DashboardLayout title="الصيانة" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Wrench className="h-6 w-6" /></div>}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[700px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">العنوان</th><th className="px-4 py-3">العقار</th>
            <th className="px-4 py-3">الوحدة</th><th className="px-4 py-3">الفني</th>
            <th className="px-4 py-3">التكلفة</th><th className="px-4 py-3">الحالة</th>
            <th className="px-4 py-3">التاريخ</th>
          </tr></thead>
          <tbody>
            {data?.map((m: any) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{m.title}</td>
                <td className="px-4 py-3">{m.properties?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.units?.unit_number ?? "—"}</td>
                <td className="px-4 py-3">{m.assigned_to ?? "—"}</td>
                <td className="px-4 py-3 font-semibold">{Number(m.cost).toLocaleString()} ر.س</td>
                <td className="px-4 py-3"><StatusPill tone={m.status === "مكتمل" ? "success" : m.status === "قيد التنفيذ" ? "info" : "warning"}>{m.status}</StatusPill></td>
                <td className="px-4 py-3 text-muted-foreground">{m.reported_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
