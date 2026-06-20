import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { Search, Bell, Menu } from "lucide-react";

export function DashboardLayout({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="lg:mr-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:px-8 md:py-4">
          <button className="grid h-9 w-9 place-items-center rounded-lg border border-border lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-3">
            {icon}
            <h1 className="truncate text-2xl font-extrabold tracking-tight md:text-3xl">
              {title}
            </h1>
          </div>
          <div className="mr-auto flex items-center gap-2 md:gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="ابحث في النظام..."
                className="h-10 w-64 rounded-xl border border-border bg-card pl-3 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card hover:bg-accent">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">3</span>
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                م ع
              </div>
              <div className="hidden text-right leading-tight md:block">
                <div className="text-xs font-bold">محمد العتيبي</div>
                <div className="text-[10px] text-muted-foreground">مدير النظام</div>
              </div>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
