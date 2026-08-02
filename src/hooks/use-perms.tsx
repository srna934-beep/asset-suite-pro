import { useQuery, queryOptions } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import {
  ROLE_DEFAULTS,
  SUPER_ADMIN_ONLY,
  moduleForPath,
  permKey,
  type PermAction,
} from "@/lib/permissions";

type PermRow = { module_key: string; visible: boolean };

export function usePerms() {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery(
    queryOptions({
      queryKey: ["my-perms", user?.id],
      queryFn: async () => {
        if (!user) return { roles: [] as string[], rows: [] as PermRow[] };
        const [{ data: r }, { data: v }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", user.id),
          (supabase as any)
            .from("user_module_visibility")
            .select("module_key, visible")
            .eq("user_id", user.id),
        ]);
        return {
          roles: (r ?? []).map((x: any) => String(x.role)),
          rows: ((v ?? []) as PermRow[]),
        };
      },
      enabled: !!user,
      staleTime: 30_000,
    }),
  );

  const roles = data?.roles ?? [];
  const rows = data?.rows ?? [];
  const isSuperAdmin = roles.includes("super_admin");
  const isAdmin = isSuperAdmin || roles.includes("admin");
  const role = isSuperAdmin
    ? "super_admin"
    : roles.includes("admin")
      ? "admin"
      : (roles[0] ?? "user");
  const loading = authLoading || (!!user && isLoading);

  function override(moduleKey: string, action: PermAction): boolean | null {
    const row = rows.find((x) => x.module_key === permKey(moduleKey, action));
    return row ? row.visible : null;
  }

  function can(moduleKey: string | null, action: PermAction = "view"): boolean {
    if (!moduleKey) return true; // مسار غير محكوم بالصلاحيات
    if (isSuperAdmin) return true;
    if (SUPER_ADMIN_ONLY.includes(moduleKey)) return false;
    const ov = override(moduleKey, action);
    if (ov !== null) return ov;
    const def = ROLE_DEFAULTS[role] ?? ROLE_DEFAULTS.user;
    if (action === "view") return def.view;
    // لا يمكن تنفيذ أي إجراء على وحدة غير مسموح بعرضها
    if (!can(moduleKey, "view")) return false;
    return def.actions.includes(action);
  }

  function canPath(pathname: string, action: PermAction = "view") {
    return can(moduleForPath(pathname), action);
  }

  return { roles, role, isAdmin, isSuperAdmin, loading, can, canPath };
}

/** صلاحيات الوحدة المطابقة للمسار الحالي — تُستخدم داخل الأزرار المشتركة. */
export function useCurrentPerms() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const p = usePerms();
  const moduleKey = moduleForPath(pathname);
  return {
    ...p,
    moduleKey,
    allow: (action: PermAction) => p.can(moduleKey, action),
  };
}
