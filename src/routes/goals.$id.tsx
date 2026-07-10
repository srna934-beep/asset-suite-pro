import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { sb } from "@/lib/sb";
import { StatCard, DashGrid, Section, fmtSAR } from "@/components/dash-bits";
import { StatusPill } from "@/components/status-pill";
import { Target, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/goals/$id")({
  head: () => ({ meta: [{ title: "تفاصيل الهدف | منصة الأصول" }] }),
  component: GoalDetail,
});

function GoalDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  const { data } = useQuery(queryOptions({
    queryKey: ["goal-detail", id],
    queryFn: async () => {
      const [g, u] = await Promise.all([
        sb("goals").select("*").eq("id", id).maybeSingle(),
        sb("goal_updates").select("*").eq("goal_id", id).order("created_at", { ascending: false }),
      ]);
      return { g: g.data, updates: u.data ?? [] };
    },
  }));

  const g: any = data?.g;
  const updates = (data?.updates ?? []) as any[];
  if (!g) return <DashboardLayout title="تفاصيل الهدف"><div className="py-16 text-center text-muted-foreground">جارٍ التحميل...</div></DashboardLayout>;

  const target = Number(g.target_value || 0);
  const current = Number(g.current_value || 0);
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const remaining = Math.max(0, target - current);
  const daysLeft = g.end_date ? Math.round((new Date(g.end_date).getTime() - Date.now()) / 86400000) : null;

  async function addUpdate() {
    const v = Number(value);
    if (!v && !note) { toast.error("أدخل قيمة أو ملاحظة"); return; }
    const newCurrent = current + (v || 0);
    const { error: e1 } = await sb("goal_updates").insert({ goal_id: id, value_delta: v || 0, note });
    if (e1) { toast.error("تعذر إضافة التحديث"); return; }
    if (v) await sb("goals").update({ current_value: newCurrent }).eq("id", id);
    toast.success("تم تحديث الهدف");
    setValue(""); setNote("");
    qc.invalidateQueries({ queryKey: ["goal-detail", id] });
  }

  return (
    <DashboardLayout title={g.name} icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Target className="h-6 w-6" /></div>}>
      <Link to="/goals" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowRight className="h-4 w-4" /> رجوع للأهداف</Link>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <StatusPill tone={g.status === "مكتمل" ? "success" : g.status === "متأخر" || g.status === "ملغي" ? "danger" : "muted"}>{g.status}</StatusPill>
        <span>النوع: {g.goal_type}</span>
        <span>النطاق: {g.scope}</span>
        {g.priority && <span>الأولوية: {g.priority}</span>}
      </div>

      {g.description && <p className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm">{g.description}</p>}

      <DashGrid>
        <StatCard label="المستهدف" value={target.toLocaleString()} tone="sky" />
        <StatCard label="المنجز" value={current.toLocaleString()} tone="emerald" />
        <StatCard label="المتبقي" value={remaining.toLocaleString()} tone="amber" />
        <StatCard label="نسبة الإنجاز" value={`${pct}%`} tone={pct >= 100 ? "emerald" : pct >= 50 ? "sky" : "amber"} />
        {daysLeft !== null && <StatCard label="الأيام المتبقية" value={String(daysLeft)} tone={daysLeft < 0 ? "rose" : daysLeft < 15 ? "amber" : "sky"} />}
      </DashGrid>

      <Section title="شريط الإنجاز">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full ${pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-sky-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 text-center text-sm font-bold">{pct}%</div>
        </div>
      </Section>

      <Section title="إضافة تحديث">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="القيمة المضافة" className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة" className="h-10 rounded-lg border border-border bg-background px-3 text-sm md:col-span-2" />
          </div>
          <button onClick={addUpdate} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">إضافة تحديث</button>
        </div>
      </Section>

      <Section title="سجل التحديثات">
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[500px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3">المقدار</th>
              <th className="px-4 py-3">ملاحظة</th>
            </tr></thead>
            <tbody>
              {updates.map((u: any) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 text-xs">{String(u.created_at).slice(0, 10)}</td>
                  <td className="px-4 py-3 font-bold text-emerald-700">+{Number(u.value_delta || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.note ?? "—"}</td>
                </tr>
              ))}
              {updates.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">لا توجد تحديثات بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </DashboardLayout>
  );
}
