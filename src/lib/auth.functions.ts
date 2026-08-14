import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Resolves the account email for a phone number so members can log in with
 * either identifier. Returns null when no account matches.
 */
export const resolveLoginEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ phone: z.string().min(6).max(24) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length < 9) return { email: null as string | null };
    const tail = digits.slice(-9);
    const { data: rows } = await supabaseAdmin
      .from("profiles")
      .select("email, phone")
      .not("phone", "is", null)
      .limit(1000);
    const match = (rows ?? []).find(
      (r) => (r.phone ?? "").replace(/\D/g, "").slice(-9) === tail,
    );
    return { email: (match?.email ?? null) as string | null };
  });