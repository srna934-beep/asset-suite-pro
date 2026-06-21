import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Mail, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "تسجيل الدخول | إدارة الأملاك" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم تسجيل الدخول");
    navigate({ to: "/" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء الحساب — جارٍ تسجيل الدخول");
    navigate({ to: "/" });
  }

  async function handleGoogle() {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) { setLoading(false); toast.error("تعذر تسجيل الدخول عبر Google"); }
  }

  async function handleForgot() {
    if (!email) return toast.error("أدخل بريدك الإلكتروني أولاً");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("تم إرسال رابط استعادة كلمة المرور");
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-900 to-slate-700 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Building className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold">إدارة الأملاك</h1>
          <p className="text-sm text-muted-foreground">نظام إدارة العقارات الاحترافي</p>
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">دخول</TabsTrigger>
            <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-bold">البريد الإلكتروني</Label>
                <div className="relative"><Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pr-9" /></div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-bold">كلمة المرور</Label>
                <div className="relative"><Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-9" /></div>
              </div>
              <button type="button" onClick={handleForgot} className="text-xs text-primary hover:underline">نسيت كلمة المرور؟</button>
              <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : "تسجيل الدخول"}</Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-bold">الاسم الكامل</Label>
                <div className="relative"><UserIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="pr-9" /></div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-bold">البريد الإلكتروني</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-right block text-xs font-bold">كلمة المرور (8+ أحرف)</Label>
                <Input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : "إنشاء حساب"}</Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> أو <div className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" className="w-full" disabled={loading} onClick={handleGoogle}>
          متابعة باستخدام Google
        </Button>
      </div>
    </div>
  );
}
