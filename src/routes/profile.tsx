import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserCircle } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "الملف الشخصي" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      setProfile(data ?? { id: u.user.id, full_name: "", phone: "" });
    })();
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: profile.id, full_name: profile.full_name, phone: profile.phone, updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الملف الشخصي");
  }

  async function changePwd() {
    if (!newPwd || newPwd.length < 8) return toast.error("8 أحرف على الأقل");
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) return toast.error(error.message);
    toast.success("تم تغيير كلمة المرور");
    setNewPwd("");
  }

  if (!profile) return <DashboardLayout title="الملف الشخصي"><div className="h-40 animate-pulse bg-card rounded-2xl" /></DashboardLayout>;

  return (
    <DashboardLayout title="الملف الشخصي" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><UserCircle className="h-6 w-6" /></div>}>
      <div className="max-w-2xl space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-extrabold">المعلومات الشخصية</h2>
          <div className="space-y-1.5"><Label>الاسم الكامل</Label>
            <Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>الجوال</Label>
            <Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>البريد الإلكتروني</Label>
            <Input value={email} disabled /></div>
          <Button onClick={save} disabled={saving}>{saving ? "..." : "حفظ التغييرات"}</Button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-base font-extrabold">تغيير كلمة المرور</h2>
          <div className="space-y-1.5"><Label>كلمة المرور الجديدة</Label>
            <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} /></div>
          <Button variant="outline" onClick={changePwd}>تحديث كلمة المرور</Button>
        </section>
      </div>
    </DashboardLayout>
  );
}
