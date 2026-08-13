import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { analysisQuery } from "@/lib/data";
import type { AnalysisResult } from "@/lib/analysis-prompt";

export const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({
    meta: [
      { title: "Insight Report — Virtu-IQ" },
      { name: "description", content: "A structured Virtu-IQ AI insight report generated from your screenshot." },
      { property: "og:title", content: "Insight Report — Virtu-IQ" },
      { property: "og:description", content: "Key findings, data points and recommendations extracted from your screenshot." },
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

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading report…</p>;
  if (!analysis) {
    return (
      <>
        <PageHeader title="Report not found" description="This analysis doesn't exist or was removed." />
        <Button asChild variant="outline">
          <Link to="/history">Back to history</Link>
        </Button>
      </>
    );
  }

  const result = (analysis.result ?? null) as AnalysisResult | null;

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
        {result?.category ? ` · ${result.category}` : ""}
        {typeof result?.confidence === "number"
          ? ` · ${Math.round(result.confidence * 100)}% confidence`
          : ""}
      </p>

      {analysis.error_message && (
        <p className="mt-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {analysis.error_message}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {analysis.summary && (
            <Section title="Summary">
              <p className="text-sm leading-relaxed text-foreground">{analysis.summary}</p>
            </Section>
          )}
          {!!result?.key_findings?.length && (
            <Section title="Key findings">
              <ul className="space-y-2">
                {result.key_findings.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {!!result?.data_points?.length && (
            <Section title="Data points">
              <dl className="grid gap-3 sm:grid-cols-2">
                {result.data_points.map((d, i) => (
                  <div key={i} className="rounded-lg border border-border bg-secondary/40 p-3">
                    <dt className="text-xs text-muted-foreground">{d.label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}
          {!!result?.recommendations?.length && (
            <Section title="Recommendations">
              <ol className="space-y-2">
                {result.recommendations.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground">
                    <span className="font-semibold text-primary">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ol>
            </Section>
          )}
          {result?.extracted_text && (
            <Section title="Extracted text">
              <pre className="overflow-x-auto rounded-lg bg-secondary/60 p-4 text-xs whitespace-pre-wrap text-foreground">
                {result.extracted_text}
              </pre>
            </Section>
          )}
        </div>

        <Section title="Source screenshot">
          {imageUrl ? (
            <img src={imageUrl} alt={analysis.title} className="w-full rounded-lg border border-border" />
          ) : (
            <p className="text-sm text-muted-foreground">Loading image…</p>
          )}
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}
