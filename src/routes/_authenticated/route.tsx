import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const roles = (roleRows ?? []).map((r) => r.role);
    const isAdmin = roles.includes("admin");
    const isPartner = roles.includes("partner");
    const path = location.pathname;

    if (!isAdmin) {
      if (isPartner && !path.startsWith("/partner")) throw redirect({ to: "/partner" });
      if (!isPartner && path.startsWith("/partner")) throw redirect({ to: "/dashboard" });
    }

    return { user: data.user, roles, isAdmin, isPartner };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, isAdmin, isPartner } = Route.useRouteContext();
  return (
    <AppShell userId={user.id} isAdmin={isAdmin} isPartner={isPartner}>
      <Outlet />
    </AppShell>
  );
}
