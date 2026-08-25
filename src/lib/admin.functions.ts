import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAnalysisAuth } from "@/lib/auth-bearer";

/**
 * Permanently removes a member account (auth user + all cascading data).
 * The person must register again, sign in and pay the registration fee to
 * regain access once an admin approves it.
 */
export const deleteMember = createServerFn({ method: "POST" })
  .middleware([requireAnalysisAuth])
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

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/**
 * Clears all platform activity (payments, analyses, credit history, commissions,
 * applications, audit logs) and resets balances. Accounts, roles, packages and
 * payment settings are kept. Every delete carries an explicit filter.
 */
export const explodePlatformData = createServerFn({ method: "POST" })
  .middleware([requireAnalysisAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("FORBIDDEN");

    // Primary method: Database RPC (executes securely with DB admin privileges without service role key)
    const { data: rpcResult, error: rpcError } = await supabase.rpc("explode_platform_data");
    if (!rpcError && rpcResult) {
      return rpcResult as { analyses: number; payments: number; commissions: number; applications: number };
    }

    // Fallback: Admin client if SUPABASE_SERVICE_ROLE_KEY is configured
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const counts = {
        analyses: 0,
        payments: 0,
        commissions: 0,
        applications: 0,
      };
      for (const [key, table] of [
        ["commissions", "partner_commissions"],
        ["applications", "partner_applications"],
        ["analyses", "analyses"],
        ["payments", "payments"],
      ] as const) {
        const { count } = await supabaseAdmin
          .from(table)
          .select("id", { count: "exact", head: true });
        counts[key] = count ?? 0;
      }

      for (const table of [
        "partner_commissions",
        "credit_transactions",
        "analyses",
        "payments",
        "partner_applications",
        "audit_logs",
      ] as const) {
        const { error } = await supabaseAdmin.from(table).delete().neq("id", ZERO_UUID);
        if (error) throw new Error(`${table}: ${error.message}`);
      }

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          credits: 0,
          registration_paid: false,
          registration_paid_at: null,
          payout_cleared_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .neq("id", ZERO_UUID);
      if (profileError) throw new Error(profileError.message);

      await supabaseAdmin.from("audit_logs").insert({
        actor_id: userId,
        action: "platform.exploded",
        entity: "platform",
        meta: counts,
      });

      return counts;
    } catch (fallbackError) {
      if (rpcError) throw new Error(rpcError.message);
      throw fallbackError;
    }
  });
