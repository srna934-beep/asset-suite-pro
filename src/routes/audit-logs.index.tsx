import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AdminOnly } from "@/components/admin-only";
import { sb } from "@/lib/sb";
import { History } from "lucide-react";

export const Route = createFileRoute("/audit-logs/")({
  head: () => ({ meta: [{ title: "سجل التدقيق | منصة الأصول" }] }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const { data = [] } = useQuery(queryOptions({
    queryKey: ["audit-logs"],
    queryFn: async () => (await sb("audit_logs").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  }));
  const rows = data as any[];

  return (
    <AdminOnly>
    <DashboardLayout title="سجل التدقيق" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700"><History className="h-6 w-6" /></div>}>
      <p className="mb-4 text-sm text-muted-foreground">آخر 200 عملية على الجداول الحساسة. متاحة للمدراء فقط.</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">العملية</th>
              <th className="px-4 py-3">الجدول</th><th className="px-4 py-3">السجل</th>
              <th className="px-4 py-3">المستخدم</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleString("ar")}</td>
                  <td className="px-4 py-3 font-bold">{r.action}</td>
                  <td className="px-4 py-3">{r.table_name}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{r.record_id?.slice(0, 8) ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{r.user_id?.slice(0, 8) ?? "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">لا توجد عمليات مسجلة بعد. أو ليس لديك صلاحية مدير لعرض السجل.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
