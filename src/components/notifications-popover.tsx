import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, CheckCheck, BellOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";

const notifQuery = queryOptions({
  queryKey: ["notifications"],
  queryFn: async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
    return data ?? [];
  },
});

export function NotificationsPopover() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery(notifQuery);

  useEffect(() => {
    supabase.rpc("generate_alert_notifications").then(() => qc.invalidateQueries({ queryKey: ["notifications"] }));
  }, [qc]);

  const unread = items.filter((n: any) => !n.read).length;

  async function markAll() {
    await supabase.from("notifications").update({ read: true }).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  async function markOne(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card hover:bg-accent" aria-label="الإشعارات">
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" dir="rtl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-sm font-extrabold">الإشعارات ({unread} غير مقروء)</div>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
              <CheckCheck className="h-3.5 w-3.5" /> تعيين الكل كمقروء
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && (
            <div className="grid place-items-center p-8 text-center text-sm text-muted-foreground">
              <BellOff className="h-6 w-6 mb-2 opacity-50" />
              لا توجد إشعارات
            </div>
          )}
          {items.map((n: any) => (
            <div key={n.id} className={`border-b border-border px-4 py-3 ${!n.read ? "bg-primary/5" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                  {n.link && <Link to={n.link} onClick={() => markOne(n.id)} className="text-xs text-primary hover:underline mt-1 inline-block">عرض ←</Link>}
                </div>
                {!n.read && (
                  <button onClick={() => markOne(n.id)} className="text-[10px] font-bold text-primary hover:underline shrink-0">قراءة</button>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("ar")}</div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
