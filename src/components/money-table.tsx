import { Section } from "@/components/asset-detail";
import { StatusPill } from "@/components/status-pill";
import { fmtSAR } from "@/components/dash-bits";
import { DollarSign, BarChart3 } from "lucide-react";
import { useEntityFinance, monthlyReport, type EntityKind, type MoneyRow } from "@/lib/entity-finance";
import { ExportCsvButton } from "@/components/export-csv-button";

/** جدول الحركات المالية الموحّد (إيراد/مصروف/صيانة). */
export function MoneyMovements({
  rows, title = "السجل المالي", nameById, entityLabel = "الأصل", limit = 40,
}: { rows: MoneyRow[]; title?: string; nameById?: Record<string, string>; entityLabel?: string; limit?: number }) {
  const list = rows.slice(0, limit);
  return (
    <Section
      title={title}
      icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
      action={
        <ExportCsvButton
          rows={list.map((r) => ({ ...r, entity: r.entityId ? nameById?.[r.entityId] ?? r.entityId : "—" }))}
          filename="financial-log"
          columns={[
            { key: "date", label: "التاريخ" }, { key: "kind", label: "النوع" },
            { key: "label", label: "البيان" }, { key: "entity", label: entityLabel },
            { key: "amount", label: "المبلغ" },
          ]}
        />
      }
    >
      <table className="w-full min-w-[720px] text-right text-sm">
        <thead>
          <tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">التاريخ</th>
            <th className="px-4 py-3">النوع</th>
            <th className="px-4 py-3">البيان</th>
            {nameById && <th className="px-4 py-3">{entityLabel}</th>}
            <th className="px-4 py-3">المبلغ</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id} className="border-t border-border hover:bg-muted/30">
              <td className="px-4 py-3 text-muted-foreground">{r.date ?? "—"}</td>
              <td className="px-4 py-3"><StatusPill tone={r.kind === "إيراد" ? "success" : "danger"}>{r.kind}</StatusPill></td>
              <td className="px-4 py-3">{r.label}</td>
              {nameById && <td className="px-4 py-3 text-muted-foreground">{r.entityId ? nameById[r.entityId] ?? "—" : "—"}</td>}
              <td className={`px-4 py-3 font-bold ${r.kind === "إيراد" ? "text-emerald-600" : "text-rose-600"}`}>{fmtSAR(r.amount)}</td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr><td colSpan={nameById ? 5 : 4} className="px-4 py-8 text-center text-muted-foreground">لا توجد حركات مالية</td></tr>
          )}
        </tbody>
      </table>
    </Section>
  );
}

/** تقرير شهري (آخر 6 أشهر) لأي مجموعة حركات. */
export function MonthlyReportTable({ rows, title = "التقارير المالية (آخر 6 أشهر)" }: { rows: MoneyRow[]; title?: string }) {
  const data = monthlyReport(rows);
  const t = data.reduce((s, b) => ({ income: s.income + b.income, expense: s.expense + b.expense }), { income: 0, expense: 0 });
  return (
    <Section
      title={title}
      icon={<BarChart3 className="h-5 w-5 text-slate-600" />}
      action={<ExportCsvButton rows={data} filename="monthly-report" columns={[
        { key: "m", label: "الشهر" }, { key: "income", label: "الإيرادات" },
        { key: "expense", label: "المصروفات" }, { key: "net", label: "الصافي" },
      ]} />}
    >
      <table className="w-full min-w-[520px] text-right text-sm">
        <thead>
          <tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
            <th className="px-4 py-3">الشهر</th><th className="px-4 py-3">الإيرادات</th>
            <th className="px-4 py-3">المصروفات</th><th className="px-4 py-3">الصافي</th>
          </tr>
        </thead>
        <tbody>
          {data.map((b) => (
            <tr key={b.m} className="border-t border-border">
              <td className="px-4 py-3 font-semibold" dir="ltr">{b.m}</td>
              <td className="px-4 py-3 text-emerald-600 font-semibold">{fmtSAR(b.income)}</td>
              <td className="px-4 py-3 text-rose-600 font-semibold">{fmtSAR(b.expense)}</td>
              <td className={`px-4 py-3 font-extrabold ${b.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtSAR(b.net)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-border bg-muted/30">
            <td className="px-4 py-3 font-extrabold">الإجمالي</td>
            <td className="px-4 py-3 font-extrabold text-emerald-700">{fmtSAR(t.income)}</td>
            <td className="px-4 py-3 font-extrabold text-rose-700">{fmtSAR(t.expense)}</td>
            <td className={`px-4 py-3 font-extrabold ${t.income - t.expense >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtSAR(t.income - t.expense)}</td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

/** تقرير + سجل مالي لأصل واحد (مركبة/أرض/عقار/وحدة). */
export function AssetLedgerAndReport({ kind, id }: { kind: EntityKind; id: string }) {
  const { rows } = useEntityFinance(kind);
  const mine = rows.filter((r) => r.entityId === id);
  return (
    <div className="space-y-4">
      <MonthlyReportTable rows={mine} />
      <MoneyMovements rows={mine} title="السجل المالي للأصل" />
    </div>
  );
}
