import { useState, type ReactNode, useEffect } from "react";
import { AppSidebar } from "./app-sidebar";
import { Search, Menu, X, ShieldAlert } from "lucide-react";
import { NotificationsPopover } from "./notifications-popover";
import { ProfileMenu } from "./profile-menu";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { usePerms } from "@/hooks/use-perms";
import { moduleForPath, moduleLabel } from "@/lib/permissions";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./global-search";


export function DashboardLayout({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loading, session } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { can, loading: permsLoading } = usePerms();
  const moduleKey = moduleForPath(pathname);
  const allowed = permsLoading ? true : can(moduleKey, "view");

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);




  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-72 bg-sidebar text-sidebar-foreground shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute left-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-white">
              <X className="h-5 w-5" />
            </button>
            <div className="relative h-full overflow-y-auto">
              <MobileSidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="lg:mr-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:px-8 md:py-4">
          <button onClick={() => setMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-border lg:hidden" aria-label="القائمة">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-3">
            {icon}
            <h1 className="truncate text-xl font-extrabold tracking-tight md:text-2xl">{title}</h1>
          </div>
          <div className="mr-auto flex items-center gap-2 md:gap-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("global-search", { detail: "" }))}
              className="hidden h-10 w-56 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground transition hover:border-primary md:flex"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">ابحث في النظام...</span>
              <span className="mr-auto shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold" dir="ltr">Ctrl K</span>
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("global-search", { detail: "" }))}
              aria-label="بحث"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border md:hidden"
            >
              <Search className="h-4 w-4" />
            </button>
            <ThemeToggle />
            <NotificationsPopover />
            <ProfileMenu />
          </div>
        </header>
        <GlobalSearch />

        <main className="px-4 py-6 md:px-8 md:py-8">
          {allowed ? (
            children
          ) : (
            <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
              <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-rose-600" />
              <h2 className="text-lg font-extrabold text-rose-900">لا تملك صلاحية الوصول</h2>
              <p className="mt-2 text-sm text-rose-700">
                صفحة «{moduleKey ? moduleLabel(moduleKey) : title}» غير مصرح لك بعرضها. تواصل مع المدير العام لمنحك الصلاحية.
              </p>
              <Link to="/" className="mt-4 inline-flex rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white">
                رجوع للرئيسية
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function MobileSidebarContent({ onNavigate }: { onNavigate: () => void }) {
  // Wrap AppSidebar so clicking a link closes the sheet
  return (
    <div onClickCapture={(e) => {
      const t = e.target as HTMLElement;
      if (t.closest("a")) onNavigate();
    }} className="block lg:!hidden h-full">
      <div className="[&>aside]:!static [&>aside]:!flex [&>aside]:!w-full">
        <AppSidebar />
      </div>
    </div>
  );
}
