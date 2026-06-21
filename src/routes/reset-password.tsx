import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "استعادة كلمة المرور" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث كلمة المرور");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-900 p-4" dir="rtl">
      <form onSubmit={handle} className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-8 shadow-xl">
        <h1 className="text-xl font-extrabold text-center">كلمة مرور جديدة</h1>
        <div className="space-y-1.5">
          <Label className="text-right block text-xs font-bold">كلمة المرور الجديدة</Label>
          <Input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className="w-full">{loading ? "..." : "تحديث كلمة المرور"}</Button>
      </form>
    </div>
  );
}
