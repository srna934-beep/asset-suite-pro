import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Plane } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";

export const Route = createFileRoute("/leaves/")({
  head: () => ({ meta: [{ title: "الإجازات | منصة الأصول" }] }),
  component: LeavesPage,
});

const INV = [["leaves-list"]];

function LeavesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data } = useQuery(queryOptions({
    queryKey: ["leaves-list"],
    queryFn: async () => {
      const [{ data: rows }, { data: emps }] = await Promise.all([
        supabase.from("leaves" as any).select("*").order("start_date", { ascending: false }),
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
    { name: "leave_type", label: "نوع الإجازة", type: "select", required: true, options: [
      { value: "سنوية", label: "سنوية" }, { value: "مرضية", label: "مرضية" },
      { value: "اضطرارية", label: "اضطرارية" }, { value: "بدون راتب", label: "بدون راتب" },
      { value: "أمومة", label: "أمومة" },
    ]},
    { name: "start_date", label: "تاريخ البداية", type: "date", required: true },
    { name: "end_date", label: "تاريخ النهاية", type: "date", required: true },
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "معلقة", label: "معلقة" }, { value: "موافق عليها", label: "موافق عليها" }, { value: "مرفوضة", label: "مرفوضة" },
    ]},
    { name: "reason", label: "السبب", type: "textarea" },
  ], [emps]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search) { const s = search.toLowerCase(); r = r.filter((x: any) => empName(x.employee_id).toLowerCase().includes(s)); }
    if (status) r = r.filter((x: any) => x.status === status);
    return r;
  }, [rows, search, status, emps]);

  return (
    <DashboardLayout title="الإجازات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Plane className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: [
          { value: "معلقة", label: "معلقة" }, { value: "موافق عليها", label: "موافق عليها" }, { value: "مرفوضة", label: "مرفوضة" },
        ]}]}
      >
        <RecordDialog table="leaves" title="طلب إجازة" fields={FIELDS} invalidate={INV} defaults={{ status: "معلقة" }} />
      </ListToolbar>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">الموظف</th><th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">من</th><th className="px-4 py-3">إلى</th>
              <th className="px-4 py-3">الحالة</th><th className="px-4 py-3">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold">{empName(r.employee_id)}</td>
                  <td className="px-4 py-3">{r.leave_type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.start_date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.end_date}</td>
                  <td className="px-4 py-3"><StatusPill tone={r.status === "موافق عليها" ? "success" : r.status === "مرفوضة" ? "danger" : "warning"}>{r.status}</StatusPill></td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <RecordDialog table="leaves" title="تعديل الإجازة" fields={FIELDS} initial={r} invalidate={INV} />
                    <DeleteButton table="leaves" id={r.id} invalidate={INV} />
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">لا توجد طلبات إجازة.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
