import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, DashGrid, Section, fmtSAR } from "@/components/dash-bits";
import { Car, Wrench, DollarSign, ArrowLeft, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/vehicles-dashboard/")({
  head: () => ({ meta: [{ title: "لوحة المركبات" }] }),
  component: VehiclesDashboard,
});

function VehiclesDashboard() {
  const { data } = useQuery(queryOptions({
    queryKey: ["dash-vehicles"],
    queryFn: async () => {
      const [v, t, m] = await Promise.all([
        (supabase as any).from("vehicles").select("*").eq("archived", false),
        (supabase as any).from("transactions").select("amount,txn_type,category").eq("entity_type", "vehicle"),
        (supabase as any).from("maintenance_requests").select("cost"),
      ]);
      return { vehicles: v.data ?? [], txns: t.data ?? [], maint: m.data ?? [] };
    },
  }));
  const d: any = data ?? {};
  const vehicles = d.vehicles ?? []; const txns = d.txns ?? [];
  const active = vehicles.filter((x: any) => x.status === "نشط" || x.status === "يعمل").length;
  const inactive = vehicles.length - active;
  const revenue = txns.filter((x: any) => x.txn_type === "إيراد").reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const sum = (cat: string) => txns.filter((x: any) => x.txn_type === "مصروف" && (x.category || "").includes(cat)).reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const fuel = sum("وقود"); const insurance = sum("تأمين"); const license = sum("استمارة") + sum("ترخيص"); const salaries = sum("راتب") + sum("رواتب");
  const maintCost = (d.maint ?? []).reduce((s: number, x: any) => s + Number(x.cost || 0), 0);
  const totalExp = txns.filter((x: any) => x.txn_type === "مصروف").reduce((s: number, x: any) => s + Number(x.amount || 0), 0);
  const net = revenue - totalExp - maintCost;
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);
  const exp30 = in30.toISOString().slice(0, 10);
  const insExpiring = vehicles.filter((v: any) => v.insurance_expiry && v.insurance_expiry >= today && v.insurance_expiry <= exp30);
  const licExpiring = vehicles.filter((v: any) => v.license_expiry && v.license_expiry >= today && v.license_expiry <= exp30);
  const assets = vehicles.reduce((s: number, x: any) => s + Number(x.current_value || 0), 0);

  return (
    <DashboardLayout title="لوحة المركبات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Car className="h-6 w-6" /></div>}>
      <div className="space-y-4">
        <DashGrid>
          <StatCard label="عدد المركبات" value={vehicles.length} icon={<Car className="h-5 w-5 text-sky-600" />} />
          <StatCard label="نشطة" value={active} tone="success" />
          <StatCard label="غير نشطة" value={inactive} tone="warning" />
          <StatCard label="قيمة الأصول" value={fmtSAR(assets)} tone="primary" />
          <StatCard label="الإيرادات" value={fmtSAR(revenue)} tone="success" icon={<DollarSign className="h-5 w-5" />} />
          <StatCard label="الوقود" value={fmtSAR(fuel)} tone="warning" />
          <StatCard label="الصيانة" value={fmtSAR(maintCost)} tone="warning" icon={<Wrench className="h-5 w-5" />} />
          <StatCard label="رواتب السائقين" value={fmtSAR(salaries)} tone="warning" />
          <StatCard label="التأمين" value={fmtSAR(insurance)} tone="warning" />
          <StatCard label="الاستمارات" value={fmtSAR(license)} tone="warning" />
          <StatCard label="إجمالي المصروفات" value={fmtSAR(totalExp + maintCost)} tone="danger" />
          <StatCard label="صافي الربح" value={fmtSAR(net)} tone={net >= 0 ? "success" : "danger"} />
        </DashGrid>
        <Section title="تنبيهات قريبة الانتهاء (30 يوم)" action={<AlertTriangle className="h-4 w-4 text-amber-600" />}>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-bold">تأمين</div>
              {insExpiring.length === 0 ? <p className="text-xs text-muted-foreground">لا يوجد</p> :
                <ul className="space-y-1 text-sm">{insExpiring.slice(0,5).map((v: any) => <li key={v.id} className="flex justify-between"><span>{v.name} • {v.plate_number}</span><span className="text-amber-700">{v.insurance_expiry}</span></li>)}</ul>}
            </div>
            <div>
              <div className="mb-2 text-sm font-bold">استمارة</div>
              {licExpiring.length === 0 ? <p className="text-xs text-muted-foreground">لا يوجد</p> :
                <ul className="space-y-1 text-sm">{licExpiring.slice(0,5).map((v: any) => <li key={v.id} className="flex justify-between"><span>{v.name} • {v.plate_number}</span><span className="text-amber-700">{v.license_expiry}</span></li>)}</ul>}
            </div>
          </div>
        </Section>
        <Section title="روابط سريعة">
          <div className="flex flex-wrap gap-2">
            {[["/vehicles","المركبات"],["/transactions","الحركات المالية"],["/maintenance","الصيانة"],["/documents","الوثائق"]].map(([to,l]) => (
              <Link key={to} to={to} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted">{l}<ArrowLeft className="h-3 w-3" /></Link>
            ))}
          </div>
        </Section>
      </div>
    </DashboardLayout>
  );
}
