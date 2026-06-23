import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { sb } from "@/lib/sb";
import { Calculator, TrendingUp, TrendingDown } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { ExportCsvButton } from "@/components/export-csv-button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid } from "recharts";

export const Route = createFileRoute("/transactions/")({
  head: () => ({ meta: [{ title: "الحركات المالية | منصة الأصول" }] }),
  component: TransactionsPage,
});

const INV = [["transactions-list"], ["accounts-list"], ["dashboard-totals"]];

function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  const { data } = useQuery(queryOptions({
    queryKey: ["transactions-list"],
    queryFn: async () => {
      const [{ data: txns }, { data: accs }] = await Promise.all([
        sb("transactions").select("*").order("txn_date", { ascending: false }).limit(500),
        sb("accounts").select("id, name, currency"),
      ]);
      return { txns: (txns ?? []) as any[], accs: (accs ?? []) as any[] };
    },
  }));

  const accs = data?.accs ?? [];
  const txns = data?.txns ?? [];
  const accName = (id: string) => accs.find((a: any) => a.id === id)?.name ?? "—";

  const FIELDS: FieldDef[] = useMemo(() => [
    { name: "txn_date", label: "التاريخ", type: "date", required: true },
    { name: "account_id", label: "الحساب", type: "select", required: true,
      options: accs.map((a: any) => ({ value: a.id, label: a.name })) },
    { name: "txn_type", label: "نوع الحركة", type: "select", required: true, options: [
      { value: "إيراد", label: "إيراد" }, { value: "مصروف", label: "مصروف" }, { value: "تحويل", label: "تحويل" },
    ]},
    { name: "category", label: "التصنيف", placeholder: "مثل: إيجار، رواتب، صيانة" },
    { name: "amount", label: "المبلغ", type: "number", required: true },
    { name: "description", label: "الوصف", type: "textarea" },
  ], [accs]);

  const filtered = useMemo(() => {
    let r = txns;
    if (search) { const s = search.toLowerCase(); r = r.filter((t: any) => t.description?.toLowerCase().includes(s) || t.category?.toLowerCase().includes(s)); }
    if (type) r = r.filter((t: any) => t.txn_type === type);
    return r;
  }, [txns, search, type]);

  const totalIn = filtered.filter((t: any) => t.txn_type === "إيراد").reduce((s, t: any) => s + Number(t.amount), 0);
  const totalOut = filtered.filter((t: any) => t.txn_type === "مصروف").reduce((s, t: any) => s + Number(t.amount), 0);

  const monthly = useMemo(() => {
    const map: Record<string, { month: string; إيراد: number; مصروف: number }> = {};
    for (const t of filtered as any[]) {
      const m = (t.txn_date ?? "").slice(0, 7);
      if (!m) continue;
      if (!map[m]) map[m] = { month: m, إيراد: 0, مصروف: 0 };
      if (t.txn_type === "إيراد") map[m]["إيراد"] += Number(t.amount);
      else if (t.txn_type === "مصروف") map[m]["مصروف"] += Number(t.amount);
    }
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [filtered]);

  return (
    <DashboardLayout title="الحركات المالية" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Calculator className="h-6 w-6" /></div>}>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700"><TrendingUp className="h-4 w-4" /> إجمالي الإيرادات</div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">{totalIn.toLocaleString()} ر.س</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700"><TrendingDown className="h-4 w-4" /> إجمالي المصاريف</div>
          <div className="mt-2 text-2xl font-extrabold text-rose-700">{totalOut.toLocaleString()} ر.س</div>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="text-xs font-bold text-primary">صافي الربح/الخسارة</div>
          <div className={`mt-2 text-2xl font-extrabold ${totalIn - totalOut >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{(totalIn - totalOut).toLocaleString()} ر.س</div>
        </div>
      </div>

      <ListToolbar
        search={search} onSearch={setSearch}
        filters={[{ value: type, onChange: setType, placeholder: "كل الأنواع", options: [
          { value: "إيراد", label: "إيراد" }, { value: "مصروف", label: "مصروف" }, { value: "تحويل", label: "تحويل" },
        ]}]}
      >
        <ExportCsvButton rows={filtered} filename="transactions" columns={[
          { key: "txn_date", label: "التاريخ" }, { key: "txn_type", label: "النوع" },
          { key: "category", label: "التصنيف" }, { key: "description", label: "الوصف" },
          { key: "amount", label: "المبلغ" },
        ]} />
        <RecordDialog table="transactions" title="إضافة حركة مالية" fields={FIELDS} invalidate={INV}
          defaults={{ txn_date: new Date().toISOString().slice(0, 10) }} />
      </ListToolbar>

      {monthly.length > 0 && (
        <div className="mb-5 rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-extrabold">الإيرادات والمصاريف الشهرية</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="إيراد" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="مصروف" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">الحساب</th><th className="px-4 py-3">التصنيف</th>
              <th className="px-4 py-3">الوصف</th><th className="px-4 py-3">المبلغ</th>
              <th className="px-4 py-3">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((t: any) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-4 py-3 text-muted-foreground">{t.txn_date}</td>
                  <td className="px-4 py-3"><StatusPill tone={t.txn_type === "إيراد" ? "success" : t.txn_type === "مصروف" ? "danger" : "info"}>{t.txn_type}</StatusPill></td>
                  <td className="px-4 py-3">{accName(t.account_id)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.category ?? "—"}</td>
                  <td className="px-4 py-3">{t.description ?? "—"}</td>
                  <td className={`px-4 py-3 font-bold ${t.txn_type === "إيراد" ? "text-emerald-600" : t.txn_type === "مصروف" ? "text-rose-600" : ""}`}>{Number(t.amount).toLocaleString()} ر.س</td>
                  <td className="px-4 py-3"><div className="flex gap-1">
                    <RecordDialog table="transactions" title="تعديل الحركة" fields={FIELDS} initial={t} invalidate={INV} />
                    <DeleteButton table="transactions" id={t.id} invalidate={INV} />
                  </div></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">لا توجد حركات. أضف أول حركة مالية.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
