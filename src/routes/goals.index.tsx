import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { sb } from "@/lib/sb";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { StatusPill } from "@/components/status-pill";
import { Target } from "lucide-react";

export const Route = createFileRoute("/goals/")({
  head: () => ({ meta: [{ title: "الأهداف | منصة الأصول" }] }),
  component: GoalsPage,
});

const TYPES = ["مالي", "تشغيلي", "إشغال", "إنجاز"];
const SCOPES = ["system", "department", "project", "property", "vehicle", "land", "employee"];
const STATUSES = ["مسودة", "نشط", "متوقف", "متأخر", "مكتمل", "ملغي", "مؤرشف"];
const PRIORITIES = ["منخفضة", "متوسطة", "عالية", "عاجلة"];

const FIELDS: FieldDef[] = [
  { name: "name", label: "اسم الهدف", required: true },
  { name: "description", label: "وصف الهدف", type: "textarea" },
  { name: "goal_type", label: "نوع الهدف", type: "select", required: true, options: TYPES.map(t => ({ value: t, label: t })) },
  { name: "scope", label: "النطاق", type: "select", required: true, options: SCOPES.map(s => ({ value: s, label: s })) },
  { name: "target_value", label: "القيمة المستهدفة", type: "number", required: true },
  { name: "current_value", label: "القيمة الحالية", type: "number" },
  { name: "measure", label: "طريقة القياس" },
  { name: "start_date", label: "تاريخ البداية", type: "date" },
  { name: "end_date", label: "تاريخ النهاية", type: "date" },
  { name: "priority", label: "الأولوية", type: "select", options: PRIORITIES.map(p => ({ value: p, label: p })) },
  { name: "status", label: "الحالة", type: "select", options: STATUSES.map(s => ({ value: s, label: s })) },
  { name: "notes", label: "ملاحظات", type: "textarea" },
];
const INV = [["goals-list"]];

function GoalsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data = [] } = useQuery(queryOptions({
    queryKey: ["goals-list"],
    queryFn: async () => (await sb("goals").select("*").order("created_at", { ascending: false })).data ?? [],
  }));
  const filtered = useMemo(() => {
    let r = data as any[];
    if (search) { const s = search.toLowerCase(); r = r.filter((g: any) => g.name?.toLowerCase().includes(s)); }
    if (status) r = r.filter((g: any) => g.status === status);
    return r;
  }, [data, search, status]);

  return (
    <DashboardLayout title="الأهداف" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Target className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: STATUSES.map(s => ({ value: s, label: s })) }]}
      >
        <RecordDialog table="goals" title="إضافة هدف" fields={FIELDS} invalidate={INV} />
      </ListToolbar>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-3 py-3">اسم الهدف</th>
              <th className="px-3 py-3">النوع</th>
              <th className="px-3 py-3">النطاق</th>
              <th className="px-3 py-3">المستهدف</th>
              <th className="px-3 py-3">الحالي</th>
              <th className="px-3 py-3">نسبة الإنجاز</th>
              <th className="px-3 py-3">النهاية</th>
              <th className="px-3 py-3">الحالة</th>
              <th className="px-3 py-3">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((g: any) => {
                const pct = Number(g.target_value) > 0 ? Math.min(100, Math.round((Number(g.current_value) / Number(g.target_value)) * 100)) : 0;
                return (
                  <tr key={g.id} className="border-t border-border">
                    <td className="px-3 py-3 font-bold">{g.name}</td>
                    <td className="px-3 py-3">{g.goal_type}</td>
                    <td className="px-3 py-3 text-xs">{g.scope}</td>
                    <td className="px-3 py-3">{Number(g.target_value).toLocaleString()}</td>
                    <td className="px-3 py-3">{Number(g.current_value).toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <div className="w-24 h-2 rounded bg-muted overflow-hidden"><div className={`h-full ${pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-sky-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} /></div>
                      <div className="mt-0.5 text-[10px]">{pct}%</div>
                    </td>
                    <td className="px-3 py-3 text-xs">{g.end_date ?? "—"}</td>
                    <td className="px-3 py-3"><StatusPill tone={g.status === "مكتمل" ? "success" : g.status === "متأخر" || g.status === "ملغي" ? "danger" : "muted"}>{g.status}</StatusPill></td>
                    <td className="px-3 py-3"><div className="flex gap-1">
                      <RecordDialog table="goals" title="تعديل الهدف" fields={FIELDS} initial={g} invalidate={INV} />
                      <DeleteButton table="goals" id={g.id} invalidate={INV} />
                    </div></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={9} className="py-12 text-center text-muted-foreground">لا توجد أهداف بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
