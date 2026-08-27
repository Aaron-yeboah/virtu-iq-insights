import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ScanSearch,
  History,
  Coins,
  Handshake,
  ShieldCheck,
  LogOut,
  Menu,
  WifiOff,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogoFull, LogoSymbol } from "@/components/brand/Logo";
import { profileQuery } from "@/lib/data";
import { cn } from "@/lib/utils";

const baseNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analyze", label: "New Analysis", icon: ScanSearch },
  { to: "/history", label: "History", icon: History },
  { to: "/credits", label: "Credits", icon: Coins },
  { to: "/partner", label: "Partner", icon: Handshake },
] as const;

export function AppShell({
  userId,
  isAdmin = false,
  isPartner = false,
  children,
}: {
  userId: string;
  isAdmin?: boolean;
  isPartner?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Back online — syncing latest data…");
      void queryClient.invalidateQueries();
    };
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("You are currently offline. Check your network connection.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (!navigator.onLine) setIsOffline(true);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  const { data: profile } = useQuery(profileQuery(userId));
  const partnerOnly = isPartner && !isAdmin;

  const nav = partnerOnly
    ? ([{ to: "/partner", label: "Partner Hub", icon: Handshake }] as const)
    : [
        ...baseNav.filter((item) => item.to !== "/partner"),
        ...(isAdmin ? ([{ to: "/partner", label: "Partner", icon: Handshake }] as const) : []),
        ...(isAdmin ? ([{ to: "/admin", label: "Admin", icon: ShieldCheck }] as const) : []),
      ];

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const navList = (
    <nav className="flex flex-col gap-1" aria-label="Workspace">
      {nav.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            onTouchStart={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "touch-manipulation select-none active:scale-[0.97]",
              active
                ? "bg-primary/15 text-primary border border-primary/30 font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-secondary/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card px-4 py-5 lg:flex">
        <Link to="/" aria-label="Virtu-IQ home">
          <LogoFull className="h-7 w-auto object-contain" />
        </Link>
        <div className="mt-8 flex-1">{navList}</div>
        {!partnerOnly && (
          <div className="rounded-lg border border-border bg-secondary/60 p-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Credit balance
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{profile?.credits ?? 0}</p>
            <Button asChild size="sm" className="mt-3 w-full">
              <Link to="/credits">Top up</Link>
            </Button>
          </div>
        )}
        <button
          type="button"
          onClick={signOut}
          className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <Link to="/" aria-label="Virtu-IQ home">
          <LogoSymbol className="h-8" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-foreground">
            {partnerOnly ? "Partner" : `${profile?.credits ?? 0} credits`}
          </span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-11 items-center justify-center rounded-md text-foreground hover:bg-accent touch-manipulation"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {open && (
        <>
          {/* Backdrop — pointer-events-none so it never intercepts taps on nav items */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-16 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
          />
          <div className="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-card px-4 py-4 shadow-lg lg:hidden">
            {navList}
            <button
              type="button"
              onClick={signOut}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground touch-manipulation"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </>
      )}

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
    </header>
  );
}
