import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Wallet } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";

export const Route = createFileRoute("/accounts/")({
  head: () => ({ meta: [{ title: "الحسابات | منصة الأصول" }] }),
  component: AccountsPage,
});

const FIELDS: FieldDef[] = [
  { name: "name", label: "اسم الحساب", required: true },
  { name: "account_type", label: "النوع", type: "select", required: true, options: [
    { value: "نقدي", label: "صندوق نقدي" }, { value: "بنكي", label: "حساب بنكي" },
  ]},
  { name: "bank_name", label: "اسم البنك" },
  { name: "account_number", label: "رقم الحساب/IBAN" },
  { name: "opening_balance", label: "الرصيد الافتتاحي", type: "number" },
  { name: "currency", label: "العملة", type: "select", options: [
    { value: "SAR", label: "ر.س" }, { value: "USD", label: "$" }, { value: "AED", label: "د.إ" },
  ]},
  { name: "notes", label: "ملاحظات", type: "textarea" },
];
const INV = [["accounts-list"], ["transactions-list"]];

function AccountsPage() {
  const { data } = useQuery(queryOptions({
    queryKey: ["accounts-list"],
    queryFn: async () => {
      const [{ data: accs }, { data: txns }] = await Promise.all([
        supabase.from("accounts" as any).select("*").eq("archived", false).order("name"),
        supabase.from("transactions" as any).select("account_id, txn_type, amount"),
      ]);
      return { accs: accs ?? [], txns: txns ?? [] };
    },
  }));

  const accs: any[] = (data?.accs ?? []) as any[];
  const txns: any[] = (data?.txns ?? []) as any[];
  const balance = (id: string) => {
    const opening = Number(accs.find((a) => a.id === id)?.opening_balance ?? 0);
    const sum = txns.filter((t) => t.account_id === id)
      .reduce((s, t) => s + (t.txn_type === "إيراد" ? Number(t.amount) : t.txn_type === "مصروف" ? -Number(t.amount) : 0), 0);
    return opening + sum;
  };

  return (
    <DashboardLayout title="الحسابات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Wallet className="h-6 w-6" /></div>}>
      <div className="mb-4 flex justify-end">
        <RecordDialog table="accounts" title="إضافة حساب" fields={FIELDS} invalidate={INV} defaults={{ currency: "SAR", opening_balance: 0 }} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accs.map((a) => (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-muted-foreground">{a.account_type}{a.bank_name ? ` • ${a.bank_name}` : ""}</div>
                <h3 className="mt-1 text-lg font-extrabold">{a.name}</h3>
              </div>
              <div className="flex gap-1">
                <RecordDialog table="accounts" title="تعديل الحساب" fields={FIELDS} initial={a} invalidate={INV} />
                <DeleteButton table="accounts" id={a.id} invalidate={INV} />
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <div className="text-xs text-muted-foreground">الرصيد الحالي</div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-600">{balance(a.id).toLocaleString()} {a.currency}</div>
            </div>
            {a.account_number && <div className="mt-2 text-[11px] text-muted-foreground font-mono">{a.account_number}</div>}
          </div>
        ))}
        {accs.length === 0 && <div className="col-span-full py-12 text-center text-muted-foreground">لا توجد حسابات. أضف حساباً نقدياً أو بنكياً للبدء.</div>}
      </div>
    </DashboardLayout>
  );
}
