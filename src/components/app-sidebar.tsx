import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  DollarSign,
  Wrench,
  FolderOpen,
  Bell,
  Calculator,
  BarChart3,
  Settings,
  Building,
  MousePointerClick,
} from "lucide-react";

const sections = [
  {
    label: "الرئيسية",
    items: [{ to: "/", label: "لوحة التحكم", icon: LayoutDashboard }],
  },
  {
    label: "القوائم",
    items: [
      { to: "/properties", label: "العقارات", icon: Building2 },
      { to: "/units", label: "الوحدات", icon: Home },
      { to: "/tenants", label: "المستأجرين", icon: Users },
      { to: "/contracts", label: "العقود", icon: FileText },
      { to: "/payments", label: "الدفعات", icon: DollarSign },
      { to: "/maintenance", label: "الصيانة", icon: Wrench },
      { to: "/documents", label: "الوثائق", icon: FolderOpen },
      { to: "/tasks", label: "المهام والتنبيهات", icon: Bell },
    ],
  },
  {
    label: "المالية والتقارير",
    items: [
      { to: "/accounting", label: "المحاسبة والمالية", icon: Calculator },
      { to: "/reports", label: "التقارير", icon: BarChart3 },
      { to: "/settings", label: "الإعدادات", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
          <Building className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-extrabold">إدارة الأملاك</div>
          <div className="text-[11px] text-sidebar-muted">Real Estate ERP</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((sec) => (
          <div key={sec.label} className="mb-5">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-sidebar-muted">
              {sec.label}
            </div>
            <ul className="space-y-0.5">
              {sec.items.map((item) => {
                const active =
                  item.to === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-sidebar-active text-white shadow-sm"
                          : "text-sidebar-foreground/85 hover:bg-white/5 hover:text-white"
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
        ))}
      </nav>

      <div className="m-3 rounded-xl border border-sidebar-border/60 bg-white/5 p-4 text-center">
        <div className="mb-2 text-sm font-bold">كيفية التنقل</div>
        <p className="text-[11px] leading-relaxed text-sidebar-muted">
          اضغط على أي صف لفتح الصفحة الخاصة به والاطلاع على التفاصيل
        </p>
        <MousePointerClick className="mx-auto mt-2 h-5 w-5 text-sidebar-muted" />
      </div>
    </aside>
  );
}
