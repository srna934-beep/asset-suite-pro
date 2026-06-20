import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Users, Phone, Mail } from "lucide-react";

export const Route = createFileRoute("/tenants/")({
  head: () => ({ meta: [{ title: "المستأجرين | إدارة الأملاك" }] }),
  component: TenantsList,
});

function TenantsList() {
  const { data } = useQuery(queryOptions({
    queryKey: ["tenants-list"],
    queryFn: async () => {
      const [{ data: tenants }, { data: contracts }] = await Promise.all([
        supabase.from("tenants").select("*").order("full_name"),
        supabase.from("contracts").select("tenant_id, status, monthly_rent"),
      ]);
      return { tenants: tenants ?? [], contracts: contracts ?? [] };
    },
  }));

  return (
    <DashboardLayout title="المستأجرين" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Users className="h-6 w-6" /></div>}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.tenants.map((t: any) => {
          const active = data.contracts.filter((c: any) => c.tenant_id === t.id && c.status === "نشط");
          const totalRent = active.reduce((s: number, c: any) => s + Number(c.monthly_rent), 0);
          return (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700 font-bold">
                  {t.full_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-extrabold">{t.full_name}</div>
                  <div className="text-xs text-muted-foreground">هوية: {t.national_id ?? "—"}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {t.phone ?? "—"}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {t.email ?? "—"}</div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">عقود نشطة</span>
                <span className="font-bold">{active.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">إجمالي الإيجار الشهري</span>
                <span className="font-bold text-emerald-700">{totalRent.toLocaleString()} ر.س</span>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
