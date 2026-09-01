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

    try {
      const { data: isDefaultAdmin } = await supabase.rpc("is_default_admin" as never, {
        _user_id: data.userId,
      } as never);
      if (isDefaultAdmin) throw new Error("CANNOT_REMOVE_DEFAULT_ADMIN");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "CANNOT_REMOVE_DEFAULT_ADMIN") {
        throw err;
      }
      // If RPC is not available, proceed safely
    }

    // Primary: Database RPC (executes securely with DB admin privileges)
    const { data: rpcResult, error: rpcError } = await supabase.rpc("admin_delete_member" as never, {
      _user_id: data.userId,
    } as never);
    if (!rpcError && rpcResult) {
      return { ok: true as const };
    }

    if (rpcError && rpcError.message && (
      rpcError.message.includes("FORBIDDEN") ||
      rpcError.message.includes("CANNOT_REMOVE_DEFAULT_ADMIN") ||
      rpcError.message.includes("CANNOT_REMOVE_SELF")
    )) {
      throw new Error(rpcError.message);
    }

    // Fallback: Admin client if SUPABASE_SERVICE_ROLE_KEY is configured
    try {
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
    } catch (fallbackError) {
      if (rpcError) throw new Error(rpcError.message);
      throw fallbackError;
    }
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
    const { data: rpcResult, error: rpcError } = await supabase.rpc("explode_platform_data" as never);
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

export const adjustMemberSpent = createServerFn({ method: "POST" })
  .middleware([requireAnalysisAuth])
  .inputValidator((data) =>
    z
      .object({
        userId: z.string().uuid(),
        reduceBy: z.number().optional(),
        setTotalSpent: z.number().optional(),
        reason: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("FORBIDDEN");

    // Primary: RPC execution
    const { data: result, error: rpcError } = await supabase.rpc(
      "admin_adjust_member_spent" as never,
      {
        _user_id: data.userId,
        _reduce_by: data.reduceBy ?? null,
        _set_total_spent: data.setTotalSpent ?? null,
        _reason: data.reason ?? null,
      } as never
    );

    if (!rpcError && result !== null && result !== undefined) {
      return { ok: true, finalSpent: Number(result) };
    }

    // Fallback: Write adjustment directly to payments table using service role client if configured
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const { data: payments, error: payError } = await supabaseAdmin
        .from("payments")
        .select("amount_ghs")
        .eq("user_id", data.userId)
        .eq("status", "approved");

      if (payError) throw new Error(payError.message);

      const approvedSum = (payments ?? []).reduce((acc, p) => acc + Number(p.amount_ghs || 0), 0);

      let adjustmentDelta = 0;
      if (data.reduceBy !== undefined && data.reduceBy > 0) {
        adjustmentDelta = -Math.abs(data.reduceBy);
      } else if (data.setTotalSpent !== undefined) {
        adjustmentDelta = data.setTotalSpent - approvedSum;
      }

      if (adjustmentDelta === 0) {
        return { ok: true, finalSpent: approvedSum };
      }

      const refCode = `ADJ-${Date.now().toString(36).toUpperCase()}`;
      const { error: insertError } = await supabaseAdmin.from("payments").insert({
        user_id: data.userId,
        amount_ghs: adjustmentDelta,
        credits: 0,
        method: "Admin Adjustment",
        reference: refCode,
        status: "approved",
        admin_note: data.reason?.trim() || "Admin total spent reduction/adjustment",
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      });

      if (insertError) throw new Error(insertError.message);

      const newFinalSpent = Math.max(0, approvedSum + adjustmentDelta);

      await supabaseAdmin.from("audit_logs").insert({
        actor_id: userId,
        action: "member.spent_adjusted",
        entity: "profiles",
        entity_id: data.userId,
        meta: {
          previousSpent: approvedSum,
          adjustmentDelta,
          finalSpent: newFinalSpent,
          reason: data.reason,
        },
      });

      return { ok: true, finalSpent: newFinalSpent };
    } catch (fallbackError) {
      if (rpcError) throw new Error(rpcError.message);
      throw fallbackError;
    }
  });

