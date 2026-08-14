import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client-side bearer attacher that guarantees a *fresh* access token.
 * The generated attacher sends whatever getSession() has cached, which can be an
 * already-expired JWT after the tab has been idle — the server then rejects the
 * call with "Unauthorized: Invalid token". Here we refresh first when needed.
 */
export async function getFreshAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;

  const expiresAt = (session.expires_at ?? 0) * 1000;
  const isStale = !expiresAt || expiresAt - Date.now() < 60_000;
  if (!isStale) return session.access_token;

  const { data: refreshed } = await supabase.auth.refreshSession();
  return refreshed.session?.access_token ?? session.access_token;
}

export const attachFreshSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token = await getFreshAccessToken();
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);