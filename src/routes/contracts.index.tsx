import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill, contractTone } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { FileText, AlertTriangle } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";

export const Route = createFileRoute("/contracts/")({
  head: () => ({ meta: [{ title: "العقود | إدارة الأملاك" }] }),
  component: ContractsList,
});

const INVALIDATE = [["contracts-list"], ["dashboard"], ["payments-list"]];

function daysBetween(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function ContractsList() {
  const { data } = useQuery(queryOptions({
    queryKey: ["contracts-list"],
    queryFn: async () => {
      const [{ data: contracts }, { data: units }, { data: properties }, { data: tenants }] = await Promise.all([
        supabase.from("contracts").select("*").order("end_date"),
        supabase.from("units").select("id, property_id, unit_number"),
        supabase.from("properties").select("id, name"),
        supabase.from("tenants").select("id, full_name"),
      ]);
      return { contracts: contracts ?? [], units: units ?? [], properties: properties ?? [], tenants: tenants ?? [] };
    },
  }));

  const unitOptions = (data?.units ?? []).map((u: any) => {
    const pr = data?.properties.find((p: any) => p.id === u.property_id);
    return { value: u.id, label: `${pr?.name ?? ""} — ${u.unit_number}` };
  });
  const tenantOptions = (data?.tenants ?? []).map((t: any) => ({ value: t.id, label: t.full_name }));
  const fields: FieldDef[] = [
    { name: "unit_id", label: "الوحدة", type: "select", required: true, options: unitOptions },
    { name: "tenant_id", label: "المستأجر", type: "select", required: true, options: tenantOptions },
    { name: "start_date", label: "تاريخ البداية", type: "date", required: true },
    { name: "end_date", label: "تاريخ النهاية", type: "date", required: true },
    { name: "monthly_rent", label: "الإيجار الشهري (ر.س)", type: "number", required: true },
    { name: "deposit", label: "التأمين", type: "number" },
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "نشط", label: "نشط" }, { value: "منتهي", label: "منتهي" }, { value: "ملغي", label: "ملغي" },
    ]},
    { name: "notes", label: "ملاحظات", type: "textarea" },
  ];

  return (
    <DashboardLayout title="العقود" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700"><FileText className="h-6 w-6" /></div>}>
      <div className="mb-4 flex justify-end">
        <RecordDialog table="contracts" title="إضافة عقد جديد" fields={fields} invalidate={INVALIDATE} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[800px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">المستأجر</th><th className="px-4 py-3">العقار / الوحدة</th>
            <th className="px-4 py-3">البداية</th><th className="px-4 py-3">النهاية</th>
            <th className="px-4 py-3">القيمة</th><th className="px-4 py-3">الحالة</th>
            <th className="px-4 py-3">تنبيه</th><th className="px-4 py-3">إجراءات</th>
          </tr></thead>
          <tbody>
            {data?.contracts.map((c: any) => {
              const u = data.units.find((uu: any) => uu.id === c.unit_id);
              const pr = u ? data.properties.find((pp: any) => pp.id === u.property_id) : null;
              const t = data.tenants.find((tt: any) => tt.id === c.tenant_id);
              const days = daysBetween(c.end_date);
              const expiring = c.status === "نشط" && days <= 60 && days >= 0;
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{t?.full_name ?? "—"}</td>
                  <td className="px-4 py-3">{pr?.name} — {u?.unit_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.start_date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.end_date}</td>
                  <td className="px-4 py-3 font-semibold">{Number(c.monthly_rent).toLocaleString()} ر.س</td>
                  <td className="px-4 py-3"><StatusPill tone={contractTone(c.status)}>{c.status}</StatusPill></td>
                  <td className="px-4 py-3">
                    {expiring && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700"><AlertTriangle className="h-3 w-3" /> {days} يوم</span>}
                    {days < 0 && c.status === "نشط" && <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">منتهي</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <RecordDialog table="contracts" title="تعديل العقد" fields={fields} initial={c} invalidate={INVALIDATE} />
                      <DeleteButton table="contracts" id={c.id} invalidate={INVALIDATE} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
