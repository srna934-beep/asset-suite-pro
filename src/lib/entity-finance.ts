import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export type EntityKind = "vehicle" | "land" | "property" | "unit";

export type MoneyRow = {
  id: string;
  date: string | null;
  kind: "إيراد" | "مصروف";
  label: string;
  entityId: string | null;
  amount: number;
  status?: string | null;
};

export type Agg = { income: number; expense: number; net: number; incomeMonth: number; expenseMonth: number; netMonth: number; maint: number };

export const emptyAgg: Agg = { income: 0, expense: 0, net: 0, incomeMonth: 0, expenseMonth: 0, netMonth: 0, maint: 0 };

export function ymNow() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

/** كل الحركات المالية (حركات + مصاريف + صيانة) لنوع أصل واحد — مصدر موحّد للأرقام. */
export function useEntityFinance(kind: EntityKind) {
  const { data } = useQuery(
    queryOptions({
      queryKey: ["entity-finance", kind],
      queryFn: async () => {
        const [txns, expenses, maint] = await Promise.all([
          (supabase as any).from("transactions").select("*").eq("entity_type", kind),
          (supabase as any).from("expenses").select("*").eq("entity_type", kind),
          (supabase as any).from("maintenance_requests").select("*").eq("entity_type", kind),
        ]);
        return {
          txns: (txns.data ?? []) as any[],
          expenses: (expenses.data ?? []) as any[],
          maint: (maint.data ?? []) as any[],
        };
      },
    }),
  );

  const d = data ?? { txns: [], expenses: [], maint: [] };

  return useMemo(() => {
    const ym = ymNow();
    const inMonth = (x?: string | null) => !!x && String(x).startsWith(ym);
    const rows: MoneyRow[] = [];

    for (const t of d.txns) {
      rows.push({
        id: `t-${t.id}`,
        date: t.txn_date ?? null,
        kind: t.txn_type === "إيراد" ? "إيراد" : "مصروف",
        label: t.category ?? t.description ?? "حركة مالية",
        entityId: t.entity_id ?? null,
        amount: Number(t.amount || 0),
      });
    }
    for (const e of d.expenses) {
      rows.push({
        id: `e-${e.id}`,
        date: e.expense_date ?? null,
        kind: "مصروف",
        label: e.category ?? e.description ?? "مصروف",
        entityId: e.entity_id ?? null,
        amount: Number(e.amount || 0),
      });
    }
    for (const m of d.maint) {
      rows.push({
        id: `m-${m.id}`,
        date: m.completed_at ?? m.reported_at ?? null,
        kind: "مصروف",
        label: `صيانة: ${m.title ?? ""}`,
        entityId: m.entity_id ?? null,
        amount: Number(m.cost || 0),
        status: m.status ?? null,
      });
    }

    const byId: Record<string, Agg> = {};
    const totals: Agg = { ...emptyAgg };
    const bump = (a: Agg, r: MoneyRow, isMaint: boolean) => {
      if (r.kind === "إيراد") {
        a.income += r.amount;
        if (inMonth(r.date)) a.incomeMonth += r.amount;
      } else {
        a.expense += r.amount;
        if (inMonth(r.date)) a.expenseMonth += r.amount;
        if (isMaint) a.maint += r.amount;
      }
      a.net = a.income - a.expense;
      a.netMonth = a.incomeMonth - a.expenseMonth;
    };
    for (const r of rows) {
      const isMaint = r.id.startsWith("m-");
      if (r.entityId) {
        byId[r.entityId] = byId[r.entityId] ?? { ...emptyAgg };
        bump(byId[r.entityId], r, isMaint);
      }
      bump(totals, r, isMaint);
    }

    const sorted = [...rows].sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
    return { rows: sorted, byId, totals, raw: d };
  }, [d]);
}

/** ملخص شهري (آخر 6 أشهر) لأي مجموعة حركات. */
export function monthlyReport(rows: MoneyRow[], months = 6) {
  const buckets: { m: string; income: number; expense: number; net: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ m: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, income: 0, expense: 0, net: 0 });
  }
  for (const r of rows) {
    const key = String(r.date ?? "").slice(0, 7);
    const b = buckets.find((x) => x.m === key);
    if (!b) continue;
    if (r.kind === "إيراد") b.income += r.amount;
    else b.expense += r.amount;
  }
  buckets.forEach((b) => (b.net = b.income - b.expense));
  return buckets;
}
