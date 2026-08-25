import { createMiddleware } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const LEGACY_BACKEND_URL = "https://oesclyulzjybnsnvbmax.supabase.co";
const LEGACY_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc2NseXVsemp5Ym5zbnZibWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTY1MzYsImV4cCI6MjEwMjI5MjUzNn0.CnlqKksSNZR3CqGmfVAldn6PT-2VXidy995ADRMzpBk";

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

function readTokenIssuer(token: string): string | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as { iss?: unknown };
    return typeof payload.iss === "string" ? payload.iss.replace(/\/auth\/v1\/?$/, "") : null;
  } catch {
    return null;
  }
}

/**
 * Analysis-specific auth transport. Some external hosts reserve or rewrite the
 * Authorization header used by server-function RPCs. Sending the access token
 * through TanStack's function context avoids that collision; the server still
 * validates it with Auth before exposing an RLS-scoped database client.
 */
export const requireAnalysisAuth = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const token = await getFreshAccessToken();
    return next({ sendContext: { analysisAccessToken: token } });
  })
  .server(async ({ next, context }) => {
    const token = typeof context.analysisAccessToken === "string" ? context.analysisAccessToken : "";
    if (token.split(".").length !== 3) throw new Error("Your session has expired. Please sign in again.");

    const issuerUrl = readTokenIssuer(token);
    const configuredUrl = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"] || "https://oesclyulzjybnsnvbmax.supabase.co";
    const configuredKey =
      process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc2NseXVsemp5Ym5zbnZibWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTY1MzYsImV4cCI6MjEwMjI5MjUzNn0.CnlqKksSNZR3CqGmfVAldn6PT-2VXidy995ADRMzpBk";
    const backendUrl = issuerUrl === LEGACY_BACKEND_URL ? LEGACY_BACKEND_URL : configuredUrl;
    const publishableKey = issuerUrl === LEGACY_BACKEND_URL ? LEGACY_PUBLISHABLE_KEY : configuredKey;

    if (!issuerUrl || issuerUrl !== backendUrl || !publishableKey) {
      throw new Error("Your session does not match this app. Please sign in again.");
    }

    const authenticatedClient = createClient<Database>(backendUrl, publishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authenticatedClient.auth.getUser(token);
    if (error || !data.user) throw new Error("Your session has expired. Please sign in again.");

    return next({
      context: {
        supabase: authenticatedClient,
        userId: data.user.id,
        claims: data.user,
      },
    });
  });