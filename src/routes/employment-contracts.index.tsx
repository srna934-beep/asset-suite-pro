import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { FileSignature } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";

export const Route = createFileRoute("/employment-contracts/")({
  head: () => ({ meta: [{ title: "عقود الموظفين | منصة الأصول" }] }),
  component: ECPage,
});

const INV = [["ec-list"]];

function ECPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data } = useQuery(queryOptions({
    queryKey: ["ec-list"],
    queryFn: async () => {
      const [{ data: rows }, { data: emps }] = await Promise.all([
        supabase.from("employment_contracts" as any).select("*").order("start_date", { ascending: false }),
        supabase.from("employees" as any).select("id, full_name"),
      ]);
      return { rows: (rows ?? []) as any[], emps: (emps ?? []) as any[] };
    },
  }));
  const emps = data?.emps ?? [];
  const rows = data?.rows ?? [];
  const empName = (id: string) => emps.find((e: any) => e.id === id)?.full_name ?? "—";

  const FIELDS: FieldDef[] = useMemo(() => [
    { name: "employee_id", label: "الموظف", type: "select", required: true,
      options: emps.map((e: any) => ({ value: e.id, label: e.full_name })) },
    { name: "contract_type", label: "نوع العقد", type: "select", required: true, options: [
      { value: "محدد المدة", label: "محدد المدة" }, { value: "غير محدد المدة", label: "غير محدد المدة" },
      { value: "تدريب", label: "تدريب" }, { value: "جزئي", label: "جزئي" },
    ]},
    { name: "start_date", label: "تاريخ البداية", type: "date", required: true },
    { name: "end_date", label: "تاريخ النهاية", type: "date" },
    { name: "monthly_salary", label: "الراتب الشهري", type: "number", required: true },
    { name: "allowances", label: "البدلات", type: "number" },
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "نشط", label: "نشط" }, { value: "منتهي", label: "منتهي" }, { value: "ملغى", label: "ملغى" },
    ]},
    { name: "notes", label: "ملاحظات", type: "textarea" },
  ], [emps]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search) { const s = search.toLowerCase(); r = r.filter((x: any) => empName(x.employee_id).toLowerCase().includes(s)); }
    if (status) r = r.filter((x: any) => x.status === status);
    return r;
  }, [rows, search, status, emps]);

  return (
    <DashboardLayout title="عقود الموظفين" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-100 text-cyan-700"><FileSignature className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: [
          { value: "نشط", label: "نشط" }, { value: "منتهي", label: "منتهي" }, { value: "ملغى", label: "ملغى" },
        ]}]}
      >
        <RecordDialog table="employment_contracts" title="عقد جديد" fields={FIELDS} invalidate={INV} defaults={{ status: "نشط" }} />
      </ListToolbar>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">الموظف</th><th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">من</th><th className="px-4 py-3">إلى</th>
              <th className="px-4 py-3">الراتب</th><th className="px-4 py-3">البدلات</th>
              <th className="px-4 py-3">الحالة</th><th className="px-4 py-3">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold">{empName(r.employee_id)}</td>
                  <td className="px-4 py-3">{r.contract_type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.start_date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.end_date ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{Number(r.monthly_salary).toLocaleString()} ر.س</td>
                  <td className="px-4 py-3">{r.allowances ? `${Number(r.allowances).toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3"><StatusPill tone={r.status === "نشط" ? "success" : r.status === "منتهي" ? "muted" : "danger"}>{r.status}</StatusPill></td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <RecordDialog table="employment_contracts" title="تعديل العقد" fields={FIELDS} initial={r} invalidate={INV} />
                    <DeleteButton table="employment_contracts" id={r.id} invalidate={INV} />
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">لا توجد عقود مسجلة.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
