import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { runAnalysis } from "@/lib/analysis.functions";
import { profileQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/analyze")({
  head: () => ({
    meta: [
      { title: "New Analysis — Virtu-IQ" },
      { name: "description", content: "Upload a screenshot and let Virtu-IQ's AI extract structured insights, data points and recommendations." },
      { property: "og:title", content: "New Analysis — Virtu-IQ" },
      { property: "og:description", content: "Turn any screenshot into a structured AI insight report." },
    ],
  }),
  component: AnalyzePage,
});

const MAX_BYTES = 8 * 1024 * 1024;

function AnalyzePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const analyze = useServerFn(runAnalysis);
  const { data: profile } = useQuery(profileQuery(user.id));

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Select a screenshot first.");
      if (!file.type.startsWith("image/")) throw new Error("Only image files are supported.");
      if (file.size > MAX_BYTES) throw new Error("Images must be smaller than 8MB.");

      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("screenshots")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);

      const { data: created, error: insertError } = await supabase
        .from("analyses")
        .insert({
          user_id: user.id,
          image_path: path,
          prompt: prompt.trim().slice(0, 800) || null,
          title: file.name.slice(0, 80),
        })
        .select("id")
        .single();
      if (insertError) throw new Error(insertError.message);

      await analyze({ data: { analysisId: created.id } });
      return created.id;
    },
    onSuccess: async (id) => {
      await queryClient.invalidateQueries();
      toast.success("Analysis complete");
      navigate({ to: "/analysis/$id", params: { id } });
    },
    onError: (error: Error) => {
      const message = error.message.includes("INSUFFICIENT_CREDITS")
        ? "You're out of credits. Top up to keep analyzing."
        : error.message;
      toast.error(message);
    },
  });

  return (
    <>
      <PageHeader
        title="New analysis"
        description={`Costs 1 credit. You have ${profile?.credits ?? 0} available.`}
      />

      <form
        className="grid max-w-3xl gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="rounded-xl border border-border bg-card p-6">
          <Label htmlFor="screenshot">Screenshot</Label>
          <label
            htmlFor="screenshot"
            className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/40 px-4 py-10 text-center transition-colors hover:border-primary"
          >
            {preview ? (
              <img src={preview} alt="Selected screenshot preview" className="max-h-64 rounded-md" />
            ) : (
              <>
                <Upload className="size-6 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Tap to choose an image
                </span>
                <span className="text-xs text-muted-foreground">PNG or JPG, up to 8MB</span>
              </>
            )}
          </label>
          <Input
            id="screenshot"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              setFile(selected);
              setPreview(selected ? URL.createObjectURL(selected) : null);
            }}
          />
          {file && <p className="mt-3 text-xs text-muted-foreground">{file.name}</p>}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <Label htmlFor="prompt">What should we focus on? (optional)</Label>
          <Textarea
            id="prompt"
            value={prompt}
            maxLength={800}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Summarise the performance numbers and flag anything unusual."
            className="mt-3 min-h-28"
          />
        </div>

        <Button type="submit" size="lg" disabled={!file || mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {mutation.isPending ? "Analyzing…" : "Analyze screenshot"}
        </Button>
      </form>
    </>
  );
}
