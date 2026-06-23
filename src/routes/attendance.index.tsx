import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { CalendarCheck } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";

export const Route = createFileRoute("/attendance/")({
  head: () => ({ meta: [{ title: "الحضور والانصراف | منصة الأصول" }] }),
  component: AttendancePage,
});

const INV = [["attendance-list"]];

function AttendancePage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data } = useQuery(queryOptions({
    queryKey: ["attendance-list"],
    queryFn: async () => {
      const [{ data: rows }, { data: emps }] = await Promise.all([
        supabase.from("attendance" as any).select("*").order("date", { ascending: false }).limit(500),
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
    { name: "date", label: "التاريخ", type: "date", required: true },
    { name: "check_in", label: "وقت الحضور (HH:MM)", placeholder: "08:00" },
    { name: "check_out", label: "وقت الانصراف (HH:MM)", placeholder: "17:00" },
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "حاضر", label: "حاضر" }, { value: "غائب", label: "غائب" },
      { value: "متأخر", label: "متأخر" }, { value: "إجازة", label: "إجازة" },
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
    <DashboardLayout title="الحضور والانصراف" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-100 text-indigo-700"><CalendarCheck className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: [
          { value: "حاضر", label: "حاضر" }, { value: "غائب", label: "غائب" },
          { value: "متأخر", label: "متأخر" }, { value: "إجازة", label: "إجازة" },
        ]}]}
      >
        <RecordDialog table="attendance" title="تسجيل حضور" fields={FIELDS} invalidate={INV}
          defaults={{ date: new Date().toISOString().slice(0, 10), status: "حاضر" }} />
      </ListToolbar>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">الموظف</th><th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3">الحضور</th><th className="px-4 py-3">الانصراف</th>
              <th className="px-4 py-3">الحالة</th><th className="px-4 py-3">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold">{empName(r.employee_id)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-3">{r.check_in ?? "—"}</td>
                  <td className="px-4 py-3">{r.check_out ?? "—"}</td>
                  <td className="px-4 py-3"><StatusPill tone={r.status === "حاضر" ? "success" : r.status === "متأخر" ? "warning" : r.status === "إجازة" ? "info" : "danger"}>{r.status}</StatusPill></td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <RecordDialog table="attendance" title="تعديل" fields={FIELDS} initial={r} invalidate={INV} />
                    <DeleteButton table="attendance" id={r.id} invalidate={INV} />
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">لا توجد سجلات حضور.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
