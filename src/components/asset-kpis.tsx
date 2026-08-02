import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, DashGrid, fmtSAR } from "@/components/dash-bits";
import { Car, Map as MapIcon, DollarSign, AlertTriangle } from "lucide-react";

/**
 * بطاقات مؤشرات الأصل (مركبات / أراضي) — المصدر الوحيد للإحصائيات
 * بعد دمج لوحات التحكم داخل صفحات الأصول نفسها (منع التكرار).
 */
export function AssetKpis({ kind }: { kind: "vehicle" | "land" }) {
  const table = kind === "vehicle" ? "vehicles" : "lands";
  const { data } = useQuery(
    queryOptions({
      queryKey: ["asset-kpis", kind],
      queryFn: async () => {
        const [a, t, m] = await Promise.all([
          (supabase as any).from(table).select("*").eq("archived", false),
          (supabase as any)
            .from("transactions")
            .select("amount,txn_type,category,txn_date")
            .eq("entity_type", kind),
          (supabase as any)
            .from("maintenance_requests")
            .select("cost,reported_at,completed_at,entity_type")
            .eq("entity_type", kind),
        ]);
        return { items: a.data ?? [], txns: t.data ?? [], maint: m.data ?? [] };
      },
    }),
  );

  const items: any[] = data?.items ?? [];
  const txns: any[] = data?.txns ?? [];
  const maint: any[] = data?.maint ?? [];

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const inMonth = (d?: string | null) => !!d && d.startsWith(ym);
  const sum = (arr: any[], f: (x: any) => number) => arr.reduce((s, x) => s + f(x), 0);
  const amt = (x: any) => Number(x.amount || 0);

  const incomeMonth = sum(txns.filter((x) => x.txn_type === "إيراد" && inMonth(x.txn_date)), amt);
  const incomeAll = sum(txns.filter((x) => x.txn_type === "إيراد"), amt);
  const expMonth =
    sum(txns.filter((x) => x.txn_type === "مصروف" && inMonth(x.txn_date)), amt) +
    sum(maint.filter((x) => inMonth(x.completed_at) || inMonth(x.reported_at)), (x) => Number(x.cost || 0));
  const expAll =
    sum(txns.filter((x) => x.txn_type === "مصروف"), amt) +
    sum(maint, (x) => Number(x.cost || 0));
  const netMonth = incomeMonth - expMonth;
  const netAll = incomeAll - expAll;
  const assets = sum(items, (x) => Number(x.current_value || 0));

  const today = new Date().toISOString().slice(0, 10);
  const in30d = new Date();
  in30d.setDate(in30d.getDate() + 30);
  const exp30 = in30d.toISOString().slice(0, 10);
  const expiring =
    kind === "vehicle"
      ? items.filter(
          (v) =>
            (v.insurance_expiry && v.insurance_expiry >= today && v.insurance_expiry <= exp30) ||
            (v.license_expiry && v.license_expiry >= today && v.license_expiry <= exp30),
        )
      : [];

  const Icon = kind === "vehicle" ? Car : MapIcon;
  const activeCount =
    kind === "vehicle"
      ? items.filter((x) => x.status === "نشط").length
      : items.filter((x) => String(x.status || "").includes("متاحة")).length;

  return (
    <div className="mb-5">
      <DashGrid>
        <StatCard
          label={kind === "vehicle" ? "عدد المركبات" : "عدد الأراضي"}
          value={items.length}
          icon={<Icon className="h-5 w-5" />}
        />
        <StatCard label={kind === "vehicle" ? "نشطة" : "متاحة"} value={activeCount} tone="success" />
        <StatCard label="قيمة الأصول" value={fmtSAR(assets)} tone="primary" />
        <StatCard
          label="إيرادات الشهر"
          value={fmtSAR(incomeMonth)}
          tone="success"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard label="مصروفات الشهر" value={fmtSAR(expMonth)} tone="warning" />
        <StatCard
          label="صافي الشهر"
          value={fmtSAR(netMonth)}
          tone={netMonth >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="الصافي الإجمالي"
          value={fmtSAR(netAll)}
          tone={netAll >= 0 ? "success" : "danger"}
        />
        {kind === "vehicle" && (
          <StatCard
            label="وثائق تنتهي (30 يوم)"
            value={expiring.length}
            tone={expiring.length ? "warning" : "default"}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        )}
      </DashGrid>
    </div>
  );
}
