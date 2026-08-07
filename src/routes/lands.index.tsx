import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AssetKpis } from "@/components/asset-kpis";
import { StatusPill } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Map as MapIcon, ArrowLeft } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { AttachmentsButton } from "@/components/attachments-panel";
import { ExportCsvButton } from "@/components/export-csv-button";
import { useAssetOptions } from "@/lib/asset-options";
import { useAssetTypes } from "@/lib/asset-types";
import { Section } from "@/components/asset-detail";
import { StatCard, DashGrid, fmtSAR } from "@/components/dash-bits";
import { MoneyMovements } from "@/components/money-table";
import { useEntityFinance, emptyAgg } from "@/lib/entity-finance";

export const Route = createFileRoute("/lands/")({
  head: () => ({
    meta: [
      { title: "الأراضي | منصة الأصول" },
      { name: "description", content: "إدارة الأراضي والمزارع مع الإيرادات والمصروفات والسجل المالي." },
      { property: "og:title", content: "الأراضي | منصة الأصول" },
      { property: "og:description", content: "إدارة الأراضي والمزارع مع الإيرادات والمصروفات والسجل المالي." },
    ],
  }),
  component: LandsList,
});

const INV = [["lands-list"], ["dashboard-totals"], ["asset-options"], ["entity-finance", "land"]];
const STATUSES = ["متاحة", "مباعة", "مرهونة", "قيد التطوير"];

function LandsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { employeeOpts, nameById } = useAssetOptions();
  const { rows: moneyRows, byId, totals } = useEntityFinance("land");

  const { data = [] } = useQuery(queryOptions({
    queryKey: ["lands-list"],
    queryFn: async () => (await supabase.from("lands" as any).select("*").eq("archived", false).order("created_at", { ascending: false })).data ?? [],
  }));

  const { options: typeOpts } = useAssetTypes("land");

  const FIELDS: FieldDef[] = useMemo(() => [
    { name: "name", label: "اسم/وصف الأرض", required: true },
    { name: "type_id", label: "نوع الأرض / المزرعة", type: "select", options: typeOpts },
    { name: "qr_code", label: "رمز الأصل (باركود)" },
    { name: "deed_number", label: "رقم الصك" },
    { name: "ownership_type", label: "نوع الملكية", type: "select", options: [
      { value: "ملك حر", label: "ملك حر" }, { value: "وقف", label: "وقف" }, { value: "حكر", label: "حكر" },
    ]},
    { name: "city", label: "المدينة" }, { name: "region", label: "المنطقة" },
    { name: "location", label: "الموقع التفصيلي" }, { name: "coordinates", label: "الإحداثيات" },
    { name: "area_sqm", label: "المساحة (م²)", type: "number" },
    { name: "responsible_employee_id", label: "المسؤول عن الأصل (موظف)", type: "select", options: employeeOpts },
    { name: "purchase_value", label: "قيمة الشراء", type: "number" },
    { name: "current_value", label: "القيمة الحالية (تقييم)", type: "number" },
    { name: "purchase_date", label: "تاريخ الشراء", type: "date" },
    { name: "status", label: "الحالة", type: "select", required: true, options: STATUSES.map(s => ({ value: s, label: s })) },
    { name: "notes", label: "ملاحظات", type: "textarea" },
  ], [employeeOpts, typeOpts]);

  const filtered = useMemo(() => {
    let r = data as any[];
    if (search) { const s = search.toLowerCase(); r = r.filter(v => v.name?.toLowerCase().includes(s) || v.deed_number?.toLowerCase().includes(s) || v.city?.toLowerCase().includes(s)); }
    if (status) r = r.filter(v => v.status === status);
    return r;
  }, [data, search, status]);

  const areaTotal = (data as any[]).reduce((s, l) => s + Number(l.area_sqm || 0), 0);

  return (
    <DashboardLayout title="الأراضي" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><MapIcon className="h-6 w-6" /></div>}>
      <div className="space-y-5">
        <AssetKpis kind="land" />

        {/* البطاقات المالية */}
        <DashGrid>
          <StatCard label="إجمالي الإيرادات" value={fmtSAR(totals.income)} tone="success" />
          <StatCard label="إجمالي المصروفات" value={fmtSAR(totals.expense)} tone="danger" />
          <StatCard label="تكلفة الصيانة" value={fmtSAR(totals.maint)} tone="warning" />
          <StatCard label="الصافي الإجمالي" value={fmtSAR(totals.net)} tone={totals.net >= 0 ? "success" : "danger"} />
          <StatCard label="إيرادات الشهر" value={fmtSAR(totals.incomeMonth)} tone="success" />
          <StatCard label="مصروفات الشهر" value={fmtSAR(totals.expenseMonth)} tone="warning" />
          <StatCard label="صافي الشهر" value={fmtSAR(totals.netMonth)} tone={totals.netMonth >= 0 ? "success" : "danger"} />
          <StatCard label="إجمالي المساحات" value={`${areaTotal.toLocaleString()} م²`} tone="primary" />
        </DashGrid>

        <ListToolbar
          search={search} onSearch={setSearch}
          filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: STATUSES.map(s => ({ value: s, label: s })) }]}
        >
          <ExportCsvButton rows={filtered} filename="lands" columns={[
            { key: "name", label: "الأرض" }, { key: "deed_number", label: "رقم الصك" },
            { key: "city", label: "المدينة" }, { key: "area_sqm", label: "المساحة" },
            { key: "current_value", label: "القيمة الحالية" }, { key: "status", label: "الحالة" },
          ]} />
          <RecordDialog table="lands" title="إضافة أرض" fields={FIELDS} invalidate={INV} />
        </ListToolbar>

        {/* جدول الأراضي */}
        <Section title="جدول الأراضي" icon={<MapIcon className="h-5 w-5 text-emerald-600" />}>
          <table className="w-full min-w-[1080px] text-right text-sm">
            <thead>
              <tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
                <th className="px-4 py-3">اسم الأرض</th>
                <th className="px-4 py-3">رقم الصك</th>
                <th className="px-4 py-3">المدينة / المنطقة</th>
                <th className="px-4 py-3">المساحة</th>
                <th className="px-4 py-3">القيمة الحالية</th>
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
                return (
                  <tr key={v.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3"><Link to="/lands/$id" params={{ id: v.id }} className="font-bold text-primary hover:underline">{v.name}</Link></td>
                    <td className="px-4 py-3 text-muted-foreground">{v.deed_number ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{[v.city, v.region].filter(Boolean).join(" — ") || "—"}</td>
                    <td className="px-4 py-3">{v.area_sqm ? `${Number(v.area_sqm).toLocaleString()} م²` : "—"}</td>
                    <td className="px-4 py-3 font-semibold">{fmtSAR(v.current_value)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{fmtSAR(m.income)}</td>
                    <td className="px-4 py-3 font-semibold text-rose-600">{fmtSAR(m.expense)}</td>
                    <td className={`px-4 py-3 font-extrabold ${m.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtSAR(m.net)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.responsible_employee_id ? nameById[v.responsible_employee_id] ?? "—" : "—"}</td>
                    <td className="px-4 py-3"><StatusPill tone={v.status === "متاحة" ? "success" : v.status === "مرهونة" ? "warning" : v.status === "مباعة" ? "muted" : "info"}>{v.status}</StatusPill></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to="/lands/$id" params={{ id: v.id }} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-semibold hover:bg-muted">
                          تفاصيل <ArrowLeft className="h-3 w-3" />
                        </Link>
                        <AttachmentsButton entityType="land" entityId={v.id} />
                        <RecordDialog table="lands" title="تعديل الأرض" fields={FIELDS} initial={v} invalidate={INV} />
                        <DeleteButton table="lands" id={v.id} invalidate={INV} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">لا توجد أراضٍ</td></tr>}
            </tbody>
          </table>
        </Section>

        <MoneyMovements rows={moneyRows} title="الحركات المالية للأراضي" nameById={nameById} entityLabel="الأرض" />
      </div>
    </DashboardLayout>
  );
}
