import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AssetKpis } from "@/components/asset-kpis";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Car, ArrowLeft } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { AttachmentsButton } from "@/components/attachments-panel";
import { ExportCsvButton } from "@/components/export-csv-button";
import { useAssetOptions } from "@/lib/asset-options";
import { Section } from "@/components/asset-detail";
import { StatCard, DashGrid, fmtSAR } from "@/components/dash-bits";
import { MoneyMovements } from "@/components/money-table";
import { useEntityFinance, emptyAgg } from "@/lib/entity-finance";

export const Route = createFileRoute("/vehicles/")({
  head: () => ({
    meta: [
      { title: "المركبات والمعدات | منصة الأصول" },
      { name: "description", content: "إدارة المركبات والمعدات: الصيانة والتأمين والوقود والإيرادات والمصروفات." },
      { property: "og:title", content: "المركبات والمعدات | منصة الأصول" },
      { property: "og:description", content: "إدارة المركبات والمعدات: الصيانة والتأمين والوقود والسجل المالي." },
    ],
  }),
  component: VehiclesList,
});

const INV = [["vehicles-list"], ["dashboard-totals"], ["asset-options"], ["entity-finance", "vehicle"]];


function VehiclesList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { employeeOpts, nameById } = useAssetOptions();
  const { rows: moneyRows, byId, totals } = useEntityFinance("vehicle");

  const { data = [] } = useQuery(queryOptions({
    queryKey: ["vehicles-list"],
    queryFn: async () => (await supabase.from("vehicles" as any).select("*").eq("archived", false).order("created_at", { ascending: false })).data ?? [],
  }));

  const FIELDS: FieldDef[] = useMemo(() => [
    { name: "name", label: "اسم/وصف المركبة", required: true },
    { name: "vehicle_type", label: "النوع", type: "select", options: [
      { value: "سيارة", label: "سيارة" }, { value: "شاحنة", label: "شاحنة" },
      { value: "حافلة", label: "حافلة" }, { value: "دراجة نارية", label: "دراجة نارية" },
      { value: "معدة", label: "معدة" },
    ]},
    { name: "brand", label: "الماركة" }, { name: "model", label: "الموديل" },
    { name: "year", label: "سنة الصنع", type: "number" },
    { name: "plate_number", label: "رقم اللوحة" }, { name: "chassis_number", label: "رقم الهيكل" },
    { name: "driver_name", label: "اسم السائق" }, { name: "driver_phone", label: "جوال السائق" },
    { name: "responsible_employee_id", label: "المسؤول عن الأصل (موظف)", type: "select", options: employeeOpts },
    { name: "purchase_value", label: "قيمة الشراء", type: "number" },
    { name: "current_value", label: "القيمة الحالية", type: "number" },
    { name: "purchase_date", label: "تاريخ الشراء", type: "date" },
    { name: "insurance_company", label: "شركة التأمين" },
    { name: "insurance_expiry", label: "انتهاء التأمين", type: "date" },
    { name: "license_expiry", label: "انتهاء الاستمارة", type: "date" },
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "نشط", label: "نشط" }, { value: "صيانة", label: "صيانة" }, { value: "متوقف", label: "متوقف" },
    ]},
    { name: "notes", label: "ملاحظات", type: "textarea" },
  ], [employeeOpts]);

  const filtered = useMemo(() => {
    let r = data as any[];
    if (search) { const s = search.toLowerCase(); r = r.filter(v => v.name?.toLowerCase().includes(s) || v.plate_number?.toLowerCase().includes(s)); }
    if (status) r = r.filter(v => v.status === status);
    return r;
  }, [data, search, status]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <DashboardLayout title="المركبات والمعدات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Car className="h-6 w-6" /></div>}>
      <div className="space-y-5">
        <AssetKpis kind="vehicle" />

        {/* البطاقات المالية */}
        <DashGrid>
          <StatCard label="إجمالي الإيرادات" value={fmtSAR(totals.income)} tone="success" />
          <StatCard label="إجمالي المصروفات" value={fmtSAR(totals.expense)} tone="danger" />
          <StatCard label="تكلفة الصيانة" value={fmtSAR(totals.maint)} tone="warning" />
          <StatCard label="الصافي الإجمالي" value={fmtSAR(totals.net)} tone={totals.net >= 0 ? "success" : "danger"} />
          <StatCard label="إيرادات الشهر" value={fmtSAR(totals.incomeMonth)} tone="success" />
          <StatCard label="مصروفات الشهر" value={fmtSAR(totals.expenseMonth)} tone="warning" />
          <StatCard label="صافي الشهر" value={fmtSAR(totals.netMonth)} tone={totals.netMonth >= 0 ? "success" : "danger"} />
          <StatCard label="قيمة المركبات" value={fmtSAR((data as any[]).reduce((s, v) => s + Number(v.current_value || 0), 0))} tone="primary" />
        </DashGrid>

        <ListToolbar
          search={search} onSearch={setSearch}
          filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: [
            { value: "نشط", label: "نشط" }, { value: "صيانة", label: "صيانة" }, { value: "متوقف", label: "متوقف" },
          ]}]}
        >
          <ExportCsvButton rows={filtered} filename="vehicles" columns={[
            { key: "name", label: "المركبة" }, { key: "plate_number", label: "اللوحة" },
            { key: "brand", label: "الماركة" }, { key: "model", label: "الموديل" },
            { key: "driver_name", label: "السائق" }, { key: "insurance_expiry", label: "انتهاء التأمين" },
            { key: "current_value", label: "القيمة" }, { key: "status", label: "الحالة" },
          ]} />
          <RecordDialog table="vehicles" title="إضافة مركبة" fields={FIELDS} invalidate={INV} />
        </ListToolbar>

        {/* جدول المركبات */}
        <Section title="جدول المركبات والمعدات" icon={<Car className="h-5 w-5 text-sky-600" />}>
          <table className="w-full min-w-[1150px] text-right text-sm">
            <thead>
              <tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
                <th className="px-4 py-3">المركبة</th>
                <th className="px-4 py-3">النوع</th>
                <th className="px-4 py-3">اللوحة</th>
                <th className="px-4 py-3">السائق</th>
                <th className="px-4 py-3">انتهاء التأمين</th>
                <th className="px-4 py-3">القيمة</th>
                <th className="px-4 py-3">الإيرادات</th>
                <th className="px-4 py-3">المصروفات</th>
                <th className="px-4 py-3">الصافي</th>
                <th className="px-4 py-3">المسؤول</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v: any) => {
                const m = byId[v.id] ?? emptyAgg;
                const insExpired = v.insurance_expiry && v.insurance_expiry < today;
                return (
                  <tr key={v.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3"><Link to="/vehicles/$id" params={{ id: v.id }} className="font-bold text-primary hover:underline">{v.name}</Link></td>
                    <td className="px-4 py-3 text-muted-foreground">{v.vehicle_type ?? "—"}</td>
                    <td className="px-4 py-3" dir="ltr">{v.plate_number ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.driver_name ?? "—"}</td>
                    <td className={`px-4 py-3 ${insExpired ? "font-bold text-rose-600" : "text-muted-foreground"}`}>{v.insurance_expiry ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold">{fmtSAR(v.current_value)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{fmtSAR(m.income)}</td>
                    <td className="px-4 py-3 font-semibold text-rose-600">{fmtSAR(m.expense)}</td>
                    <td className={`px-4 py-3 font-extrabold ${m.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtSAR(m.net)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.responsible_employee_id ? nameById[v.responsible_employee_id] ?? "—" : "—"}</td>
                    <td className="px-4 py-3"><StatusPill tone={v.status === "نشط" ? "success" : v.status === "صيانة" ? "info" : "muted"}>{v.status}</StatusPill></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to="/vehicles/$id" params={{ id: v.id }} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-semibold hover:bg-muted">
                          تفاصيل <ArrowLeft className="h-3 w-3" />
                        </Link>
                        <AttachmentsButton entityType="vehicle" entityId={v.id} />
                        <RecordDialog table="vehicles" title="تعديل المركبة" fields={FIELDS} initial={v} invalidate={INV} />
                        <DeleteButton table="vehicles" id={v.id} invalidate={INV} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">لا توجد مركبات</td></tr>}
            </tbody>
          </table>
        </Section>

        <MoneyMovements rows={moneyRows} title="الحركات المالية للمركبات" nameById={nameById} entityLabel="المركبة" />
      </div>
    </DashboardLayout>
  );

}
