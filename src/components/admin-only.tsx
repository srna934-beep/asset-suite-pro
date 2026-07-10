import type { ReactNode } from "react";
import { useRole } from "@/hooks/use-role";
import { DashboardLayout } from "./dashboard-layout";
import { ShieldAlert } from "lucide-react";

export function AdminOnly({
  children,
  title = "غير مصرح",
  superAdmin = false,
}: {
  children: ReactNode;
  title?: string;
  superAdmin?: boolean;
}) {
  const { isAdmin, isSuperAdmin, loading } = useRole();
  const allowed = superAdmin ? isSuperAdmin : isAdmin;
  if (loading) {
    return (
      <DashboardLayout title={title}>
        <div className="py-16 text-center text-sm text-muted-foreground">جارٍ التحقق من الصلاحيات...</div>
      </DashboardLayout>
    );
  }
  if (!allowed) {
    return (
      <DashboardLayout title="غير مصرح" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-700"><ShieldAlert className="h-6 w-6" /></div>}>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-rose-600" />
          <h2 className="text-lg font-extrabold text-rose-900">
            {superAdmin ? "هذه الصفحة مخصصة للمدير العام فقط" : "هذه الصفحة مخصصة لمدراء النظام فقط"}
          </h2>
          <p className="mt-2 text-sm text-rose-700">إذا كنت تحتاج للوصول، تواصل مع المدير العام.</p>
        </div>
      </DashboardLayout>
    );
  }
  return <>{children}</>;
}
