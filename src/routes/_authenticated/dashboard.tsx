import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Coins, ScanSearch, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/AppShell";
import { analysesQuery, profileQuery, referralsQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Virtu-IQ" },
      { name: "description", content: "Your Virtu-IQ workspace: credit balance, recent screenshot analyses and insight reports." },
      { property: "og:title", content: "Dashboard — Virtu-IQ" },
      { property: "og:description", content: "Track credits and AI insight reports in your Virtu-IQ workspace." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useQuery(profileQuery(user.id));
  const { data: analyses } = useQuery(analysesQuery(user.id));
  const { data: referrals } = useQuery(referralsQuery(user.id));

  const completed = (analyses ?? []).filter((a) => a.status === "completed").length;
  const recent = (analyses ?? []).slice(0, 5);

  const stats = [
    { label: "Credits available", value: profile?.credits ?? 0, icon: Coins },
    { label: "Analyses run", value: analyses?.length ?? 0, icon: ScanSearch },
    { label: "Reports completed", value: completed, icon: Sparkles },
    { label: "Members referred", value: referrals ?? 0, icon: Users },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description="Upload a screenshot and Virtu-IQ turns it into a structured insight report."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-gradient-to-br from-primary to-[var(--color-primary-deep,var(--color-primary))] p-6 text-primary-foreground sm:p-8">
        <h2 className="text-xl font-bold">Ready for your next insight?</h2>
        <p className="mt-2 max-w-lg text-sm opacity-90">
          Each analysis costs 1 credit. Upload any screenshot — dashboards, statements, reports or
          chat threads — and get a structured breakdown in seconds.
        </p>
        <Button asChild variant="secondary" className="mt-5">
          <Link to="/analyze">Start an analysis</Link>
        </Button>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent analyses</h2>
          <Link to="/history" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {recent.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">
              No analyses yet. Your reports will appear here.
            </p>
          )}
          {recent.map((a) => (
            <Link
              key={a.id}
              to="/analysis/$id"
              params={{ id: a.id }}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-accent"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
              <Badge variant={a.status === "completed" ? "default" : a.status === "failed" ? "destructive" : "secondary"}>
                {a.status}
              </Badge>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
