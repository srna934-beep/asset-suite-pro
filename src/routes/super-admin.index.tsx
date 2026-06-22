import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { sb } from "@/lib/sb";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Users as UsersIcon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/")({
  head: () => ({ meta: [{ title: "إدارة النظام | منصة الأصول" }] }),
  component: SuperAdminPage,
});

const MODULES = [
  { key: "/vehicles", label: "المركبات" },
  { key: "/lands", label: "الأراضي" },
  { key: "/employees", label: "الموظفين" },
  { key: "/departments", label: "الأقسام" },
  { key: "/tasks", label: "المهام" },
  { key: "/messages", label: "الرسائل" },
  { key: "/accounts", label: "الحسابات" },
  { key: "/transactions", label: "الحركات المالية" },
  { key: "/audit-logs", label: "سجل التدقيق" },
];

const ROLES = ["user", "manager", "accountant", "hr"];

function SuperAdminPage() {
  const qc = useQueryClient();
  const [settings, setSettings] = useState<any>(null);

  const { data } = useQuery(queryOptions({
    queryKey: ["super-admin"],
    queryFn: async () => {
      const [{ data: s }, { data: roles }, { data: profs }, { data: vis }] = await Promise.all([
        supabase.from("system_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("user_roles").select("*"),
        supabase.from("profiles").select("id, full_name"),
        sb("module_visibility").select("*"),
      ]);
      return { s, roles: (roles ?? []) as any[], profs: (profs ?? []) as any[], vis: (vis ?? []) as any[] };
    },
  }));

  useEffect(() => { if (data?.s) setSettings(data.s); }, [data]);

  async function saveSettings() {
    if (!settings) return;
    const { error } = await supabase.from("system_settings").update({
      company_name: settings.company_name, default_currency: settings.default_currency, company_logo_url: settings.company_logo_url,
    }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الإعدادات");
  }

  async function toggleVisibility(moduleKey: string, role: string, current: boolean) {
    const row = (data?.vis ?? []).find((v: any) => v.module_key === moduleKey && v.role === role);
    if (row) {
      await sb("module_visibility").update({ visible: !current }).eq("id", row.id);
    } else {
      await sb("module_visibility").insert({ module_key: moduleKey, role, visible: !current });
    }
    qc.invalidateQueries({ queryKey: ["super-admin"] });
  }

  function isVisible(moduleKey: string, role: string) {
    const row = (data?.vis ?? []).find((v: any) => v.module_key === moduleKey && v.role === role);
    return row ? row.visible : true;
  }

  async function changeRole(userId: string, newRole: string) {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
    toast.success("تم تحديث الدور");
    qc.invalidateQueries({ queryKey: ["super-admin"] });
  }

  const userRole = (uid: string) => (data?.roles ?? []).find((r: any) => r.user_id === uid)?.role ?? "user";
  const userName = (uid: string) => (data?.profs ?? []).find((p: any) => p.id === uid)?.full_name ?? uid.slice(0, 8);

  return (
    <DashboardLayout title="إدارة النظام (Super Admin)" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-700"><ShieldCheck className="h-6 w-6" /></div>}>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 mb-5 text-sm text-amber-900">
        هذه الصفحة متاحة للمدراء العامين فقط. التغييرات تطبق فوراً على جميع المستخدمين.
      </div>

      <section className="mb-6 rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-extrabold">إعدادات النظام</h2>
        {settings && (
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>اسم الشركة</Label><Input value={settings.company_name ?? ""} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} /></div>
            <div><Label>العملة الافتراضية</Label><Input value={settings.default_currency ?? ""} onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>رابط شعار الشركة</Label><Input value={settings.company_logo_url ?? ""} onChange={(e) => setSettings({ ...settings, company_logo_url: e.target.value })} /></div>
          </div>
        )}
        <Button onClick={saveSettings}>حفظ الإعدادات</Button>
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-extrabold mb-3 flex items-center gap-2"><UsersIcon className="h-5 w-5" /> أدوار المستخدمين</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-xs"><th className="px-3 py-2">المستخدم</th><th className="px-3 py-2">الدور الحالي</th><th className="px-3 py-2">تغيير</th></tr></thead>
            <tbody>
              {(data?.profs ?? []).map((p: any) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold">{userName(p.id)}</td>
                  <td className="px-3 py-2"><code className="text-xs">{userRole(p.id)}</code></td>
                  <td className="px-3 py-2">
                    <select className="h-8 rounded-md border border-input px-2 text-xs" defaultValue="" onChange={(e) => { if (e.target.value) changeRole(p.id, e.target.value); }}>
                      <option value="">— تغيير الدور —</option>
                      {["super_admin", "admin", ...ROLES].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-extrabold mb-3">إظهار/إخفاء الموديولات حسب الدور</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-right text-sm">
            <thead><tr className="bg-muted/40 text-xs"><th className="px-3 py-2">الموديول</th>{ROLES.map(r => <th key={r} className="px-3 py-2">{r}</th>)}</tr></thead>
            <tbody>
              {MODULES.map(m => (
                <tr key={m.key} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold">{m.label}</td>
                  {ROLES.map(r => {
                    const v = isVisible(m.key, r);
                    return (
                      <td key={r} className="px-3 py-2">
                        <button onClick={() => toggleVisibility(m.key, r, v)} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${v ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {v ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}{v ? "ظاهر" : "مخفي"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">الإعدادات محفوظة في قاعدة البيانات. سيتم تطبيقها في القائمة الجانبية في المراحل القادمة.</p>
      </section>
    </DashboardLayout>
  );
}
