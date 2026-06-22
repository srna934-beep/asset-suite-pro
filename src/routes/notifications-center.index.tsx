import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCheck, BellOff } from "lucide-react";

export const Route = createFileRoute("/notifications-center/")({
  head: () => ({ meta: [{ title: "مركز الإشعارات | منصة الأصول" }] }),
  component: NotificationsCenter,
});

function NotificationsCenter() {
  const qc = useQueryClient();
  const { data = [] } = useQuery(queryOptions({
    queryKey: ["notifications-center"],
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  }));

  useEffect(() => {
    supabase.rpc("generate_alert_notifications" as any).then(() => qc.invalidateQueries({ queryKey: ["notifications-center"] }));
  }, [qc]);

  const items = data as any[];
  const unread = items.filter((n) => !n.read).length;

  async function markAll() {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications-center"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  async function markOne(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications-center"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <DashboardLayout title="مركز الإشعارات" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Bell className="h-6 w-6" /></div>}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{unread} غير مقروء من أصل {items.length}</p>
        {unread > 0 && <button onClick={markAll} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"><CheckCheck className="h-4 w-4" /> تعليم الكل كمقروء</button>}
      </div>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {items.map((n) => (
          <div key={n.id} className={`p-4 ${!n.read ? "bg-primary/5" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold">{n.title}</div>
                {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
                {n.link && <Link to={n.link} onClick={() => markOne(n.id)} className="text-xs font-bold text-primary hover:underline mt-2 inline-block">فتح ←</Link>}
                <div className="text-[10px] text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString("ar")}</div>
              </div>
              {!n.read && <button onClick={() => markOne(n.id)} className="text-xs font-bold text-primary hover:underline shrink-0">قراءة</button>}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="py-16 text-center text-muted-foreground"><BellOff className="h-8 w-8 mx-auto mb-3 opacity-50" /> لا توجد إشعارات</div>}
      </div>
    </DashboardLayout>
  );
}
