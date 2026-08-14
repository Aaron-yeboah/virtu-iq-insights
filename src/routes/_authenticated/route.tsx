import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
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

    let registrationPaid = true;
    if (!isAdmin && !isPartner) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("registration_paid")
        .eq("id", data.user.id)
        .maybeSingle();
      registrationPaid = profile?.registration_paid ?? false;
      if (!registrationPaid && path !== "/registration") throw redirect({ to: "/registration" });
    }
    if (registrationPaid && path === "/registration") throw redirect({ to: "/credits" });

    return { user: data.user, roles, isAdmin, isPartner, registrationPaid };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, isAdmin, isPartner } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/registration") {
    return (
      <div className="min-h-screen bg-secondary/30 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </div>
    );
  }

  return (
    <AppShell userId={user.id} isAdmin={isAdmin} isPartner={isPartner}>
      <Outlet />
    </AppShell>
  );
}
