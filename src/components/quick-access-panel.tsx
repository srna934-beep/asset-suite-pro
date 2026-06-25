import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, X, GripVertical } from "lucide-react";
import {
  Building2, Car, Map, Wallet, Wrench, UserCog, FolderOpen,
  BarChart3, Bell, Settings, Home, Users, FileText, DollarSign,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const ICONS: Record<string, any> = {
  Building2, Car, Map, Wallet, Wrench, UserCog, FolderOpen,
  BarChart3, Bell, Settings, Home, Users, FileText, DollarSign,
};

const PRESETS = [
  { module_key: "properties", label: "العقارات", icon: "Building2", link: "/properties" },
  { module_key: "units", label: "الوحدات", icon: "Home", link: "/units" },
  { module_key: "vehicles", label: "المركبات", icon: "Car", link: "/vehicles" },
  { module_key: "lands", label: "الأراضي", icon: "Map", link: "/lands" },
  { module_key: "tenants", label: "المستأجرين", icon: "Users", link: "/tenants" },
  { module_key: "contracts", label: "العقود", icon: "FileText", link: "/contracts" },
  { module_key: "payments", label: "الدفعات", icon: "DollarSign", link: "/payments" },
  { module_key: "maintenance", label: "الصيانة", icon: "Wrench", link: "/maintenance" },
  { module_key: "employees", label: "الموظفين", icon: "UserCog", link: "/employees" },
  { module_key: "transactions", label: "المالية", icon: "Wallet", link: "/transactions" },
  { module_key: "documents", label: "الوثائق", icon: "FolderOpen", link: "/documents" },
  { module_key: "reports", label: "التقارير", icon: "BarChart3", link: "/reports" },
  { module_key: "notifications-center", label: "التنبيهات", icon: "Bell", link: "/notifications-center" },
  { module_key: "settings", label: "الإعدادات", icon: "Settings", link: "/settings" },
  { module_key: "properties-dashboard", label: "لوحة العقارات", icon: "Building2", link: "/properties-dashboard" },
  { module_key: "vehicles-dashboard", label: "لوحة المركبات", icon: "Car", link: "/vehicles-dashboard" },
  { module_key: "lands-dashboard", label: "لوحة الأراضي", icon: "Map", link: "/lands-dashboard" },
  { module_key: "finance-dashboard", label: "لوحة المالية", icon: "Wallet", link: "/finance-dashboard" },
];

export function QuickAccessPanel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useQuery(queryOptions({
    queryKey: ["quick-access", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as any).from("quick_access_items")
        .select("*").eq("user_id", user.id).order("display_order");
      return (data ?? []) as any[];
    },
    enabled: !!user,
  }));

  async function addItem(p: typeof PRESETS[number]) {
    if (!user) return;
    const order = items.length;
    const { error } = await (supabase as any).from("quick_access_items").insert({
      user_id: user.id, module_key: p.module_key, label: p.label, icon: p.icon, link: p.link, display_order: order,
    });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["quick-access"] });
    toast.success("تم الإضافة");
  }
  async function removeItem(id: string) {
    const { error } = await (supabase as any).from("quick_access_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["quick-access"] });
  }

  const existingKeys = new Set(items.map((i) => i.module_key));
  const available = PRESETS.filter((p) => !existingKeys.has(p.module_key));

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold">الوصول السريع</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-4 w-4 ml-1" />إضافة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>إضافة اختصار</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {available.map((p) => {
                const Icon = ICONS[p.icon] ?? Building2;
                return (
                  <button key={p.module_key} onClick={() => { addItem(p); }}
                    className="flex items-center gap-2 rounded-lg border border-border p-3 text-right text-sm hover:bg-muted">
                    <Icon className="h-4 w-4 text-primary" />{p.label}
                  </button>
                );
              })}
              {available.length === 0 && <div className="col-span-full py-6 text-center text-sm text-muted-foreground">تم إضافة جميع الاختصارات</div>}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">لا توجد اختصارات. اضغط "إضافة" لتخصيص لوحتك.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((i) => {
            const Icon = ICONS[i.icon] ?? Building2;
            return (
              <div key={i.id} className="group relative">
                <Link to={i.link} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-3 transition hover:border-primary hover:bg-muted">
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium">{i.label}</span>
                </Link>
                <button onClick={() => removeItem(i.id)}
                  className="absolute -top-2 -left-2 hidden h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow group-hover:flex" title="حذف">
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
