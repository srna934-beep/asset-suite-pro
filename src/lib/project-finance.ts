import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProjectMoneyRow = {
  id: string;
  date: string | null;
  kind: "إيراد" | "مصروف";
  label: string;
  projectId: string | null;
  amount: number;
  isSalary?: boolean;
};

export type ProjectFinance = {
  rows: ProjectMoneyRow[];
  txns: any[];
  expenses: any[];
  maint: any[];
  payments: any[];
};

/**
 * كل الحركات المالية المرتبطة بالمشاريع من مصدر واحد:
 * الحركات المالية + المصاريف + الصيانة + الدفعات — لتنعكس تلقائياً في
 * الميزانية والمالية ولوحة التحكم والأرباح والتقارير بدون إدخال مزدوج.
 */
export const projectFinanceQuery = queryOptions({
  queryKey: ["project-finance"],
  queryFn: async (): Promise<ProjectFinance> => {
    const [t, e, m, p] = await Promise.all([
      (supabase as any).from("transactions").select("*").not("project_id", "is", null),
      (supabase as any).from("expenses").select("*").not("project_id", "is", null),
      (supabase as any).from("maintenance_requests").select("*").not("project_id", "is", null),
      (supabase as any).from("payments").select("*").not("project_id", "is", null),
    ]);
    const txns = (t.data ?? []) as any[];
    const expenses = (e.data ?? []) as any[];
    const maint = (m.data ?? []) as any[];
    const payments = (p.data ?? []) as any[];

    const rows: ProjectMoneyRow[] = [];
    for (const x of txns) {
      const salary = x.txn_type === "راتب موظف" || String(x.category ?? "").includes("رات");
      rows.push({
        id: `t-${x.id}`, date: x.txn_date ?? null,
        kind: x.txn_type === "إيراد" ? "إيراد" : "مصروف",
        label: x.category ?? x.description ?? "حركة مالية",
        projectId: x.project_id ?? null, amount: Number(x.amount || 0), isSalary: salary,
      });
    }
    for (const x of expenses) {
      rows.push({
        id: `e-${x.id}`, date: x.expense_date ?? null, kind: "مصروف",
        label: x.category ?? x.description ?? "مصروف",
        projectId: x.project_id ?? null, amount: Number(x.amount || 0),
      });
    }
    for (const x of maint) {
      rows.push({
        id: `m-${x.id}`, date: x.completed_at ?? x.reported_at ?? null, kind: "مصروف",
        label: `صيانة: ${x.title ?? ""}`,
        projectId: x.project_id ?? null, amount: Number(x.cost || 0),
      });
    }
    for (const x of payments) {
      rows.push({
        id: `p-${x.id}`, date: x.paid_date ?? x.due_date ?? null, kind: "إيراد",
        label: "دفعة مستحقة", projectId: x.project_id ?? null, amount: Number(x.amount || 0),
      });
    }

    rows.sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
    return { rows, txns, expenses, maint, payments };
  },
});

export function aggregateProject(fin: ProjectFinance | undefined, projectId?: string) {
  const rows = (fin?.rows ?? []).filter((r) => (projectId ? r.projectId === projectId : true));
  const ym = new Date().toISOString().slice(0, 7);
  const income = rows.filter((r) => r.kind === "إيراد").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.kind === "مصروف").reduce((s, r) => s + r.amount, 0);
  const salaries = rows.filter((r) => r.isSalary).reduce((s, r) => s + r.amount, 0);
  const incomeMonth = rows.filter((r) => r.kind === "إيراد" && String(r.date ?? "").startsWith(ym)).reduce((s, r) => s + r.amount, 0);
  const expenseMonth = rows.filter((r) => r.kind === "مصروف" && String(r.date ?? "").startsWith(ym)).reduce((s, r) => s + r.amount, 0);
  return { rows, income, expense, salaries, net: income - expense, incomeMonth, expenseMonth, netMonth: incomeMonth - expenseMonth };
}
