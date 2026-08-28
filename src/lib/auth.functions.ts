import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Resolves the account email for a phone number so members can log in with
 * either identifier. Returns null when no account matches.
 */
export const resolveLoginEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ phone: z.string().min(6).max(24) }).parse(data))
  .handler(async ({ data }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length < 8) return { email: null as string | null };

    // Try RPC function first
    try {
      const { data: emailRpc, error } = await supabase.rpc("resolve_phone_email" as never, {
        p_phone: data.phone,
      } as never);
      const resolvedStr = emailRpc as unknown as string | null;
      if (!error && resolvedStr && typeof resolvedStr === "string" && resolvedStr.length > 0) {
        return { email: resolvedStr };
      }
    } catch {
      // Fall through to admin query below
    }

    // Fallback: Admin client query if environment variable is available
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const tail9 = digits.slice(-9);
      const tail10 = digits.slice(-10);
      const { data: rows } = await supabaseAdmin
        .from("profiles")
        .select("email, phone")
        .not("phone", "is", null)
        .limit(2000);
      const match = (rows ?? []).find((r) => {
        const rDigits = (r.phone ?? "").replace(/\D/g, "");
        return rDigits.endsWith(tail9) || rDigits.endsWith(tail10) || rDigits === digits;
      });
      if (match?.email) return { email: match.email };
    } catch {
      // Admin client not configured
    }

    return { email: null as string | null };
  });