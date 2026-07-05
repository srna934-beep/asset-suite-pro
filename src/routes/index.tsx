import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { getDashboardData, refreshLatePayments } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign, AlertCircle, Building2, Car, Map, Wallet, TrendingUp, TrendingDown,
  CheckCircle2, Wrench, FileText, Bell, Activity, ClipboardList, Users, FileCheck,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useEffect, useMemo, type ReactNode } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from "recharts";

const dashboardQuery = queryOptions({ queryKey: ["dashboard"], queryFn: getDashboardData });
const totalsQuery = queryOptions({
  queryKey: ["dashboard-totals"],
  queryFn: async () => ((await supabase.rpc("dashboard_totals" as any)).data ?? {}) as any,
});
const extraQuery = queryOptions({
  queryKey: ["home-extra"],
  queryFn: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const end = in30.toISOString().slice(0, 10);
    const [maint, vehicles, lands, txns, notifs] = await Promise.all([
      supabase.from("maintenance_requests" as any).select("*").order("created_at", { ascending: false }).limit(6),
      supabase.from("vehicles" as any).select("*"),
      supabase.from("lands" as any).select("*"),
      supabase.from("transactions" as any).select("*").order("txn_date", { ascending: false }).limit(500),
      supabase.from("notifications" as any).select("*").order("created_at", { ascending: false }).limit(6),
    ]);
    return {
      maintenance: (maint.data ?? []) as any[],
      vehicles: (vehicles.data ?? []) as any[],
      lands: (lands.data ?? []) as any[],
      transactions: (txns.data ?? []) as any[],
      notifications: (notifs.data ?? []) as any[],
      windowEnd: end, today,
    };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | إدارة الأصول والأعمال" },
      { name: "description", content: "منصة احترافية لإدارة الأصول والأعمال — عقارات، مركبات، أراضٍ، مالية وموارد بشرية" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(dashboardQuery);
  const { data: totals } = useQuery(totalsQuery);
  const { data: extra } = useQuery(extraQuery);

  useEffect(() => {
    refreshLatePayments().then(() => qc.invalidateQueries({ queryKey: ["dashboard"] }));
  }, [qc]);

  if (isLoading || !data) return <LoadingShell />;

  const t: any = totals ?? {};
  const { properties, units, contracts, payments } = data;
  const vehicles = extra?.vehicles ?? [];
  const lands = extra?.lands ?? [];
  const txns = extra?.transactions ?? [];

  const revenue = Number(t.revenue_total ?? 0);
  const expenses = Number(t.expense_total ?? 0);
  const netProfit = revenue - expenses;
  const assetsValue = Number(t.assets_value ?? 0);
  const lateTotal = payments.filter((p) => p.status === "متأخر").reduce((s, p) => s + Number(p.amount), 0);
  const lateCount = payments.filter((p) => p.status === "متأخر").length;
  const pendingApprovals = extra?.notifications?.length ?? 0;

  // Chart data — group txns by month
  const chartData = useMemo(() => {
    const buckets: Record<string, { m: string; rev: number; exp: number }> = {};
    const order: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      buckets[key] = { m: d.toLocaleDateString("ar", { month: "short" }), rev: 0, exp: 0 };
      order.push(key);
    }
    for (const x of txns) {
      const key = String(x.txn_date ?? "").slice(0, 7);
      const b = buckets[key];
      if (!b) continue;
      if (x.txn_type === "إيراد") b.rev += Number(x.amount);
      else b.exp += Number(x.amount);
    }
    return order.map((k) => ({ ...buckets[k], profit: buckets[k].rev - buckets[k].exp }));
  }, [txns]);

  // Unit status distribution
  const unitStats = {
    total: units.length,
    occupied: units.filter((u) => u.status === "مؤجرة").length,
    vacant: units.filter((u) => u.status === "فارغة").length,
    maintenance: units.filter((u) => u.status === "صيانة").length,
  };
  const occupancy = unitStats.total ? Math.round((unitStats.occupied / unitStats.total) * 100) : 0;

  // Vehicles breakdown
  const vStats = {
    total: vehicles.length,
    active: vehicles.filter((v: any) => (v.status ?? "") === "تعمل" || (v.status ?? "") === "نشطة").length,
    idle: vehicles.filter((v: any) => (v.status ?? "") === "متوقفة").length,
    maint: vehicles.filter((v: any) => (v.status ?? "") === "صيانة").length,
    rented: vehicles.filter((v: any) => (v.status ?? "") === "مؤجرة").length,
  };
  // Lands
  const lStats = {
    total: lands.length,
    owned: lands.filter((l: any) => (l.status ?? "") === "مملوكة").length,
    rented: lands.filter((l: any) => (l.status ?? "") === "مؤجرة").length,
    dev: lands.filter((l: any) => (l.status ?? "") === "تحت التطوير").length,
  };

  const kpis = [
    { label: "إجمالي قيمة الأصول", value: assetsValue, icon: TrendingUp, color: "bg-violet-500/15 text-violet-300", ring: "ring-violet-500/30", delta: "+12.5%", up: true },
    { label: "إجمالي الإيرادات", value: revenue, icon: DollarSign, color: "bg-emerald-500/15 text-emerald-300", ring: "ring-emerald-500/30", delta: "+8.7%", up: true },
    { label: "إجمالي المصروفات", value: expenses, icon: Wallet, color: "bg-rose-500/15 text-rose-300", ring: "ring-rose-500/30", delta: "+5.3%", up: false },
    { label: "صافي الربح", value: netProfit, icon: TrendingUp, color: "bg-sky-500/15 text-sky-300", ring: "ring-sky-500/30", delta: "+15.6%", up: true },
    { label: "إجمالي المتأخرات", value: lateTotal, icon: AlertCircle, color: "bg-amber-500/15 text-amber-300", ring: "ring-amber-500/30", delta: `${lateCount} عملية`, up: false },
    { label: "عمليات بانتظار الموافقة", value: pendingApprovals, icon: FileCheck, color: "bg-fuchsia-500/15 text-fuchsia-300", ring: "ring-fuchsia-500/30", plain: true },
  ];

  return (
    <DashboardLayout title="لوحة التحكم">
      <div className="-mx-4 -my-6 md:-mx-8 md:-my-8 min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-6 md:px-8 md:py-8 text-slate-100">
        {/* KPI ROW */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className={`rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-lg ring-1 ${k.ring} backdrop-blur transition hover:-translate-y-0.5 hover:border-white/20`}>
                <div className="flex items-start justify-between gap-2">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${k.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-[11px] text-slate-400 text-left">{k.label}</div>
                </div>
                <div className="mt-3 text-right">
                  <div className="text-2xl font-extrabold tracking-tight text-white">
                    {k.plain ? k.value : Number(k.value).toLocaleString()}
                  </div>
                  {!k.plain && <div className="mt-0.5 text-[11px] text-slate-400">ريال</div>}
                </div>
                {k.delta && (
                  <div className={`mt-2 flex items-center justify-end gap-1 text-[11px] font-semibold ${k.up ? "text-emerald-400" : "text-rose-400"}`}>
                    {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    <span>{k.delta}</span>
                    <span className="text-slate-500 font-normal">عن الشهر الماضي</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CHART */}
        <Panel className="mt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white">الإيرادات والمصروفات والأرباح</h3>
              <p className="mt-0.5 text-xs text-slate-400">آخر 6 أشهر</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 p-1 text-xs">
              {["أسبوع", "شهر", "سنة"].map((p, i) => (
                <button key={p} className={`rounded-lg px-3 py-1.5 font-semibold ${i === 1 ? "bg-primary text-primary-foreground" : "text-slate-300 hover:text-white"}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="m" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, color: "#f1f5f9" }} />
                <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
                <Line type="monotone" dataKey="rev" name="الإيرادات" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="exp" name="المصروفات" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="profit" name="صافي الربح" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* ASSET MODULES */}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <ModuleCard
            to="/properties-dashboard" title="العقارات" subtitle="عقار" count={properties.length}
            icon={<Building2 className="h-6 w-6" />} accent="from-orange-500 to-amber-500" glow="shadow-orange-500/20"
            bars={[
              { label: "المشغولة", value: unitStats.occupied, total: unitStats.total, color: "bg-emerald-500" },
              { label: "المتاحة", value: unitStats.vacant, total: unitStats.total, color: "bg-amber-500" },
            ]}
            stats={[
              { label: "إجمالي الدخل", value: revenue, tone: "text-emerald-400" },
              { label: "إجمالي المصروفات", value: expenses, tone: "text-rose-400" },
              { label: "صافي الربح", value: netProfit, tone: "text-sky-400" },
            ]}
            footer={[
              { label: "طلبات صيانة", value: extra?.maintenance?.length ?? 0 },
              { label: "متأخرات", value: lateCount, tone: "text-rose-400" },
              { label: "عقود تنتهي قريباً", value: 0 },
            ]}
            head={`${unitStats.total} وحدة`}
          />
          <ModuleCard
            to="/vehicles-dashboard" title="المركبات والمعدات" subtitle="مركبة / معدة" count={vStats.total}
            icon={<Car className="h-6 w-6" />} accent="from-sky-500 to-blue-600" glow="shadow-sky-500/20"
            bars={[
              { label: "تعمل", value: vStats.active, total: vStats.total || 1, color: "bg-emerald-500" },
              { label: "متوقفة", value: vStats.idle, total: vStats.total || 1, color: "bg-amber-500" },
              { label: "تحت الصيانة", value: vStats.maint, total: vStats.total || 1, color: "bg-rose-500" },
              { label: "مؤجرة", value: vStats.rented, total: vStats.total || 1, color: "bg-violet-500" },
            ]}
            stats={[
              { label: "إجمالي الدخل", value: 0, tone: "text-emerald-400" },
              { label: "إجمالي المصروفات", value: 0, tone: "text-rose-400" },
              { label: "صافي الربح", value: 0, tone: "text-sky-400" },
            ]}
            footer={[
              { label: "صيانة قادمة", value: 0 },
              { label: "تأمينات تنتهي", value: 0 },
              { label: "رخص تنتهي", value: 0 },
            ]}
          />
          <ModuleCard
            to="/lands-dashboard" title="الأراضي والمزارع والمصانع" subtitle="أرض / مزرعة / مصنع" count={lStats.total}
            icon={<Map className="h-6 w-6" />} accent="from-emerald-500 to-green-600" glow="shadow-emerald-500/20"
            bars={[
              { label: "مملوكة", value: lStats.owned, total: lStats.total || 1, color: "bg-emerald-500" },
              { label: "مؤجرة", value: lStats.rented, total: lStats.total || 1, color: "bg-amber-500" },
              { label: "تحت التطوير / الإنشاء", value: lStats.dev, total: lStats.total || 1, color: "bg-violet-500" },
            ]}
            stats={[
              { label: "إجمالي الدخل", value: 0, tone: "text-emerald-400" },
              { label: "إجمالي المصروفات", value: 0, tone: "text-rose-400" },
              { label: "صافي الربح", value: 0, tone: "text-sky-400" },
            ]}
            footer={[
              { label: "طلبات صيانة", value: 0 },
              { label: "مستحقات متأخرة", value: 0, tone: "text-rose-400" },
              { label: "طلبات صيانة", value: 0 },
            ]}
          />
        </div>

        {/* ALERTS / ACTIVITY / LATE PAYMENTS */}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <Panel>
            <PanelTitle icon={<Bell className="h-4 w-4 text-amber-400" />} title="التنبيهات" />
            <ul className="space-y-2 text-sm">
              {(extra?.notifications ?? []).slice(0, 5).map((n: any) => (
                <li key={n.id} className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <span className="mt-0.5 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">تنبيه</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">{n.title}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-400">{n.body}</div>
                  </div>
                </li>
              ))}
              {(!extra?.notifications || extra.notifications.length === 0) && <EmptyRow text="لا توجد تنبيهات" />}
            </ul>
            <BottomLink to="/notifications-center">عرض جميع التنبيهات</BottomLink>
          </Panel>

          <Panel>
            <PanelTitle icon={<Activity className="h-4 w-4 text-sky-400" />} title="آخر الأنشطة" />
            <ul className="space-y-2 text-sm">
              {payments.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <span className={`mt-0.5 grid h-6 w-6 place-items-center rounded-md ${p.status === "مدفوع" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-white">دفعة بمبلغ {Number(p.amount).toLocaleString()} ريال</div>
                    <div className="mt-0.5 text-xs text-slate-400">{p.due_date}</div>
                  </div>
                </li>
              ))}
              {payments.length === 0 && <EmptyRow text="لا يوجد نشاط حديث" />}
            </ul>
            <BottomLink to="/audit-logs">عرض جميع الأنشطة</BottomLink>
          </Panel>

          <Panel>
            <PanelTitle icon={<DollarSign className="h-4 w-4 text-rose-400" />} title="الدفعات المتأخرة" />
            <ul className="space-y-2 text-sm">
              {payments.filter((p) => p.status === "متأخر").slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-white">دفعة #{p.id.slice(0, 6)}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{p.due_date}</div>
                  </div>
                  <div className="text-rose-400 font-bold whitespace-nowrap">{Number(p.amount).toLocaleString()} ريال</div>
                </li>
              ))}
              {payments.filter((p) => p.status === "متأخر").length === 0 && <EmptyRow text="لا توجد متأخرات" />}
            </ul>
            <BottomLink to="/payments">عرض جميع المتأخرات</BottomLink>
          </Panel>
        </div>

        {/* MAINTENANCE / CONTRACTS / APPROVALS */}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <Panel>
            <PanelTitle icon={<Wrench className="h-4 w-4 text-violet-400" />} title="طلبات الصيانة" />
            <ul className="space-y-2 text-sm">
              {(extra?.maintenance ?? []).slice(0, 5).map((m: any) => (
                <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <span className="truncate text-white">{m.title ?? m.description ?? "طلب صيانة"}</span>
                  <StatusChip value={m.status ?? "جديد"} />
                </li>
              ))}
              {(!extra?.maintenance || extra.maintenance.length === 0) && <EmptyRow text="لا توجد طلبات صيانة" />}
            </ul>
            <BottomLink to="/maintenance">عرض جميع طلبات الصيانة</BottomLink>
          </Panel>

          <Panel>
            <PanelTitle icon={<FileText className="h-4 w-4 text-emerald-400" />} title="العقود التي تنتهي قريباً" />
            <ul className="space-y-2 text-sm">
              {contracts.filter((c) => c.status === "نشط").slice(0, 5).map((c) => {
                const days = Math.max(0, Math.round((new Date(c.end_date).getTime() - Date.now()) / 86400000));
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-3">
                    <span className="truncate text-white">عقد #{c.id.slice(0, 6)}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">{c.end_date}</span>
                      <span className={`font-bold ${days < 15 ? "text-rose-400" : "text-amber-400"}`}>{days} يوم</span>
                    </div>
                  </li>
                );
              })}
              {contracts.length === 0 && <EmptyRow text="لا توجد عقود" />}
            </ul>
            <BottomLink to="/contracts">عرض جميع العقود</BottomLink>
          </Panel>

          <Panel>
            <PanelTitle icon={<ClipboardList className="h-4 w-4 text-fuchsia-400" />} title="الموافقات المطلوبة" />
            <ul className="space-y-2 text-sm">
              {[
                { label: "فواتير شراء بانتظار الموافقة", n: 0 },
                { label: "مصروفات بانتظار الموافقة", n: 0 },
                { label: "سندات صرف بانتظار الموافقة", n: 0 },
                { label: "طلبات صيانة بانتظار الموافقة", n: 0 },
              ].map((r) => (
                <li key={r.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-3">
                  <span className="truncate text-white">{r.label}</span>
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-fuchsia-500/15 px-2 text-xs font-bold text-fuchsia-300">{r.n}</span>
                </li>
              ))}
            </ul>
            <BottomLink to="/notifications-center">عرض جميع الموافقات</BottomLink>
          </Panel>
        </div>

        {/* FOOTER MINI STATS */}
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 md:grid-cols-4">
          <MiniStat icon={<Users className="h-4 w-4" />} label="المستخدمون النشطون" value={0} color="text-sky-300" />
          <MiniStat icon={<FileText className="h-4 w-4" />} label="إجمالي المستندات" value={0} color="text-emerald-300" />
          <MiniStat icon={<FileCheck className="h-4 w-4" />} label="إجمالي الفواتير" value={payments.length} color="text-amber-300" />
          <MiniStat icon={<Wrench className="h-4 w-4" />} label="إجمالي الصيانة" value={extra?.maintenance?.length ?? 0} color="text-violet-300" />
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ---------- pieces ---------- */

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-lg backdrop-blur ${className}`}>
      {children}
    </section>
  );
}

function PanelTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <h3 className="text-sm font-extrabold text-white">{title}</h3>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <li className="rounded-xl border border-dashed border-white/10 bg-slate-900/40 p-3 text-center text-xs text-slate-400">{text}</li>;
}

function BottomLink({ to, children }: { to: any; children: ReactNode }) {
  return (
    <div className="mt-3 border-t border-white/5 pt-3 text-center">
      <Link to={to} className="text-xs font-bold text-sky-400 hover:text-sky-300">{children} ←</Link>
    </div>
  );
}

function StatusChip({ value }: { value: string }) {
  const map: Record<string, string> = {
    "جديد": "bg-sky-500/15 text-sky-300",
    "قيد التنفيذ": "bg-amber-500/15 text-amber-300",
    "بانتظار قطع": "bg-fuchsia-500/15 text-fuchsia-300",
    "منتهي": "bg-emerald-500/15 text-emerald-300",
    "مكتمل": "bg-emerald-500/15 text-emerald-300",
    "ملغي": "bg-rose-500/15 text-rose-300",
  };
  const cls = map[value] ?? "bg-slate-700/40 text-slate-300";
  return <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${cls}`}>{value}</span>;
}

function MiniStat({ icon, label, value, color }: { icon: ReactNode; label: string; value: any; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`grid h-9 w-9 place-items-center rounded-xl bg-white/5 ${color}`}>{icon}</div>
      <div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-lg font-extrabold text-white">{Number(value).toLocaleString()}</div>
      </div>
    </div>
  );
}

function ModuleCard({
  to, title, subtitle, count, icon, accent, glow, bars, stats, footer, head,
}: {
  to: any; title: string; subtitle: string; count: number; icon: ReactNode;
  accent: string; glow: string; head?: string;
  bars: { label: string; value: number; total: number; color: string }[];
  stats: { label: string; value: number; tone: string }[];
  footer: { label: string; value: number; tone?: string }[];
}) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl ${glow} backdrop-blur transition hover:-translate-y-0.5 hover:border-white/20`}>
      <div className="mb-4 flex items-center justify-between">
        <Link to={to} className="text-xs font-bold text-sky-400 hover:text-sky-300">عرض التفاصيل ←</Link>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-base font-extrabold text-white">{title}</div>
            <div className="text-[11px] text-slate-400">{subtitle}</div>
          </div>
          <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
            {icon}
          </div>
        </div>
      </div>

      <div className="mb-4 text-center">
        <div className="text-4xl font-extrabold text-white">{count}</div>
        <div className="mt-0.5 text-xs text-slate-400">{head ?? subtitle}</div>
      </div>

      <div className="space-y-2">
        {bars.map((b) => {
          const pct = b.total ? Math.round((b.value / b.total) * 100) : 0;
          return (
            <div key={b.label} className="flex items-center gap-3 text-xs">
              <span className="w-8 text-left tabular-nums text-slate-400">{b.value}</span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div className={`h-full ${b.color}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-12 text-right tabular-nums text-slate-400">{pct}%</span>
              <span className="w-24 shrink-0 text-right text-slate-300">{b.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-1.5 border-t border-white/5 pt-3 text-xs">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className={`font-bold ${s.tone}`}>{Number(s.value).toLocaleString()} ريال</span>
            <span className="text-slate-300">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
        {footer.map((f) => (
          <div key={f.label} className="rounded-xl bg-white/5 p-2 text-center">
            <div className={`text-base font-extrabold ${f.tone ?? "text-white"}`}>{f.value}</div>
            <div className="mt-0.5 text-[10px] text-slate-400">{f.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <DashboardLayout title="لوحة التحكم">
      <div className="-mx-4 -my-6 md:-mx-8 md:-my-8 min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-6 md:px-8 md:py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-slate-900" />
          ))}
        </div>
        <div className="mt-5 h-72 animate-pulse rounded-2xl border border-white/10 bg-slate-900" />
      </div>
    </DashboardLayout>
  );
}
