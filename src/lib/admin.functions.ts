import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently removes a member account (auth user + all cascading data).
 * The person must register again, sign in and pay the registration fee to
 * regain access once an admin approves it.
 */
export const deleteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("FORBIDDEN");
    if (data.userId === userId) throw new Error("CANNOT_REMOVE_SELF");

    const { data: isDefaultAdmin } = await supabase.rpc("is_default_admin", {
      _user_id: data.userId,
    });
    if (isDefaultAdmin) throw new Error("CANNOT_REMOVE_DEFAULT_ADMIN");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", data.userId)
      .maybeSingle();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId,
      action: "member.removed",
      entity: "profiles",
      entity_id: data.userId,
      meta: { email: profile?.email ?? null },
    });

    return { ok: true as const };
  });
