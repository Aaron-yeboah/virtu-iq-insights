import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldAlert, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { analysisQuery } from "@/lib/data";
import type { AnalysisResult } from "@/lib/analysis-prompt";

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({
    meta: [
      { title: "Prediction Verdict — Virtu-IQ" },
      { name: "description", content: "Virtu-IQ's confident football prediction verdict extracted from your screenshot." },
      { property: "og:title", content: "Prediction Verdict — Virtu-IQ" },
      { property: "og:description", content: "The most likely match outcomes, picked with confidence by Virtu-IQ." },
    ],
  }),
  component: AnalysisDetailPage,
});

function AnalysisDetailPage() {
  const { id } = Route.useParams();
  const { data: analysis, isLoading } = useQuery(analysisQuery(id));
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!analysis?.image_path) return;
    let active = true;
    void supabase.storage
      .from("screenshots")
      .createSignedUrl(analysis.image_path, 600)
      .then(({ data }) => {
        if (active) setImageUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [analysis?.image_path]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading verdict…</p>;
  if (!analysis) {
    return (
      <>
        <PageHeader title="Verdict not found" description="This analysis doesn't exist or was removed." />
        <Button asChild variant="outline">
          <Link to="/history">Back to history</Link>
        </Button>
      </>
    );
  }

  const result = (analysis.result ?? null) as AnalysisResult | null;
  const matches = result?.matches ?? [];
  const irrelevant = result?.relevant === false;

  return (
    <>
      <Link
        to="/history"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to history
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {analysis.title}
        </h1>
        <Badge variant={analysis.status === "completed" ? "default" : analysis.status === "failed" ? "destructive" : "secondary"}>
          {analysis.status}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {new Date(analysis.created_at).toLocaleString()}
        {typeof result?.confidence === "number"
          ? ` · ${Math.round(result.confidence * 100)}% confidence`
          : ""}
      </p>

      {irrelevant && (
        <div className="animate-verdict mt-6 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-5">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">Credit used — no prediction possible</p>
            <p className="mt-1 text-sm text-foreground">
              {analysis.error_message ?? result?.reason ?? "This screenshot is not football related."}
            </p>
          </div>
        </div>
      )}

      {!irrelevant && analysis.error_message && (
        <p className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {analysis.error_message}
        </p>
      )}

      {!irrelevant && result?.headline && (
        <div className="animate-verdict mt-6 rounded-2xl border border-border bg-gradient-to-br from-primary to-brand-deep p-6 text-primary-foreground shadow-lift">
          <p className="text-xs font-semibold tracking-widest uppercase opacity-80">Virtu-IQ verdict</p>
          <p className="mt-2 text-xl leading-snug font-bold sm:text-2xl">{result.headline}</p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {matches.map((m, i) => (
            <article
              key={i}
              className="animate-rise rounded-xl border border-border bg-card p-5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">{m.fixture}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[m.competition, m.kickoff].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {typeof m.confidence === "number" && (
                  <Badge variant="secondary">{Math.round(m.confidence * 100)}% sure</Badge>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-lg bg-primary/10 p-4">
                <Target className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-lg font-bold text-foreground">{m.pick}</p>
                  <p className="text-xs text-muted-foreground">
                    {[m.market, m.odds ? `Odds ${m.odds}` : ""].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>

              {!!m.reasons?.length && (
                <ul className="mt-4 space-y-1.5">
                  {m.reasons.map((r, ri) => (
                    <li key={ri} className="flex gap-2 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}

              {m.alternative && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Backup: <span className="font-semibold text-foreground">{m.alternative}</span>
                </p>
              )}
            </article>
          ))}

          {!!result?.avoid?.length && (
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                <AlertTriangle className="size-4" /> Skip these
              </h2>
              <ul className="space-y-1.5">
                {result.avoid.map((a, i) => (
                  <li key={i} className="text-sm text-foreground">
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Source screenshot
          </h2>
          {imageUrl ? (
            <img src={imageUrl} alt={analysis.title} className="w-full rounded-lg border border-border" />
          ) : (
            <p className="text-sm text-muted-foreground">Loading image…</p>
          )}
        </section>
      </div>
    </>
  );
}
