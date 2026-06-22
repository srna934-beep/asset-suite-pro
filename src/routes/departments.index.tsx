import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Building } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";

export const Route = createFileRoute("/departments/")({
  head: () => ({ meta: [{ title: "الأقسام | منصة الأصول" }] }),
  component: DepartmentsPage,
});

const FIELDS: FieldDef[] = [
  { name: "name", label: "اسم القسم", required: true },
  { name: "description", label: "الوصف", type: "textarea" },
];
const INV = [["departments-list"]];

function DepartmentsPage() {
  const { data = [] } = useQuery(queryOptions({
    queryKey: ["departments-list"],
    queryFn: async () => (await supabase.from("departments" as any).select("*").order("name")).data ?? [],
  }));
  return (
    <DashboardLayout title="الأقسام" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Building className="h-6 w-6" /></div>}>
      <div className="mb-4 flex justify-end">
        <RecordDialog table="departments" title="إضافة قسم" fields={FIELDS} invalidate={INV} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data as any[]).map((d: any) => (
          <div key={d.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-extrabold">{d.name}</h3>
              <div className="flex gap-1">
                <RecordDialog table="departments" title="تعديل القسم" fields={FIELDS} initial={d} invalidate={INV} />
                <DeleteButton table="departments" id={d.id} invalidate={INV} />
              </div>
            </div>
            {d.description && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d.description}</p>}
          </div>
        ))}
        {(data as any[]).length === 0 && <div className="col-span-full py-12 text-center text-muted-foreground">لا توجد أقسام. أضف أول قسم.</div>}
      </div>
    </DashboardLayout>
  );
}
