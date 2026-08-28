import { useState } from "react";
import { createFileRoute, Outlet, redirect, useRouterState, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/AppShell";
import { LogoSymbol } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useIsIOS } from "@/hooks/useIsIOS";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    let authUser = sessionData.session?.user;
    if (!authUser) {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData.user) throw redirect({ to: "/login" });
      authUser = userData.user;
    }

    // Parallel fetch for roles, profile, and partner_applications to minimize latency
    const [roleRes, profileRes, partnerAppRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", authUser.id),
      supabase
        .from("profiles")
        .select("registration_paid, partner_applicant")
        .eq("id", authUser.id)
        .maybeSingle(),
      supabase
        .from("partner_applications")
        .select("id, status")
        .eq("user_id", authUser.id)
        .maybeSingle(),
    ]);

    const roles = (roleRes.data ?? []).map((r) => r.role);
    const isAdmin = roles.includes("admin");
    const isPartner = roles.includes("partner");
    const profile = profileRes.data ?? null;
    const path = location.pathname;

    // If non-admin user has no profile in the DB, they were deleted by an admin. Auto-evict!
    if (!isAdmin && !profile) {
      await supabase.auth.signOut();
      throw redirect({ to: "/login" });
    }

    const isPartnerApplicant =
      profile?.partner_applicant === true ||
      authUser.user_metadata?.["partner_applicant"] === "true" ||
      authUser.user_metadata?.["partner_applicant"] === true ||
      Boolean(partnerAppRes.data?.id);

    // Invited partner applicants live entirely on the application screen
    // until an admin approves them (no registration fee for them).
    if (!isAdmin && !isPartner && isPartnerApplicant) {
      if (path !== "/partner-apply") throw redirect({ to: "/partner-apply" });
      return { user: authUser, roles, isAdmin, isPartner, registrationPaid: true };
    }
    if (isPartner && path === "/partner-apply") throw redirect({ to: "/partner" });
    if (isAdmin === false && !isPartner && !isPartnerApplicant && path === "/partner-apply") {
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

    return { user: authUser, roles, isAdmin, isPartner, registrationPaid };
  },
  component: AuthenticatedLayout,
  errorComponent: AuthenticatedError,
});

function AuthenticatedError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    void router.invalidate().then(() => {
      reset();
      setRetrying(false);
    }).catch(() => {
      window.location.reload();
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <LogoSymbol className="h-12 w-auto animate-pulse" />
      <h1 className="text-lg font-semibold text-foreground">Syncing workspace…</h1>
      <p className="max-w-md text-xs text-muted-foreground">
        Reconnecting to Virtu-IQ servers. If this takes more than a moment, click below.
      </p>
      <Button size="sm" onClick={handleRetry} disabled={retrying}>
        {retrying ? "Connecting…" : "Refresh Workspace"}
      </Button>
    </div>
  );
}

function AuthenticatedLayout() {
  const { user, isAdmin, isPartner } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIOS = useIsIOS();

  if (pathname === "/registration" || pathname === "/partner-apply") {
    return (
      <div className={cn("min-h-screen bg-secondary/30 px-3 py-6 sm:px-6 sm:py-12", isIOS && "ios-page-enter")}>
        <Outlet />
      </div>
    );
  }

  return (
    <div className={isIOS ? "ios-page-enter" : undefined}>
      <AppShell userId={user.id} isAdmin={isAdmin} isPartner={isPartner}>
        <Outlet />
      </AppShell>
    </div>
  );
}
