import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { StatusPill } from "@/components/status-pill";
import { fmtSAR } from "@/components/dash-bits";
import { AttachmentsButton } from "@/components/attachments-panel";
import { TrendingUp, TrendingDown, Wallet, Wrench, DollarSign, Users, FileText, Activity } from "lucide-react";
import { useAssetOptions } from "@/lib/asset-options";

type AssetType = "property" | "vehicle" | "land" | "unit";

export function AssetFinanceTabs({
  assetType, assetId, responsibleEmployeeId,
}: { assetType: AssetType; assetId: string; responsibleEmployeeId?: string | null }) {
  const { nameById } = useAssetOptions();
  const { data } = useQuery(queryOptions({
    queryKey: ["asset-finance", assetType, assetId],
    queryFn: async () => {
      const [txns, expenses, maint] = await Promise.all([
        supabase.from("transactions" as any).select("*").eq("entity_type", assetType).eq("entity_id", assetId).order("txn_date", { ascending: false }),
        supabase.from("expenses" as any).select("*").eq("entity_type", assetType).eq("entity_id", assetId).order("expense_date", { ascending: false }),
        supabase.from("maintenance_requests" as any).select("*").eq("entity_type", assetType).eq("entity_id", assetId).order("reported_at", { ascending: false }),
      ]);
      return {
        transactions: (txns.data ?? []) as any[],
        expenses: (expenses.data ?? []) as any[],
        maintenance: (maint.data ?? []) as any[],
      };
    },
  }));

  const txns = data?.transactions ?? [];
  const expenses = data?.expenses ?? [];
  const maint = data?.maintenance ?? [];

  const income = txns.filter((t) => t.txn_type === "إيراد").reduce((s, t) => s + Number(t.amount), 0);
  const outflow = txns.filter((t) => t.txn_type === "مصروف" || t.txn_type === "راتب موظف").reduce((s, t) => s + Number(t.amount), 0);
  const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const maintCost = maint.reduce((s, m) => s + Number(m.cost ?? 0), 0);
  const totalOut = outflow + expensesTotal + maintCost;
  const net = income - totalOut;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatMini label="الإيرادات" value={fmtSAR(income)} icon={<TrendingUp className="h-5 w-5" />} tone="bg-emerald-50 border-emerald-200 text-emerald-700" />
        <StatMini label="المصروفات" value={fmtSAR(outflow + expensesTotal)} icon={<TrendingDown className="h-5 w-5" />} tone="bg-rose-50 border-rose-200 text-rose-700" />
        <StatMini label="تكلفة الصيانة" value={fmtSAR(maintCost)} icon={<Wrench className="h-5 w-5" />} tone="bg-amber-50 border-amber-200 text-amber-700" />
        <StatMini label="صافي الربح" value={fmtSAR(net)} icon={<Wallet className="h-5 w-5" />} tone={net >= 0 ? "bg-sky-50 border-sky-200 text-sky-700" : "bg-rose-50 border-rose-200 text-rose-700"} />
      </div>

      {responsibleEmployeeId && (
        <Section title="المسؤول عن الأصل" icon={<Users className="h-5 w-5 text-primary" />}>
          <div className="px-5 py-4 text-sm">
            <div className="inline-flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 font-semibold text-primary">
              <Users className="h-4 w-4" /> {nameById[responsibleEmployeeId] ?? "—"}
            </div>
          </div>
        </Section>
      )}

      <Section title="الإيرادات والمصروفات (الحركات المالية)" icon={<DollarSign className="h-5 w-5 text-emerald-600" />}>
        <table className="w-full min-w-[600px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">النوع</th>
            <th className="px-4 py-3">التصنيف</th><th className="px-4 py-3">الوصف</th>
            <th className="px-4 py-3">المبلغ</th>
          </tr></thead>
          <tbody>
            {txns.map((t: any) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted-foreground">{t.txn_date}</td>
                <td className="px-4 py-3"><StatusPill tone={t.txn_type === "إيراد" ? "success" : "danger"}>{t.txn_type}</StatusPill></td>
                <td className="px-4 py-3">{t.category ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.description ?? "—"}</td>
                <td className={`px-4 py-3 font-bold ${t.txn_type === "إيراد" ? "text-emerald-600" : "text-rose-600"}`}>{fmtSAR(t.amount)}</td>
              </tr>
            ))}
            {txns.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">لا توجد حركات مالية</td></tr>}
          </tbody>
        </table>
      </Section>

      <Section title="المصاريف المباشرة" icon={<Wallet className="h-5 w-5 text-rose-600" />}>
        <table className="w-full min-w-[500px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">الفئة</th>
            <th className="px-4 py-3">الوصف</th><th className="px-4 py-3">المبلغ</th>
          </tr></thead>
          <tbody>
            {expenses.map((e: any) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted-foreground">{e.expense_date}</td>
                <td className="px-4 py-3 font-medium">{e.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.description ?? "—"}</td>
                <td className="px-4 py-3 font-semibold text-rose-600">{fmtSAR(e.amount)}</td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">لا توجد مصاريف</td></tr>}
          </tbody>
        </table>
      </Section>

      <Section title="طلبات الصيانة" icon={<Wrench className="h-5 w-5 text-sky-600" />}>
        <table className="w-full min-w-[600px] text-right text-sm">
          <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">العنوان</th>
            <th className="px-4 py-3">الفني</th><th className="px-4 py-3">الحالة</th><th className="px-4 py-3">التكلفة</th>
          </tr></thead>
          <tbody>
            {maint.map((m: any) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted-foreground">{m.reported_at}</td>
                <td className="px-4 py-3 font-medium">{m.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.assigned_to ?? "—"}</td>
                <td className="px-4 py-3"><StatusPill tone={m.status === "مكتمل" ? "success" : m.status === "قيد التنفيذ" ? "info" : "warning"}>{m.status}</StatusPill></td>
                <td className="px-4 py-3 font-semibold">{fmtSAR(m.cost)}</td>
              </tr>
            ))}
            {maint.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">لا توجد طلبات صيانة</td></tr>}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

export function Section({ title, icon, action, children }: { title: string; icon?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">{icon}<h3 className="text-base font-extrabold">{title}</h3></div>
        {action}
      </header>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export function StatMini({ label, value, icon, tone }: { label: string; value: string; icon?: ReactNode; tone: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-4 ${tone}`}>
      {icon}
      <div className="min-w-0">
        <div className="text-xs font-bold opacity-80">{label}</div>
        <div className="mt-0.5 truncate text-lg font-extrabold">{value}</div>
      </div>
    </div>
  );
}

export function BackNav({ links }: { links: { to: any; params?: any; label: string }[] }) {
  return (
    <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
      {links.map((l, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span>/</span>}
          {i < links.length - 1 ? (
            <Link to={l.to} params={l.params} className="hover:text-primary">{l.label}</Link>
          ) : (
            <span className="font-medium text-foreground">{l.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function AssetDocsAndActivity({ entityType, entityId }: { entityType: string; entityId: string }) {
  const { data } = useQuery(queryOptions({
    queryKey: ["asset-side", entityType, entityId],
    queryFn: async () => {
      const [logs] = await Promise.all([
        supabase.from("audit_logs" as any).select("*").eq("record_id", entityId).order("created_at", { ascending: false }).limit(10),
      ]);
      return { logs: (logs.data ?? []) as any[] };
    },
  }));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="المستندات" icon={<FileText className="h-5 w-5 text-orange-600" />}
        action={<AttachmentsButton entityType={entityType} entityId={entityId} />}>
        <div className="px-5 py-4 text-sm text-muted-foreground">
          اضغط على "المرفقات" في الأعلى لعرض أو رفع المستندات المرتبطة بهذا الأصل.
        </div>
      </Section>
      <Section title="السجل الزمني" icon={<Activity className="h-5 w-5 text-sky-600" />}>
        <ul className="divide-y divide-border">
          {(data?.logs ?? []).map((l: any) => (
            <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="truncate">{l.action} · {l.table_name}</span>
              <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("ar")}</span>
            </li>
          ))}
          {(!data?.logs || data.logs.length === 0) && (
            <li className="px-5 py-6 text-center text-sm text-muted-foreground">لا توجد سجلات</li>
          )}
        </ul>
      </Section>
    </div>
  );
}
