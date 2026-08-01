import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StatusPill, propertyTone } from "@/components/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Home, Users, Wrench, TrendingUp, TrendingDown, Wallet, DollarSign, ArrowLeft } from "lucide-react";
import { RecordDialog, DeleteButton, type FieldDef } from "@/components/record-dialog";
import { ListToolbar } from "@/components/list-toolbar";
import { useAssetOptions } from "@/lib/asset-options";
import { StatCard, DashGrid, fmtSAR } from "@/components/dash-bits";
import { Section } from "@/components/asset-detail";

export const Route = createFileRoute("/properties/")({
  head: () => ({
    meta: [
      { title: "العقارات | إدارة الأملاك" },
      { name: "description", content: "عرض وإدارة العقارات والوحدات والحركات المالية المرتبطة بها." },
      { property: "og:title", content: "العقارات | إدارة الأملاك" },
      { property: "og:description", content: "عرض وإدارة العقارات والوحدات والحركات المالية المرتبطة بها." },
    ],
  }),
  component: PropertiesList,
});

const INVALIDATE = [["properties-list"], ["dashboard"], ["units-list"], ["asset-options"]];
const RENTED = ["مؤجرة", "مشغولة"];

function PropertiesList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("name");
  const { employeeOpts, nameById } = useAssetOptions();

  const PROPERTY_FIELDS: FieldDef[] = useMemo(() => [
    { name: "name", label: "اسم العقار", required: true },
    { name: "type", label: "النوع", type: "select", required: true, options: [
      { value: "عمارة", label: "عمارة" }, { value: "فيلا", label: "فيلا" }, { value: "مجمع", label: "مجمع" },
      { value: "أرض", label: "أرض" }, { value: "محل", label: "محل" }, { value: "مكتب", label: "مكتب" },
    ]},
    { name: "status", label: "الحالة", type: "select", required: true, options: [
      { value: "مؤجر", label: "مؤجر" }, { value: "خاصة", label: "خاصة" }, { value: "متاح", label: "متاح" },
    ]},
    { name: "responsible_employee_id", label: "المسؤول عن العقار (موظف)", type: "select", options: employeeOpts },
    { name: "location", label: "الموقع" },
    { name: "address", label: "العنوان" },
    { name: "description", label: "الوصف", type: "textarea" },
  ], [employeeOpts]);

  const { data } = useQuery(queryOptions({
    queryKey: ["properties-list"],
    queryFn: async () => {
      const [p, u, t, c, pay, m, txn] = await Promise.all([
        supabase.from("properties").select("*"),
        supabase.from("units").select("id, property_id, unit_number, status, rent_amount"),
        supabase.from("tenants").select("id, full_name"),
        supabase.from("contracts").select("id, unit_id, tenant_id, monthly_rent, status, end_date"),
        supabase.from("payments").select("id, contract_id, amount, status, due_date, paid_date"),
        supabase.from("maintenance_requests").select("id, title, cost, status, reported_at, completed_at, property_id, unit_id, entity_type, entity_id"),
        (supabase as any).from("transactions").select("id, amount, txn_type, txn_date, category, description, entity_type, entity_id"),
      ]);
      return {
        properties: p.data ?? [], units: u.data ?? [], tenants: t.data ?? [],
        contracts: c.data ?? [], payments: pay.data ?? [],
        maint: (m.data ?? []) as any[], txns: (txn.data ?? []) as any[],
      };
    },
  }));

  const d = data ?? { properties: [], units: [], tenants: [], contracts: [], payments: [], maint: [], txns: [] };
  const today = new Date().toISOString().slice(0, 10);
  const ym = today.slice(0, 7);
  const inMonth = (x?: string | null) => !!x && x.startsWith(ym);

  const unitById = useMemo(() => Object.fromEntries(d.units.map((u: any) => [u.id, u])), [d.units]);
  const propById = useMemo(() => Object.fromEntries(d.properties.map((p: any) => [p.id, p])), [d.properties]);
  const contractById = useMemo(() => Object.fromEntries(d.contracts.map((c: any) => [c.id, c])), [d.contracts]);
  const tenantById = useMemo(() => Object.fromEntries(d.tenants.map((t: any) => [t.id, t])), [d.tenants]);

  const propOfContract = (cid: string) => {
    const c = contractById[cid]; if (!c) return null;
    const u = unitById[c.unit_id]; return u ? propById[u.property_id] ?? null : null;
  };

  // ── per-property metrics ─────────────────────────────────────────────
  const metrics = useMemo(() => {
    const map: Record<string, any> = {};
    for (const p of d.properties as any[]) {
      const units = (d.units as any[]).filter((u) => u.property_id === p.id);
      const unitIds = units.map((u) => u.id);
      const contracts = (d.contracts as any[]).filter((c) => unitIds.includes(c.unit_id));
      const active = contracts.filter((c) => c.status === "نشط");
      const cIds = contracts.map((c) => c.id);
      const pays = (d.payments as any[]).filter((x) => cIds.includes(x.contract_id));
      const expected = active.reduce((s, c) => s + Number(c.monthly_rent || 0), 0);
      const collected = pays.filter((x) => x.status === "مدفوع" && inMonth(x.paid_date)).reduce((s, x) => s + Number(x.amount || 0), 0);
      const late = pays.filter((x) => x.status === "متأخر" || (x.status === "غير مدفوع" && x.due_date < today)).reduce((s, x) => s + Number(x.amount || 0), 0);
      const maintCost = (d.maint as any[])
        .filter((m) => m.property_id === p.id || m.entity_id === p.id || unitIds.includes(m.unit_id) || unitIds.includes(m.entity_id))
        .filter((m) => inMonth(m.completed_at) || inMonth(m.reported_at))
        .reduce((s, m) => s + Number(m.cost || 0), 0);
      const txnExp = (d.txns as any[])
        .filter((t) => t.txn_type === "مصروف" && (t.entity_id === p.id || unitIds.includes(t.entity_id)) && inMonth(t.txn_date))
        .reduce((s, t) => s + Number(t.amount || 0), 0);
      const expenses = maintCost + txnExp;
      map[p.id] = {
        units: units.length,
        rented: units.filter((u) => RENTED.includes(u.status)).length,
        vacant: units.filter((u) => !RENTED.includes(u.status)).length,
        tenants: new Set(active.map((c) => c.tenant_id)).size,
        expected, collected, late, expenses, net: collected - expenses,
      };
    }
    return map;
  }, [d, ym]);

  const totals = useMemo(() => {
    const t = { units: 0, rented: 0, vacant: 0, tenants: 0, expected: 0, collected: 0, late: 0, expenses: 0, net: 0 };
    for (const p of d.properties as any[]) {
      const m = metrics[p.id]; if (!m) continue;
      (Object.keys(t) as (keyof typeof t)[]).forEach((k) => { t[k] += m[k] ?? 0; });
    }
    return t;
  }, [metrics, d.properties]);

  const filtered = useMemo(() => {
    let r = (d.properties as any[]);
    if (search) { const s = search.toLowerCase(); r = r.filter((p) => p.name?.toLowerCase().includes(s) || p.location?.toLowerCase().includes(s)); }
    if (status) r = r.filter((p) => p.status === status);
    return [...r].sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  }, [d.properties, search, status, sort]);

  // ── unified financial movements (properties only) ────────────────────
  const movements = useMemo(() => {
    const rows: any[] = [];
    for (const x of d.payments as any[]) {
      const p = propOfContract(x.contract_id);
      const c = contractById[x.contract_id];
      const u = c ? unitById[c.unit_id] : null;
      if (!p) continue;
      rows.push({
        id: `pay-${x.id}`, date: x.paid_date ?? x.due_date, kind: "إيراد", label: "دفعة إيجار",
        property: p, unit: u, amount: Number(x.amount || 0), status: x.status,
        tenant: c ? tenantById[c.tenant_id]?.full_name : null,
      });
    }
    for (const t of d.txns as any[]) {
      const p = t.entity_id && propById[t.entity_id] ? propById[t.entity_id] : (unitById[t.entity_id] ? propById[unitById[t.entity_id].property_id] : null);
      if (!p) continue;
      rows.push({
        id: `txn-${t.id}`, date: t.txn_date, kind: t.txn_type === "إيراد" ? "إيراد" : "مصروف",
        label: t.category ?? t.description ?? "حركة مالية", property: p,
        unit: unitById[t.entity_id] ?? null, amount: Number(t.amount || 0), status: null,
      });
    }
    for (const m of d.maint as any[]) {
      const p = propById[m.property_id] ?? propById[m.entity_id] ?? (unitById[m.unit_id] ? propById[unitById[m.unit_id].property_id] : null);
      if (!p) continue;
      rows.push({
        id: `mt-${m.id}`, date: m.completed_at ?? m.reported_at, kind: "مصروف", label: `صيانة: ${m.title ?? ""}`,
        property: p, unit: unitById[m.unit_id] ?? null, amount: Number(m.cost || 0), status: m.status,
      });
    }
    return rows.sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""))).slice(0, 30);
  }, [d]);

  return (
    <DashboardLayout title="العقارات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-100 text-orange-700"><Building2 className="h-6 w-6" /></div>}>
      <div className="space-y-5">
        {/* ملخص الأصول */}
        <DashGrid>
          <StatCard label="عدد العقارات" value={(d.properties as any[]).length} icon={<Building2 className="h-5 w-5 text-orange-600" />} />
          <StatCard label="إجمالي الوحدات" value={totals.units} icon={<Home className="h-5 w-5" />} />
          <StatCard label="الوحدات المؤجرة" value={totals.rented} tone="success" />
          <StatCard label="الوحدات الشاغرة" value={totals.vacant} tone="warning" />
        </DashGrid>

        {/* الملخص المالي */}
        <DashGrid>
          <StatCard label="المستأجرين" value={totals.tenants} icon={<Users className="h-5 w-5" />} />
          <StatCard label="الإيجار الشهري المتوقع" value={fmtSAR(totals.expected)} tone="info" icon={<DollarSign className="h-5 w-5" />} hint="من العقود النشطة" />
          <StatCard label="المحصّل هذا الشهر" value={fmtSAR(totals.collected)} tone="success" icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard label="المتأخر" value={fmtSAR(totals.late)} tone="danger" icon={<TrendingDown className="h-5 w-5" />} />
          <StatCard label="مصروفات الشهر" value={fmtSAR(totals.expenses)} tone="warning" icon={<Wrench className="h-5 w-5" />} />
          <StatCard label="صافي الشهر" value={fmtSAR(totals.net)} tone={totals.net >= 0 ? "success" : "danger"} icon={<Wallet className="h-5 w-5" />} />
        </DashGrid>

        <ListToolbar
          search={search} onSearch={setSearch}
          filters={[{ value: status, onChange: setStatus, placeholder: "كل الحالات", options: [
            { value: "مؤجر", label: "مؤجر" }, { value: "خاصة", label: "خاصة" }, { value: "متاح", label: "متاح" },
          ]}]}
          sort={{ value: sort, onChange: setSort, options: [{ value: "name", label: "الاسم" }, { value: "newest", label: "الأحدث" }] }}
        >
          <RecordDialog table="properties" title="إضافة عقار جديد" fields={PROPERTY_FIELDS} invalidate={INVALIDATE} />
        </ListToolbar>

        {/* جدول العقارات */}
        <Section title="جدول العقارات" icon={<Building2 className="h-5 w-5 text-orange-600" />}>
          <table className="w-full min-w-[1100px] text-right text-sm">
            <thead>
              <tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
                <th className="px-4 py-3">اسم العقار</th>
                <th className="px-4 py-3">النوع</th>
                <th className="px-4 py-3">الموقع</th>
                <th className="px-4 py-3">الوحدات</th>
                <th className="px-4 py-3">مؤجرة / شاغرة</th>
                <th className="px-4 py-3">الإيجار المتوقع</th>
                <th className="px-4 py-3">المحصّل</th>
                <th className="px-4 py-3">المتأخر</th>
                <th className="px-4 py-3">المصروفات</th>
                <th className="px-4 py-3">الصافي</th>
                <th className="px-4 py-3">المسؤول</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => {
                const m = metrics[p.id] ?? {};
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link to="/properties/$id" params={{ id: p.id }} className="font-bold text-primary hover:underline">{p.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.location ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold">{m.units ?? 0}</td>
                    <td className="px-4 py-3"><span className="font-bold text-emerald-600">{m.rented ?? 0}</span> / <span className="font-bold text-amber-600">{m.vacant ?? 0}</span></td>
                    <td className="px-4 py-3 font-semibold text-sky-700">{fmtSAR(m.expected)}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{fmtSAR(m.collected)}</td>
                    <td className="px-4 py-3 font-semibold text-rose-600">{fmtSAR(m.late)}</td>
                    <td className="px-4 py-3 font-semibold text-amber-700">{fmtSAR(m.expenses)}</td>
                    <td className={`px-4 py-3 font-extrabold ${(m.net ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtSAR(m.net)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.responsible_employee_id ? (nameById[p.responsible_employee_id] ?? "—") : "—"}</td>
                    <td className="px-4 py-3"><StatusPill tone={propertyTone(p.status)}>{p.status}</StatusPill></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to="/properties/$id" params={{ id: p.id }} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-semibold hover:bg-muted">
                          تفاصيل <ArrowLeft className="h-3 w-3" />
                        </Link>
                        <RecordDialog table="properties" title="تعديل العقار" fields={PROPERTY_FIELDS} initial={p} invalidate={INVALIDATE} />
                        <DeleteButton table="properties" id={p.id} invalidate={INVALIDATE} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={13} className="px-4 py-8 text-center text-muted-foreground">لا توجد عقارات</td></tr>}
            </tbody>
          </table>
        </Section>

        {/* الحركات المالية للعقارات */}
        <Section title="الحركات المالية للعقارات" icon={<DollarSign className="h-5 w-5 text-emerald-600" />}>
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead>
              <tr className="bg-muted/40 text-[12px] font-bold text-muted-foreground">
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3">النوع</th>
                <th className="px-4 py-3">البيان</th>
                <th className="px-4 py-3">العقار</th>
                <th className="px-4 py-3">الوحدة</th>
                <th className="px-4 py-3">المستأجر</th>
                <th className="px-4 py-3">المبلغ</th>
                <th className="px-4 py-3">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{r.date ?? "—"}</td>
                  <td className="px-4 py-3"><StatusPill tone={r.kind === "إيراد" ? "success" : "danger"}>{r.kind}</StatusPill></td>
                  <td className="px-4 py-3">{r.label}</td>
                  <td className="px-4 py-3">
                    <Link to="/properties/$id" params={{ id: r.property.id }} className="font-semibold text-primary hover:underline">{r.property.name}</Link>
                  </td>
                  <td className="px-4 py-3">
                    {r.unit ? <Link to="/units/$id" params={{ id: r.unit.id }} className="text-primary hover:underline">{r.unit.unit_number}</Link> : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.tenant ?? "—"}</td>
                  <td className={`px-4 py-3 font-bold ${r.kind === "إيراد" ? "text-emerald-600" : "text-rose-600"}`}>{fmtSAR(r.amount)}</td>
                  <td className="px-4 py-3">{r.status ? <StatusPill tone={r.status === "مدفوع" || r.status === "مكتمل" ? "success" : r.status === "متأخر" ? "danger" : "warning"}>{r.status}</StatusPill> : "—"}</td>
                </tr>
              ))}
              {movements.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">لا توجد حركات مالية</td></tr>}
            </tbody>
          </table>
        </Section>
      </div>
    </DashboardLayout>
  );
}
