import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AdminOnly } from "@/components/admin-only";
import { Section } from "@/components/asset-detail";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { useAssetTypes, type AssetTypeScope } from "@/lib/asset-types";
import { Shapes, Building2, Map as MapIcon, Car } from "lucide-react";

export const Route = createFileRoute("/asset-types/")({
  head: () => ({
    meta: [
      { title: "أنواع الأصول | منصة الأصول" },
      { name: "description", content: "إدارة أنواع العقارات والأراضي والمركبات والمعدات وإضافة أنواع مخصصة." },
      { property: "og:title", content: "أنواع الأصول | منصة الأصول" },
      { property: "og:description", content: "إدارة أنواع العقارات والأراضي والمركبات والمعدات وإضافة أنواع مخصصة." },
    ],
  }),
  component: () => (
    <AdminOnly>
      <AssetTypesPage />
    </AdminOnly>
  ),
});

const INV = [["asset-types"], ["asset-options"]];

const SCOPES: { key: AssetTypeScope; label: string; icon: React.ReactNode }[] = [
  { key: "property", label: "أنواع العقارات", icon: <Building2 className="h-5 w-5 text-orange-600" /> },
  { key: "land", label: "أنواع الأراضي والمزارع", icon: <MapIcon className="h-5 w-5 text-emerald-600" /> },
  { key: "vehicle", label: "أنواع المركبات والمعدات", icon: <Car className="h-5 w-5 text-sky-600" /> },
];

function fields(scope: AssetTypeScope): FieldDef[] {
  return [
    { name: "name", label: "اسم النوع", required: true },
    { name: "key", label: "المعرّف (إنجليزي بدون مسافات)", required: true, placeholder: "warehouse" },
    { name: "category", label: "التصنيف", placeholder: scope === "vehicle" ? "نقل / معدات ثقيلة" : "سكني / تجاري / صناعي" },
    ...(scope === "land"
      ? ([{ name: "is_farm", label: "تفعيل إدارة المزرعة تلقائياً", type: "select", options: [
          { value: "true", label: "نعم — مزرعة/بستان/محمية" }, { value: "false", label: "لا" },
        ]}] as FieldDef[])
      : []),
    { name: "display_order", label: "ترتيب العرض", type: "number" },
    { name: "active", label: "الحالة", type: "select", options: [
      { value: "true", label: "مفعّل" }, { value: "false", label: "معطّل" },
    ]},
  ];
}

function AssetTypesPage() {
  const [tab, setTab] = useState<AssetTypeScope>("property");
  const { all } = useAssetTypes();
  const rows = all.filter((t) => t.scope === tab);
  const scope = SCOPES.find((s) => s.key === tab)!;

  return (
    <DashboardLayout
      title="أنواع الأصول"
      icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700"><Shapes className="h-6 w-6" /></div>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
              tab === s.key ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:bg-muted"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Section title={scope.label} icon={scope.icon}>
        <div className="flex justify-end p-4 pb-0">
          <RecordDialog
            table="asset_types"
            title={`إضافة نوع — ${scope.label}`}
            fields={fields(tab)}
            invalidate={INV}
            defaults={{ active: "true", is_farm: "false", display_order: 100 }}
            extra={{ scope: tab }}
          />
        </div>
        <table className="w-full min-w-[720px] text-right text-sm">
          <thead>
            <tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
              <th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">التصنيف</th>
              <th className="px-4 py-3">المعرّف</th>
              {tab === "land" && <th className="px-4 py-3">إدارة مزرعة</th>}
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">المصدر</th>
              <th className="px-4 py-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold">{t.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.category ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{t.key}</td>
                {tab === "land" && (
                  <td className="px-4 py-3">{t.is_farm ? <span className="font-bold text-emerald-600">نعم</span> : "—"}</td>
                )}
                <td className="px-4 py-3">{t.active ? "مفعّل" : <span className="text-muted-foreground">معطّل</span>}</td>
                <td className="px-4 py-3 text-[11px] text-muted-foreground">{t.system ? "نظامي" : "مخصص"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <RecordDialog table="asset_types" title="تعديل النوع" fields={fields(tab)} initial={{ ...t, is_farm: String(t.is_farm), active: String(t.active) }} invalidate={INV} extra={{ scope: tab }} />
                    {!t.system && <DeleteButton table="asset_types" id={t.id} invalidate={INV} />}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">لا توجد أنواع بعد</td></tr>
            )}
          </tbody>
        </table>
      </Section>
    </DashboardLayout>
  );
}
