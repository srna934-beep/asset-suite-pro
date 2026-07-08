import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, User as UserIcon, Lock } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { resolveUsernameEmail } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "تسجيل الدخول | إدارة الأملاك" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const resolve = useServerFn(resolveUsernameEmail);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return toast.error("أدخل اسم المستخدم");
    setLoading(true);
    try {
      const { email } = await resolve({ data: { username: username.trim() } });
      const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Check approval status
      const { data: prof } = await supabase.from("profiles").select("status").eq("id", signIn.user!.id).maybeSingle();
      if (prof && prof.status !== "approved") {
        await supabase.auth.signOut();
        throw new Error(prof.status === "pending" ? "حسابك بانتظار اعتماد المدير" : "تم أرشفة الحساب — تواصل مع المدير");
      }
      toast.success("تم تسجيل الدخول");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message || "بيانات الدخول غير صحيحة");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-900 to-slate-700 p-4" dir="rtl">
      <form onSubmit={handleSignIn} className="w-full max-w-md rounded-3xl bg-card p-8 shadow-2xl space-y-4">
        <div className="mb-2 flex flex-col items-center gap-2 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Building className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold">إدارة الأملاك</h1>
          <p className="text-sm text-muted-foreground">نظام إدارة الأصول والأعمال</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-right block text-xs font-bold">اسم المستخدم</Label>
          <div className="relative">
            <UserIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input required autoFocus dir="ltr" value={username} onChange={(e) => setUsername(e.target.value)} className="pr-9 text-right" placeholder="username" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-right block text-xs font-bold">كلمة المرور</Label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-9" />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : "تسجيل الدخول"}</Button>
        <p className="text-center text-[11px] text-muted-foreground">
          الحسابات تُنشأ فقط من قبل مدير النظام.
        </p>
      </form>
    </div>
  );
}
