import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/app/AppShell";
import { analysesQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Analysis History — Virtu-IQ" },
      { name: "description", content: "Browse every screenshot analysis and AI insight report in your Virtu-IQ workspace." },
      { property: "og:title", content: "Analysis History — Virtu-IQ" },
      { property: "og:description", content: "All of your Virtu-IQ insight reports in one place." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = Route.useRouteContext();
  const { data: analyses, isLoading } = useQuery(analysesQuery(user.id));

  return (
    <>
      <PageHeader title="Analysis history" description="Every report you've generated, newest first." />
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {isLoading && <p className="p-6 text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (analyses ?? []).length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">
            Nothing here yet.{" "}
            <Link to="/analyze" className="font-medium text-primary hover:underline">
              Run your first analysis
            </Link>
            .
          </p>
        )}
        {(analyses ?? []).map((a) => (
          <Link
            key={a.id}
            to="/analysis/$id"
            params={{ id: a.id }}
            className="flex items-start justify-between gap-4 p-4 transition-colors hover:bg-accent"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
              {a.summary && (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.summary}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(a.created_at).toLocaleString()} · {a.credits_used} credit
              </p>
            </div>
            <Badge variant={a.status === "completed" ? "default" : a.status === "failed" ? "destructive" : "secondary"}>
              {a.status}
            </Badge>
          </Link>
        ))}
      </div>
    </>
  );
}
