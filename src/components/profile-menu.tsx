import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { LogOut, User as UserIcon, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ProfileMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useQuery(queryOptions({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  }));

  const name = profile?.full_name || user?.email || "مستخدم";
  const initials = name.split(" ").map((s: string) => s.charAt(0)).slice(0, 2).join("");

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 hover:bg-accent">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">{initials}</div>
          <div className="hidden text-right leading-tight md:block">
            <div className="text-xs font-bold truncate max-w-[100px]">{name}</div>
            <div className="text-[10px] text-muted-foreground">{user?.email}</div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="text-right">
          <div className="font-bold">{name}</div>
          <div className="text-[10px] font-normal text-muted-foreground">{user?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/profile" className="cursor-pointer flex-row-reverse"><UserIcon className="h-4 w-4" /> الملف الشخصي</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/settings" className="cursor-pointer flex-row-reverse"><Settings className="h-4 w-4" /> الإعدادات</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer flex-row-reverse text-rose-600 focus:text-rose-700">
          <LogOut className="h-4 w-4" /> تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
