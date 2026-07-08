import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EMAIL_DOMAIN = "internal.local";

async function assertAdmin(ctx: any) {
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  const { data: isSuper } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "super_admin" });
  if (!isAdmin && !isSuper) throw new Error("Forbidden: admin only");
}

function userEmail(username: string) {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profs }, { data: roles }, { data: vis }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, username, status, phone, created_at"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("user_module_visibility").select("*"),
    ]);
    return { profiles: profs ?? [], roles: roles ?? [], visibility: vis ?? [] };
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { username: string; password: string; full_name?: string; role?: string; approve?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.username || !data.password) throw new Error("username & password required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail(data.username),
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username, full_name: data.full_name ?? data.username },
    });
    if (error) throw new Error(error.message);
    const uid = created.user!.id;
    // Ensure profile fields (trigger already inserted)
    await supabaseAdmin.from("profiles").update({
      full_name: data.full_name ?? data.username,
      username: data.username,
      status: data.approve !== false ? "approved" : "pending",
    }).eq("id", uid);
    // Ensure role
    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
      await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role as any });
    }
    return { id: uid };
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; full_name?: string; username?: string; password?: string; role?: string; status?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const authPatch: any = {};
    if (data.password) authPatch.password = data.password;
    if (data.username) authPatch.email = userEmail(data.username);
    if (Object.keys(authPatch).length) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, authPatch);
      if (error) throw new Error(error.message);
    }
    const profPatch: any = {};
    if (data.full_name !== undefined) profPatch.full_name = data.full_name;
    if (data.username !== undefined) profPatch.username = data.username;
    if (data.status !== undefined) profPatch.status = data.status;
    if (Object.keys(profPatch).length) {
      await supabaseAdmin.from("profiles").update(profPatch).eq("id", data.user_id);
    }
    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
      await supabaseAdmin.from("user_roles").insert({ user_id: data.user_id, role: data.role as any });
    }
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) throw new Error("لا يمكنك حذف حسابك");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; module_key: string; visible: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_module_visibility")
      .upsert({ user_id: data.user_id, module_key: data.module_key, visible: data.visible }, { onConflict: "user_id,module_key" });
    return { ok: true };
  });

export const resolveUsernameEmail = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string }) => d)
  .handler(async ({ data }) => {
    // Public helper for login: username → email. Only returns the synthetic email; no PII beyond username.
    return { email: userEmail(data.username) };
  });
