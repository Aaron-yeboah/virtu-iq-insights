import { createFileRoute, Outlet, redirect, useRouterState, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";

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

    let profile: { registration_paid: boolean; partner_applicant: boolean } | null = null;
    if (!isAdmin) {
      const { data: p } = await supabase
        .from("profiles")
        .select("registration_paid, partner_applicant")
        .eq("id", data.user.id)
        .maybeSingle();
      profile = p ?? null;
    }

    // Invited partner applicants live entirely on the application screen
    // until an admin approves them (no registration fee for them).
    if (!isAdmin && !isPartner && profile?.partner_applicant) {
      if (path !== "/partner-apply") throw redirect({ to: "/partner-apply" });
      return { user: data.user, roles, isAdmin, isPartner, registrationPaid: true };
    }
    if (isPartner && path === "/partner-apply") throw redirect({ to: "/partner" });
    if (isAdmin === false && !isPartner && path === "/partner-apply") {
      throw redirect({ to: "/dashboard" });
    }

    if (!isAdmin) {
      if (isPartner && !path.startsWith("/partner")) throw redirect({ to: "/partner" });
      if (!isPartner && path.startsWith("/partner")) throw redirect({ to: "/dashboard" });
      if (path.startsWith("/admin")) throw redirect({ to: isPartner ? "/partner" : "/dashboard" });
    }

    let registrationPaid = true;
    if (!isAdmin && !isPartner) {
      registrationPaid = profile?.registration_paid ?? false;
      if (!registrationPaid && path !== "/registration") throw redirect({ to: "/registration" });
    }
    if (registrationPaid && path === "/registration") throw redirect({ to: "/credits" });

    return { user: data.user, roles, isAdmin, isPartner, registrationPaid };
  },
  component: AuthenticatedLayout,
  errorComponent: AuthenticatedError,
});

function AuthenticatedError({ error }: { error: Error }) {
  const router = useRouter();
  console.error(error);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {error?.message || "We could not load this page. Please try again."}
      </p>
      <Button onClick={() => void router.invalidate()}>Try again</Button>
    </div>
  );
}

function AuthenticatedLayout() {
  const { user, isAdmin, isPartner } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/registration" || pathname === "/partner-apply") {
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
