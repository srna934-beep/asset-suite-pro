import { useState, type ReactNode, useEffect } from "react";
import { AppSidebar } from "./app-sidebar";
import { Search, Menu, X } from "lucide-react";
import { NotificationsPopover } from "./notifications-popover";
import { ProfileMenu } from "./profile-menu";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";

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
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="ابحث..."
                className="h-10 w-56 rounded-xl border border-border bg-card pl-3 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(e) => window.dispatchEvent(new CustomEvent("global-search", { detail: e.target.value }))}
              />
            </div>
            <NotificationsPopover />
            <ProfileMenu />
          </div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
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
