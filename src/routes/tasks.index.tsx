import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { ListChecks, CheckCircle2 } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks/")({
  head: () => ({ meta: [{ title: "المهام | منصة الأصول" }] }),
  component: TasksPage,
});

const FIELDS: FieldDef[] = [
  { name: "title", label: "عنوان المهمة", required: true },
  { name: "description", label: "الوصف", type: "textarea" },
  { name: "priority", label: "الأولوية", type: "select", required: true, options: [
    { value: "منخفضة", label: "منخفضة" }, { value: "متوسطة", label: "متوسطة" }, { value: "عالية", label: "عالية" }, { value: "عاجلة", label: "عاجلة" },
  ]},
  { name: "status", label: "الحالة", type: "select", required: true, options: [
    { value: "مفتوحة", label: "مفتوحة" }, { value: "قيد التنفيذ", label: "قيد التنفيذ" }, { value: "منجزة", label: "منجزة" },
  ]},
  { name: "due_date", label: "تاريخ الاستحقاق", type: "date" },
];
const INV = [["tasks-list"], ["dashboard-totals"]];

function TasksPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data = [] } = useQuery(queryOptions({
    queryKey: ["tasks-list"],
    queryFn: async () => (await supabase.from("tasks" as any).select("*").order("created_at", { ascending: false })).data ?? [],
  }));

  const filtered = useMemo(() => {
    let r = data as any[];
    if (search) { const s = search.toLowerCase(); r = r.filter(t => t.title?.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s)); }
    if (status) r = r.filter(t => t.status === status);
    return r;
  }, [data, search, status]);

  async function toggleDone(t: any) {
    const next = t.status === "منجزة" ? "مفتوحة" : "منجزة";
    const { error } = await supabase.from("tasks" as any).update({ status: next, completed_at: next === "منجزة" ? new Date().toISOString() : null }).eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success(next === "منجزة" ? "تم إنجاز المهمة" : "أُعيد فتح المهمة");
    qc.invalidateQueries({ queryKey: ["tasks-list"] });
  }

  const cols: { key: string; label: string; tone: any }[] = [
    { key: "مفتوحة", label: "مفتوحة", tone: "warning" },
    { key: "قيد التنفيذ", label: "قيد التنفيذ", tone: "info" },
    { key: "منجزة", label: "منجزة", tone: "success" },
  ];

  return (
    <DashboardLayout title="المهام" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-700"><ListChecks className="h-6 w-6" /></div>}>
      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: cols.map(c => ({ value: c.key, label: c.label })) }]}
      >
        <RecordDialog table="tasks" title="إضافة مهمة" fields={FIELDS} invalidate={INV} />
      </ListToolbar>

      <div className="grid gap-4 md:grid-cols-3">
        {cols.map(col => (
          <div key={col.key} className="rounded-2xl border border-border bg-card p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-extrabold">{col.label}</h3>
              <StatusPill tone={col.tone}>{filtered.filter((t: any) => t.status === col.key).length}</StatusPill>
            </div>
            <div className="space-y-2">
              {filtered.filter((t: any) => t.status === col.key).map((t: any) => (
                <div key={t.id} className="rounded-xl border border-border bg-background p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm">{t.title}</div>
                      {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                        <StatusPill tone={t.priority === "عاجلة" ? "danger" : t.priority === "عالية" ? "warning" : "muted"}>{t.priority}</StatusPill>
                        {t.due_date && <StatusPill tone="info">{t.due_date}</StatusPill>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => toggleDone(t)} className="text-xs h-7">
                      <CheckCircle2 className="h-3.5 w-3.5 ml-1" />{t.status === "منجزة" ? "إعادة فتح" : "إنجاز"}
                    </Button>
                    <RecordDialog table="tasks" title="تعديل المهمة" fields={FIELDS} initial={t} invalidate={INV} />
                    <DeleteButton table="tasks" id={t.id} invalidate={INV} />
                  </div>
                </div>
              ))}
              {filtered.filter((t: any) => t.status === col.key).length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">لا توجد مهام</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
