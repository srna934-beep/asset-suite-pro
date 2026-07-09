import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { sb } from "@/lib/sb";
import { supabase } from "@/integrations/supabase/client";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { StatusPill } from "@/components/status-pill";
import { Briefcase } from "lucide-react";
import { fmtSAR } from "@/components/dash-bits";

export const Route = createFileRoute("/projects/")({
  head: () => ({ meta: [{ title: "المشاريع | منصة الأصول" }] }),
  component: ProjectsPage,
});

const STATUSES = ["مخطط", "بانتظار الموافقة", "نشط", "متوقف", "متأخر", "مكتمل", "ملغي", "مؤرشف"];
const PRIORITIES = ["منخفضة", "متوسطة", "عالية", "عاجلة"];

function useFields(employees: any[]): FieldDef[] {
  return [
    { name: "name", label: "اسم المشروع", required: true },
    { name: "code", label: "رقم/رمز المشروع" },
    { name: "project_type", label: "نوع المشروع" },
    { name: "description", label: "وصف المشروع", type: "textarea" },
    { name: "responsible_id", label: "المسؤول عن المشروع", type: "select", options: employees.map(e => ({ value: e.id, label: e.full_name })) },
    { name: "manager_id", label: "المدير/المشرف", type: "select", options: employees.map(e => ({ value: e.id, label: e.full_name })) },
    { name: "start_date", label: "تاريخ البداية", type: "date" },
    { name: "end_date", label: "تاريخ النهاية المتوقعة", type: "date" },
    { name: "status", label: "الحالة", type: "select", options: STATUSES.map(s => ({ value: s, label: s })) },
    { name: "priority", label: "الأولوية", type: "select", options: PRIORITIES.map(s => ({ value: s, label: s })) },
    { name: "planned_budget", label: "الميزانية المخططة", type: "number" },
    { name: "planned_income", label: "الإيراد المتوقع", type: "number" },
    { name: "notes", label: "الملاحظات", type: "textarea" },
  ];
}
const INV = [["projects-list"]];

function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data = [] } = useQuery(queryOptions({
    queryKey: ["projects-list"],
    queryFn: async () => (await sb("projects").select("*").order("created_at", { ascending: false })).data ?? [],
  }));
  const { data: employees = [] } = useQuery(queryOptions({
    queryKey: ["employees-lite"],
    queryFn: async () => (await sb("employees").select("id, full_name").eq("archived", false).order("full_name")).data ?? [],
  }));
  const { data: txns = [] } = useQuery(queryOptions({
    queryKey: ["all-txns-projects"],
    queryFn: async () => (await supabase.from("transactions" as any).select("amount,txn_type,project_id").limit(2000)).data ?? [],
  }));

  const filtered = useMemo(() => {
    let r = data as any[];
    if (search) { const s = search.toLowerCase(); r = r.filter((p: any) => p.name?.toLowerCase().includes(s) || p.code?.toLowerCase().includes(s)); }
    if (status) r = r.filter((p: any) => p.status === status);
    return r;
  }, [data, search, status]);

  function money(pid: string) {
    const rows = (txns as any[]).filter(t => t.project_id === pid);
    const inc = rows.filter(t => t.txn_type === "إيراد").reduce((s, t) => s + Number(t.amount || 0), 0);
    const exp = rows.filter(t => t.txn_type === "مصروف").reduce((s, t) => s + Number(t.amount || 0), 0);
    return { inc, exp };
  }

  return (
    <DashboardLayout title="المشاريع" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Briefcase className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: STATUSES.map(s => ({ value: s, label: s })) }]}
      >
        <RecordDialog table="projects" title="إضافة مشروع" fields={useFields(employees as any[])} invalidate={INV} />
      </ListToolbar>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-3 py-3">اسم المشروع</th>
              <th className="px-3 py-3">الرمز</th>
              <th className="px-3 py-3">الحالة</th>
              <th className="px-3 py-3">البداية → النهاية</th>
              <th className="px-3 py-3">الميزانية</th>
              <th className="px-3 py-3">المصروف</th>
              <th className="px-3 py-3">الإيراد</th>
              <th className="px-3 py-3">صافي</th>
              <th className="px-3 py-3">الإنجاز</th>
              <th className="px-3 py-3">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((p: any) => {
                const m = money(p.id);
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-3 py-3 font-bold"><Link to="/projects/$id" params={{ id: p.id }} className="text-primary hover:underline">{p.name}</Link></td>
                    <td className="px-3 py-3 text-xs" dir="ltr">{p.code ?? "—"}</td>
                    <td className="px-3 py-3"><StatusPill tone={p.status === "نشط" || p.status === "مكتمل" ? "success" : p.status === "متأخر" || p.status === "ملغي" ? "danger" : "muted"}>{p.status}</StatusPill></td>
                    <td className="px-3 py-3 text-xs">{p.start_date ?? "—"} → {p.end_date ?? "—"}</td>
                    <td className="px-3 py-3">{fmtSAR(p.planned_budget)}</td>
                    <td className="px-3 py-3 text-rose-700">{fmtSAR(m.exp)}</td>
                    <td className="px-3 py-3 text-emerald-700">{fmtSAR(m.inc)}</td>
                    <td className="px-3 py-3 font-bold">{fmtSAR(m.inc - m.exp)}</td>
                    <td className="px-3 py-3">{Number(p.progress_pct ?? 0)}%</td>
                    <td className="px-3 py-3"><div className="flex gap-1">
                      <RecordDialog table="projects" title="تعديل المشروع" fields={useFields(employees as any[])} initial={p} invalidate={INV} />
                      <DeleteButton table="projects" id={p.id} invalidate={INV} />
                    </div></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">لا توجد مشاريع بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
