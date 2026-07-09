import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function useRole() {
  const { user, loading } = useAuth();
  const { data } = useQuery(queryOptions({
    queryKey: ["my-role-only", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: rows } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const roles = (rows ?? []).map((r: any) => r.role as string);
      return roles;
    },
    enabled: !!user,
  }));
  const roles = data ?? [];
  const isSuperAdmin = roles.includes("super_admin");
  const isAdmin = isSuperAdmin || roles.includes("admin");
  const isManager = isAdmin || roles.includes("manager");
  return { roles, isAdmin, isSuperAdmin, isManager, loading: loading || !data };
}
