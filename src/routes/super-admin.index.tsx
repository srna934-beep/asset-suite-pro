import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AdminOnly } from "@/components/admin-only";
import { sb } from "@/lib/sb";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Users as UsersIcon, Eye, EyeOff, UserPlus, Trash2, KeyRound, CheckCircle2, Archive, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListUsers, adminCreateUser, adminUpdateUser, adminDeleteUser, adminSetVisibility,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/super-admin/")({
  head: () => ({ meta: [{ title: "إدارة النظام | منصة الأصول" }] }),
  component: SuperAdminPage,
});

// قائمة الوحدات وأنواع الإجراءات موحدة في src/lib/permissions.ts (مصدر واحد)


const ROLES = [
  { v: "super_admin", l: "مدير عام" },
  { v: "admin", l: "مدير" },
  { v: "manager", l: "مسؤول" },
  { v: "accountant", l: "محاسب" },
  { v: "hr", l: "موارد بشرية" },
  { v: "user", l: "مستخدم" },
];

const STATUS_LABEL: Record<string, { l: string; c: string }> = {
  approved: { l: "معتمد", c: "bg-emerald-100 text-emerald-700" },
  pending: { l: "بانتظار الاعتماد", c: "bg-amber-100 text-amber-700" },
  archived: { l: "مؤرشف", c: "bg-slate-200 text-slate-700" },
};

function SuperAdminPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListUsers);
  const createFn = useServerFn(adminCreateUser);
  const updateFn = useServerFn(adminUpdateUser);
  const deleteFn = useServerFn(adminDeleteUser);
  const visFn = useServerFn(adminSetVisibility);

  const [settings, setSettings] = useState<any>(null);
  const [visUser, setVisUser] = useState<any>(null);

  const { data: settingsRow } = useQuery(queryOptions({
    queryKey: ["system-settings"],
    queryFn: async () => (await supabase.from("system_settings").select("*").eq("id", 1).maybeSingle()).data,
  }));
  useEffect(() => { if (settingsRow) setSettings(settingsRow); }, [settingsRow]);

  const { data } = useQuery(queryOptions({
    queryKey: ["admin-users"],
    queryFn: async () => await listFn(),
  }));

  async function saveSettings() {
    if (!settings) return;
    const { error } = await supabase.from("system_settings").update({
      company_name: settings.company_name, default_currency: settings.default_currency, company_logo_url: settings.company_logo_url,
    }).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الإعدادات");
  }

  const userRole = (uid: string) => (data?.roles ?? []).find((r: any) => r.user_id === uid)?.role ?? "user";
  const userVis = (uid: string, mk: string) => {
    const row = (data?.visibility ?? []).find((v: any) => v.user_id === uid && v.module_key === mk);
    return row ? row.visible : true;
  };

  async function handleCreate(form: FormData) {
    try {
      await createFn({ data: {
        username: String(form.get("username") || ""),
        password: String(form.get("password") || ""),
        full_name: String(form.get("full_name") || ""),
        role: String(form.get("role") || "user"),
        approve: form.get("approve") === "on",
      }});
      toast.success("تم إنشاء المستخدم");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleUpdate(uid: string, patch: any) {
    try {
      await updateFn({ data: { user_id: uid, ...patch } });
      toast.success("تم الحفظ");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete(uid: string) {
    if (!confirm("حذف المستخدم نهائياً؟")) return;
    try {
      await deleteFn({ data: { user_id: uid } });
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) { toast.error(e.message); }
  }

  async function toggleVis(uid: string, mk: string, current: boolean) {
    await visFn({ data: { user_id: uid, module_key: mk, visible: !current } });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <AdminOnly superAdmin>
    <DashboardLayout title="إدارة النظام" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-100 text-rose-700"><ShieldCheck className="h-6 w-6" /></div>}>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 mb-5 text-sm text-amber-900">
        هذه الصفحة متاحة لمدراء النظام فقط. التغييرات تطبق فوراً على جميع المستخدمين.
      </div>

      {/* Settings */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-base font-extrabold">إعدادات الشركة</h2>
        {settings && (
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>اسم الشركة</Label><Input value={settings.company_name ?? ""} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} /></div>
            <div><Label>العملة الافتراضية</Label><Input value={settings.default_currency ?? ""} onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>رابط شعار الشركة</Label><Input value={settings.company_logo_url ?? ""} onChange={(e) => setSettings({ ...settings, company_logo_url: e.target.value })} /></div>
          </div>
        )}
        <Button onClick={saveSettings}><Save className="ml-1 h-4 w-4" />حفظ</Button>
      </section>

      {/* Users */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-extrabold flex items-center gap-2"><UsersIcon className="h-5 w-5" /> إدارة المستخدمين</h2>
          <CreateUserDialog onCreate={handleCreate} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead>
              <tr className="bg-muted/40 text-xs">
                <th className="px-3 py-2">الاسم</th>
                <th className="px-3 py-2">اسم المستخدم</th>
                <th className="px-3 py-2">الدور</th>
                <th className="px-3 py-2">الحالة</th>
                <th className="px-3 py-2 w-[320px]">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {(data?.profiles ?? []).map((p: any) => {
                const role = userRole(p.id);
                const st = STATUS_LABEL[p.status] ?? STATUS_LABEL.pending;
                return (
                  <tr key={p.id} className="border-t border-border align-top">
                    <td className="px-3 py-2 font-semibold">
                      <Input defaultValue={p.full_name ?? ""} onBlur={(e) => { if (e.target.value !== p.full_name) handleUpdate(p.id, { full_name: e.target.value }); }} className="h-8" />
                    </td>
                    <td className="px-3 py-2" dir="ltr">
                      <Input defaultValue={p.username ?? ""} onBlur={(e) => { if (e.target.value !== p.username) handleUpdate(p.id, { username: e.target.value }); }} className="h-8" />
                    </td>
                    <td className="px-3 py-2">
                      <select className="h-8 rounded-md border border-input px-2 text-xs" value={role} onChange={(e) => handleUpdate(p.id, { role: e.target.value })}>
                        {ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${st.c}`}>{st.l}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {p.status !== "approved" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUpdate(p.id, { status: "approved" })}>
                            <CheckCircle2 className="ml-1 h-3 w-3" /> اعتماد
                          </Button>
                        )}
                        {p.status !== "archived" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUpdate(p.id, { status: "archived" })}>
                            <Archive className="ml-1 h-3 w-3" /> أرشفة
                          </Button>
                        )}
                        <ResetPasswordDialog uid={p.id} onSave={handleUpdate} />
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setVisUser(p)}>
                          <Eye className="ml-1 h-3 w-3" /> الصلاحيات
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="ml-1 h-3 w-3" /> حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* مصفوفة الصلاحيات الكاملة لكل مستخدم */}
      <Dialog open={!!visUser} onOpenChange={(o) => !o && setVisUser(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-right">
              مصفوفة الصلاحيات — {visUser?.full_name}
              {visUser && userRole(visUser.id) === "super_admin" && " (مدير عام: كل الصلاحيات)"}
            </DialogTitle>
          </DialogHeader>
          {visUser && (
            userRole(visUser.id) === "super_admin" ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                المدير العام يمتلك جميع الصلاحيات بدون استثناء ولا يمكن تقييده.
              </p>
            ) : (
              <div className="max-h-[65vh] overflow-auto">
                <table className="w-full min-w-[760px] text-right text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="px-3 py-2">الوحدة</th>
                      {ACTIONS.map((a) => (
                        <th key={a} className="px-2 py-2 text-center">{ACTION_LABEL[a]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.filter((m) => !SUPER_ADMIN_ONLY.includes(m.key)).map((m) => (
                      <tr key={m.key} className="border-t border-border">
                        <td className="px-3 py-2 font-bold">{m.label}</td>
                        {ACTIONS.map((a) => {
                          const key = permKey(m.key, a);
                          const on = userPerm(visUser.id, m.key, a);
                          return (
                            <td key={a} className="px-2 py-1.5 text-center">
                              <button
                                onClick={() => toggleVis(visUser.id, key, on)}
                                title={`${m.label} — ${ACTION_LABEL[a]}`}
                                className={`inline-grid h-7 w-7 place-items-center rounded-md border ${on ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-600"}`}
                              >
                                {on ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
    </AdminOnly>
  );
}

function CreateUserDialog({ onCreate }: { onCreate: (fd: FormData) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><UserPlus className="ml-1 h-4 w-4" /> مستخدم جديد</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-right">إنشاء مستخدم جديد</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onCreate(new FormData(e.currentTarget)); setOpen(false); }} className="space-y-3">
          <div><Label className="text-right block text-xs font-bold">الاسم الكامل</Label><Input name="full_name" required /></div>
          <div><Label className="text-right block text-xs font-bold">اسم المستخدم (بالإنجليزي)</Label><Input name="username" required dir="ltr" pattern="[a-zA-Z0-9_.-]+" /></div>
          <div><Label className="text-right block text-xs font-bold">كلمة المرور</Label><Input name="password" type="password" required minLength={6} /></div>
          <div>
            <Label className="text-right block text-xs font-bold">الدور</Label>
            <select name="role" defaultValue="user" className="h-9 w-full rounded-md border border-input px-2 text-sm">
              {ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
            </select>
          </div>
          <label className="flex flex-row-reverse items-center gap-2 text-xs"><input type="checkbox" name="approve" defaultChecked /> اعتماد الحساب فوراً</label>
          <DialogFooter><Button type="submit" className="w-full">إنشاء</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ uid, onSave }: { uid: string; onSave: (uid: string, patch: any) => void }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs"><KeyRound className="ml-1 h-3 w-3" /> كلمة مرور</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-right">تعيين كلمة مرور جديدة</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="كلمة المرور الجديدة" />
          <Button className="w-full" onClick={() => { if (pw.length < 6) return toast.error("6 أحرف على الأقل"); onSave(uid, { password: pw }); setPw(""); setOpen(false); }}>حفظ</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
