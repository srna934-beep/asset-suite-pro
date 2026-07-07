import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { UserCog, Building2, Car, Map as MapIcon, DollarSign, Phone, Mail, Calendar } from "lucide-react";
import { BackNav, Section, StatMini, AssetDocsAndActivity } from "@/components/asset-detail";
import { fmtSAR } from "@/components/dash-bits";

export const Route = createFileRoute("/employees/$id")({
  head: ({ params }) => ({ meta: [{ title: `ملف الموظف | ${params.id.slice(0, 8)}` }] }),
  component: EmployeeDetail,
});

function EmployeeDetail() {
  const { id } = Route.useParams();

  const { data } = useQuery(queryOptions({
    queryKey: ["employee-profile", id],
    queryFn: async () => {
      const [emp, dept, props, vehicles, lands, salaries] = await Promise.all([
        supabase.from("employees" as any).select("*").eq("id", id).maybeSingle(),
        supabase.from("departments" as any).select("id, name"),
        supabase.from("properties" as any).select("id, name, status").eq("responsible_employee_id", id),
        supabase.from("vehicles" as any).select("id, name, plate_number, status").eq("responsible_employee_id", id).eq("archived", false),
        supabase.from("lands" as any).select("id, name, status").eq("responsible_employee_id", id).eq("archived", false),
        supabase.from("transactions" as any).select("*").eq("employee_id", id).order("txn_date", { ascending: false }),
      ]);
      return {
        emp: emp.data as any,
        depts: (dept.data ?? []) as any[],
        properties: (props.data ?? []) as any[],
        vehicles: (vehicles.data ?? []) as any[],
        lands: (lands.data ?? []) as any[],
        salaries: (salaries.data ?? []) as any[],
      };
    },
  }));

  if (!data?.emp) return <DashboardLayout title="..."><div className="h-64 animate-pulse rounded-2xl bg-card" /></DashboardLayout>;
  const e = data.emp;
  const deptName = data.depts.find((d) => d.id === e.department_id)?.name ?? "—";
  const salariesTotal = data.salaries.reduce((s, x) => s + Number(x.amount), 0);
  const assetsCount = data.properties.length + data.vehicles.length + data.lands.length;

  return (
    <DashboardLayout title={e.full_name} icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><UserCog className="h-6 w-6" /></div>}>
      <BackNav links={[
        { to: "/", label: "لوحة التحكم" },
        { to: "/employees", label: "الموظفين" },
        { to: "/employees/$id", params: { id }, label: e.full_name },
      ]} />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid h-40 place-items-center bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50"><UserCog className="h-20 w-20 text-violet-400/60" /></div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <Info label="المسمى" value={e.position ?? "—"} />
            <Info label="القسم" value={deptName} />
            <Info label="رقم الهوية" value={e.national_id ?? "—"} />
            <Info label="الجوال" value={e.phone ?? "—"} icon={<Phone className="h-3.5 w-3.5" />} />
            <Info label="البريد" value={e.email ?? "—"} icon={<Mail className="h-3.5 w-3.5" />} />
            <Info label="تاريخ التعيين" value={e.hire_date ?? "—"} icon={<Calendar className="h-3.5 w-3.5" />} />
            <Info label="الراتب الأساسي" value={e.basic_salary ? fmtSAR(e.basic_salary) : "—"} />
            <Info label="الحالة" value={<StatusPill tone={e.status === "نشط" ? "success" : e.status === "إجازة" ? "info" : "muted"}>{e.status}</StatusPill>} />
          </div>
        </div>
        <div className="space-y-3">
          <StatMini label="عدد الأصول المسؤول عنها" value={String(assetsCount)} icon={<Building2 className="h-5 w-5" />} tone="bg-primary/5 border-primary/20 text-primary" />
          <StatMini label="إجمالي الرواتب المصروفة" value={fmtSAR(salariesTotal)} icon={<DollarSign className="h-5 w-5" />} tone="bg-amber-50 border-amber-200 text-amber-700" />
          <StatMini label="عدد دفعات الرواتب" value={String(data.salaries.length)} icon={<Calendar className="h-5 w-5" />} tone="bg-sky-50 border-sky-200 text-sky-700" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="العقارات المرتبطة" icon={<Building2 className="h-5 w-5 text-orange-600" />}>
          <ul className="divide-y divide-border">
            {data.properties.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <Link to="/properties/$id" params={{ id: p.id }} className="font-semibold text-primary hover:underline">{p.name}</Link>
                <StatusPill tone="info">{p.status}</StatusPill>
              </li>
            ))}
            {data.properties.length === 0 && <li className="px-5 py-6 text-center text-sm text-muted-foreground">لا يوجد</li>}
          </ul>
        </Section>
        <Section title="المركبات المرتبطة" icon={<Car className="h-5 w-5 text-sky-600" />}>
          <ul className="divide-y divide-border">
            {data.vehicles.map((v) => (
              <li key={v.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <Link to="/vehicles/$id" params={{ id: v.id }} className="font-semibold text-primary hover:underline">
                  {v.name} {v.plate_number && <span className="text-xs text-muted-foreground">({v.plate_number})</span>}
                </Link>
                <StatusPill tone="info">{v.status}</StatusPill>
              </li>
            ))}
            {data.vehicles.length === 0 && <li className="px-5 py-6 text-center text-sm text-muted-foreground">لا يوجد</li>}
          </ul>
        </Section>
        <Section title="الأراضي المرتبطة" icon={<MapIcon className="h-5 w-5 text-emerald-600" />}>
          <ul className="divide-y divide-border">
            {data.lands.map((l) => (
              <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <Link to="/lands/$id" params={{ id: l.id }} className="font-semibold text-primary hover:underline">{l.name}</Link>
                <StatusPill tone="info">{l.status}</StatusPill>
              </li>
            ))}
            {data.lands.length === 0 && <li className="px-5 py-6 text-center text-sm text-muted-foreground">لا يوجد</li>}
          </ul>
        </Section>
      </div>

      <div className="mt-5">
        <Section title="الرواتب والمكافآت" icon={<DollarSign className="h-5 w-5 text-amber-600" />}>
          <table className="w-full min-w-[500px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">التاريخ</th><th className="px-4 py-3">التصنيف</th>
              <th className="px-4 py-3">الوصف</th><th className="px-4 py-3">المبلغ</th>
            </tr></thead>
            <tbody>
              {data.salaries.map((t: any) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{t.txn_date}</td>
                  <td className="px-4 py-3">{t.category ?? t.txn_type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.description ?? "—"}</td>
                  <td className="px-4 py-3 font-bold text-amber-700">{fmtSAR(t.amount)}</td>
                </tr>
              ))}
              {data.salaries.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">لا توجد دفعات رواتب</td></tr>}
            </tbody>
          </table>
        </Section>
      </div>

      <div className="mt-5">
        <AssetDocsAndActivity entityType="employee" entityId={id} />
      </div>
    </DashboardLayout>
  );
}

function Info({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2">
      <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">{icon}{label}</div>
      <div className="mt-0.5 text-sm font-bold">{value}</div>
    </div>
  );
}
