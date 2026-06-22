import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Settings as SettingsIcon, User, ShieldCheck, MessageSquare, ListChecks, Wallet } from "lucide-react";

export const Route = createFileRoute("/settings/")({
  head: () => ({ meta: [{ title: "الإعدادات | منصة الأصول" }] }),
  component: SettingsPage,
});

const LINKS = [
  { to: "/profile", icon: User, label: "الملف الشخصي", desc: "تعديل بياناتك وكلمة المرور" },
  { to: "/super-admin", icon: ShieldCheck, label: "إدارة النظام", desc: "اسم الشركة، الأدوار، الموديولات (للمدراء)" },
  { to: "/audit-logs", icon: ListChecks, label: "سجل التدقيق", desc: "عرض جميع العمليات على البيانات" },
  { to: "/messages", icon: MessageSquare, label: "الرسائل الداخلية", desc: "تواصل مع باقي المستخدمين" },
  { to: "/accounts", icon: Wallet, label: "إدارة الحسابات", desc: "الحسابات النقدية والبنكية" },
];

function SettingsPage() {
  return (
    <DashboardLayout title="الإعدادات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700"><SettingsIcon className="h-6 w-6" /></div>}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map(l => {
          const Icon = l.icon;
          return (
            <Link key={l.to} to={l.to} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-3 text-base font-extrabold">{l.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{l.desc}</p>
            </Link>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
