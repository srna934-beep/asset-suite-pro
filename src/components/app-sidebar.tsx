import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sb } from "@/lib/sb";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Building2, Home, Users, FileText, DollarSign, Wrench, FolderOpen,
  Bell, Calculator, BarChart3, Settings, Building, MousePointerClick,
  Car, Map, UserCog, ListChecks, MessageSquare, Wallet, ShieldCheck, History,
  CalendarCheck, Plane, FileSignature, PieChart, Briefcase, Target,
} from "lucide-react";

const sections = [
  {
    label: "الرئيسية",
    adminOnly: false,
    items: [{ to: "/", label: "لوحة التحكم", icon: LayoutDashboard }],
  },
  {
    label: "الأصول",
    adminOnly: false,
    items: [
      { to: "/properties-dashboard", label: "لوحة العقارات", icon: LayoutDashboard },
      { to: "/properties", label: "العقارات", icon: Building2 },
      { to: "/units", label: "الوحدات", icon: Home },
      { to: "/vehicles-dashboard", label: "لوحة المركبات", icon: LayoutDashboard },
      { to: "/vehicles", label: "المركبات", icon: Car },
      { to: "/lands-dashboard", label: "لوحة الأراضي", icon: LayoutDashboard },
      { to: "/lands", label: "الأراضي", icon: Map },
    ],
  },
  {
    label: "المشاريع والأهداف",
    adminOnly: false,
    items: [
      { to: "/projects-dashboard", label: "لوحة المشاريع", icon: LayoutDashboard },
      { to: "/projects", label: "المشاريع", icon: Briefcase },
      { to: "/goals", label: "الأهداف", icon: Target },
    ],
  },
  {
    label: "العملاء والعقود",
    adminOnly: false,
    items: [
      { to: "/tenants", label: "المستأجرين", icon: Users },
      { to: "/contracts", label: "العقود", icon: FileText },
      { to: "/payments", label: "الدفعات", icon: DollarSign },
    ],
  },
  {
    label: "العمليات",
    adminOnly: false,
    items: [
      { to: "/maintenance", label: "الصيانة", icon: Wrench },
      { to: "/documents", label: "الوثائق", icon: FolderOpen },
      { to: "/tasks", label: "المهام", icon: ListChecks },
      { to: "/messages", label: "الرسائل", icon: MessageSquare },
      { to: "/notifications-center", label: "التنبيهات", icon: Bell },
    ],
  },
  {
    label: "الموارد البشرية",
    adminOnly: false,
    items: [
      { to: "/employees", label: "الموظفين", icon: UserCog },
      { to: "/departments", label: "الأقسام", icon: Building },
      { to: "/employment-contracts", label: "عقود الموظفين", icon: FileSignature },
      { to: "/attendance", label: "الحضور والانصراف", icon: CalendarCheck },
      { to: "/leaves", label: "الإجازات", icon: Plane },
    ],
  },
  {
    label: "المالية",
    adminOnly: false,
    items: [
      { to: "/finance-dashboard", label: "لوحة المالية", icon: LayoutDashboard },
      { to: "/budgets", label: "الميزانيات والتخطيط", icon: PieChart },
      { to: "/accounts", label: "الحسابات", icon: Wallet },
      { to: "/transactions", label: "الحركات المالية", icon: Calculator },
      { to: "/accounting", label: "المحاسبة", icon: DollarSign },
      { to: "/reports", label: "التقارير", icon: BarChart3 },
    ],
  },
  {
    label: "النظام",
    adminOnly: true,
    items: [
      { to: "/settings", label: "الإعدادات", icon: Settings },
      { to: "/super-admin", label: "إدارة النظام", icon: ShieldCheck },
      { to: "/audit-logs", label: "سجل التدقيق", icon: History },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const { data: roleData } = useQuery(queryOptions({
    queryKey: ["my-role", user?.id],
    queryFn: async () => {
      if (!user) return { role: "user", vis: [] as any[], userVis: [] as any[] };
      const [{ data: r }, { data: v }, { data: uv }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
        sb("module_visibility").select("*"),
        sb("user_module_visibility").select("*").eq("user_id", user.id),
      ]);
      return { role: (r as any)?.role ?? "user", vis: (v ?? []) as any[], userVis: (uv ?? []) as any[] };
    },
    enabled: !!user,
  }));
  const role = roleData?.role ?? "user";
  const vis = roleData?.vis ?? [];
  const userVis = roleData?.userVis ?? [];
  const isAdmin = role === "admin" || role === "super_admin";
  const canSee = (to: string) => {
    // Per-user override wins
    const uRow = userVis.find((x: any) => x.module_key === to);
    if (uRow) return uRow.visible;
    if (isAdmin) return true;
    const row = vis.find((x: any) => x.module_key === to && x.role === role);
    return row ? row.visible : true;
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
          <Building className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-extrabold">منصة الأصول</div>
          <div className="text-[11px] text-sidebar-muted">Enterprise ERP</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((sec) => {
          if ((sec as any).adminOnly && !isAdmin) return null;
          const visibleItems = sec.items.filter((i) => canSee(i.to));
          if (visibleItems.length === 0) return null;
          return (
            <div key={sec.label} className="mb-4">
                {sec.label}
              </div>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          active ? "bg-sidebar-active text-white shadow-sm" : "text-sidebar-foreground/85 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>


      <div className="m-3 rounded-xl border border-sidebar-border/60 bg-white/5 p-3 text-center">
        <div className="mb-1 text-xs font-bold">نظام موحد</div>
        <p className="text-[10px] leading-relaxed text-sidebar-muted">عقارات • مركبات • أراضي • موارد بشرية • مالية</p>
        <MousePointerClick className="mx-auto mt-2 h-4 w-4 text-sidebar-muted" />
      </div>
    </aside>
  );
}
