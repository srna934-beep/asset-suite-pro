import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { UserCog } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { AttachmentsButton } from "@/components/attachments-panel";
import { ExportCsvButton } from "@/components/export-csv-button";

export const Route = createFileRoute("/employees/")({
  head: () => ({ meta: [{ title: "الموظفين | منصة الأصول" }] }),
  component: EmployeesList,
});

const INV = [["employees-list"], ["dashboard-totals"]];

function EmployeesList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data } = useQuery(queryOptions({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const [{ data: emps }, { data: depts }] = await Promise.all([
        supabase.from("employees" as any).select("*").eq("archived", false).order("created_at", { ascending: false }),
        supabase.from("departments" as any).select("*"),
      ]);
      return { emps: emps ?? [], depts: depts ?? [] };
    },
  }));

  const FIELDS: FieldDef[] = useMemo(() => [
    { name: "full_name", label: "الاسم الكامل", required: true },
    { name: "national_id", label: "رقم الهوية" },
    { name: "phone", label: "الجوال" },
    { name: "email", label: "البريد الإلكتروني" },
    { name: "position", label: "المسمى الوظيفي" },
    { name: "department_id", label: "القسم", type: "select",
      options: (data?.depts ?? []).map((d: any) => ({ value: d.id, label: d.name })) },
    { name: "hire_date", label: "تاريخ التعيين", type: "date" },
    { name: "basic_salary", label: "الراتب الأساسي", type: "number" },
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "نشط", label: "نشط" }, { value: "إجازة", label: "إجازة" }, { value: "موقوف", label: "موقوف" }, { value: "منتهي", label: "منتهي" },
    ]},
    { name: "address", label: "العنوان" },
    { name: "notes", label: "ملاحظات", type: "textarea" },
  ], [data]);

  const filtered = useMemo(() => {
    let r = (data?.emps ?? []) as any[];
    if (search) { const s = search.toLowerCase(); r = r.filter(e => e.full_name?.toLowerCase().includes(s) || e.position?.toLowerCase().includes(s) || e.email?.toLowerCase().includes(s)); }
    if (status) r = r.filter(e => e.status === status);
    return r;
  }, [data, search, status]);

  const deptById: Record<string, string> = Object.fromEntries((data?.depts ?? []).map((d: any) => [d.id, d.name]));

  return (
    <DashboardLayout title="الموظفين" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><UserCog className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: [
          { value: "نشط", label: "نشط" }, { value: "إجازة", label: "إجازة" }, { value: "موقوف", label: "موقوف" }, { value: "منتهي", label: "منتهي" },
        ]}]}
      >
        <ExportCsvButton rows={filtered} filename="employees" columns={[
          { key: "full_name", label: "الاسم" }, { key: "position", label: "المسمى" },
          { key: "phone", label: "الجوال" }, { key: "email", label: "البريد" },
          { key: "basic_salary", label: "الراتب" }, { key: "status", label: "الحالة" },
        ]} />
        <RecordDialog table="employees" title="إضافة موظف" fields={FIELDS} invalidate={INV} />
      </ListToolbar>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">الاسم</th><th className="px-4 py-3">المسمى</th>
              <th className="px-4 py-3">القسم</th><th className="px-4 py-3">الجوال</th>
              <th className="px-4 py-3">الراتب</th><th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((e: any) => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 font-semibold">{e.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.position ?? "—"}</td>
                  <td className="px-4 py-3">{deptById[e.department_id] ?? "—"}</td>
                  <td className="px-4 py-3">{e.phone ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{e.basic_salary ? `${Number(e.basic_salary).toLocaleString()} ر.س` : "—"}</td>
                  <td className="px-4 py-3"><StatusPill tone={e.status === "نشط" ? "success" : e.status === "إجازة" ? "info" : e.status === "موقوف" ? "warning" : "muted"}>{e.status}</StatusPill></td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <AttachmentsButton entityType="employee" entityId={e.id} />
                    <RecordDialog table="employees" title="تعديل الموظف" fields={FIELDS} initial={e} invalidate={INV} />
                    <DeleteButton table="employees" id={e.id} invalidate={INV} />
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">لا يوجد موظفون مسجلون.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
