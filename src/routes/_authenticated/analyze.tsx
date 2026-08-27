import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Coins, ImageUp, ScanSearch, Sparkles, Target, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { runAnalysis } from "@/lib/analysis.functions";
import { getFreshAccessToken } from "@/lib/auth-bearer";
import { profileQuery, verdictLimitQuery } from "@/lib/data";
import { usePaymentRealtime } from "@/hooks/usePaymentRealtime";
import { compressImage } from "@/lib/image-compress";
import { LogoSymbol } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze Screenshot — Virtu-IQ" },
      { name: "description", content: "Upload an instant/virtual football screenshot and Virtu-IQ picks the most likely outcomes your plan allows." },
      { property: "og:title", content: "Analyze Screenshot — Virtu-IQ" },
      { property: "og:description", content: "Virtu-IQ reads your instant virtual football screenshot and delivers a decisive verdict." },
    ],
  }),
  component: AnalyzePage,
});

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const MAX_BYTES = 8 * 1024 * 1024;

const STAGES = [
  { label: "Reading the screenshot", icon: ScanSearch },
  { label: "Matching fixtures & form", icon: Trophy },
  { label: "Weighing the markets", icon: Sparkles },
  { label: "Locking the verdict", icon: Target },
];

function AnalyzePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const analyze = useServerFn(runAnalysis);
  usePaymentRealtime(user.id);
  const { data: profile } = useQuery(profileQuery(user.id));
  const { data: verdictLimit } = useQuery(verdictLimitQuery(user.id));

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState(0);

  const mutation = useMutation({
    mutationFn: async () => {
      if ((profile?.credits ?? 0) < 1) throw new Error("INSUFFICIENT_CREDITS");
      if (!file) throw new Error("Select a football screenshot first.");
      if (!file.type.startsWith("image/")) throw new Error("Only image files are supported.");
      if (file.size > MAX_BYTES) throw new Error("Images must be smaller than 8MB.");

      const processedFile = await compressImage(file);
      const ext = processedFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
      const path = `${user.id}/${generateUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("screenshots")
        .upload(path, processedFile, { contentType: processedFile.type });
      if (uploadError) throw new Error(uploadError.message);

      const { data: created, error: insertError } = await supabase
        .from("analyses")
        .insert({
          user_id: user.id,
          image_path: path,
          title: file.name.slice(0, 80),
        })
        .select("id")
        .single();
      if (insertError) throw new Error(insertError.message);

      const toError = (e: unknown) =>
        e instanceof Error ? e : new Error(typeof e === "string" && e ? e : "Analysis failed. Please try again.");
      const run = async () => analyze({ data: { analysisId: created.id } });
      let result;
      try {
        result = await run();
      } catch (err) {
        const normalized = toError(err);
        if (!/unauthor|invalid token|401/i.test(normalized.message)) throw normalized;
        // Session token was stale — refresh and try once more.
        try {
          await getFreshAccessToken();
          result = await run();
        } catch (retryErr) {
          throw toError(retryErr);
        }
      }
      return { id: created.id, irrelevant: Boolean(result?.irrelevant) };
    },
    onSuccess: async ({ id, irrelevant }) => {
      await queryClient.invalidateQueries();
      if (irrelevant) {
        toast.error("Not a football screenshot — 1 credit was used.");
      } else {
        toast.success("Verdict ready");
      }
      navigate({ to: "/analysis/$id", params: { id } });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      void queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.error(
        message.includes("INSUFFICIENT_CREDITS")
          ? "You're out of credits. Top up to keep predicting."
          : message,
      );
    },
  });

  useEffect(() => {
    if (!mutation.isPending) {
      setStage(0);
      return;
    }
    const timer = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 1400);
    return () => clearInterval(timer);
  }, [mutation.isPending]);

  const busy = mutation.isPending;
  const credits = profile?.credits ?? 0;
  const noCredits = credits < 1;
  const locked = busy || noCredits;

  return (
    <>
      <PageHeader
        title="Analyze Screenshot"
        description="Drop in an instant/virtual football screenshot. We pick the outcomes — you place them."
      />

      <form
        className="grid max-w-3xl gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <LogoSymbol
            className="pointer-events-none absolute -right-6 -bottom-6 h-40 w-auto opacity-[0.05]"
            aria-hidden
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-0 opacity-[0.06]",
              busy && "animate-grid-drift",
            )}
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--color-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            aria-hidden
          />

          <label
            htmlFor="screenshot"
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed border-border bg-secondary/40 px-4 py-10 text-center transition-colors hover:border-primary",
              busy && "cursor-wait border-primary",
              noCredits && "pointer-events-none cursor-not-allowed opacity-60 hover:border-border",
            )}
            aria-disabled={noCredits}
          >
            {preview ? (
              <img src={preview} alt="Selected football screenshot" className="max-h-72 rounded-lg" />
            ) : (
              <>
                <span className="relative inline-flex size-14 items-center justify-center rounded-full bg-primary/10">
                  <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" aria-hidden />
                  <ImageUp className="relative size-6 text-primary" />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {noCredits ? "Top up to upload a screenshot" : "Tap to upload your football screenshot"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Instant/virtual fixtures, odds or slips · PNG/JPG up to 8MB
                </span>
              </>
            )}

            {busy && (
              <>
                <span
                  className="animate-scan pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-transparent via-primary/40 to-transparent"
                  aria-hidden
                />
                <span className="pointer-events-none absolute inset-0 bg-background/55 backdrop-blur-[1px]" aria-hidden />
              </>
            )}

            {busy && (
              <div className="animate-verdict absolute inset-0 flex flex-col items-center justify-center gap-3">
                <span className="relative inline-flex size-16 items-center justify-center rounded-full bg-primary/15">
                  <span className="absolute inset-0 rounded-full bg-primary/25 animate-pulse-ring" aria-hidden />
                  <ScanSearch className="relative size-7 text-primary" />
                </span>
                <p className="text-sm font-semibold text-foreground">{STAGES[stage]!.label}…</p>
                <div className="flex gap-1.5">
                  {STAGES.map((s, i) => (
                    <span
                      key={s.label}
                      className={cn(
                        "h-1.5 w-8 rounded-full transition-colors",
                        i <= stage ? "bg-primary" : "bg-border",
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </label>

          <Input
            id="screenshot"
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={locked}
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              setPreview(selected ? URL.createObjectURL(selected) : null);
            }}
          />

          <div className="relative mt-5 grid gap-2 sm:grid-cols-3">
            {STAGES.slice(0, 3).map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2">
                <s.icon className="size-4 shrink-0 text-primary" />
                <span className="text-xs font-medium text-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Coins className="size-4 text-primary" />
            1 credit per scan · {verdictLimit ?? 1} verdict{(verdictLimit ?? 1) === 1 ? "" : "s"} on your plan ·{" "}
            {profile?.credits ?? 0} credits available
          </p>
          <Button type="submit" size="lg" disabled={!file || locked} className="sm:min-w-56">
            {busy ? "Virtu-IQ is deciding…" : noCredits ? "No credits left" : "Get my verdict"}
          </Button>
        </div>

        {noCredits && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">
              You have 0 credits — top up to unlock scanning.
            </p>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/credits" })}>
              Top up credits
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Virtu-IQ predicts instant/virtual football only. Real live matches and non-football screenshots still consume 1 credit.
        </p>
      </form>
    </>
  );
}
