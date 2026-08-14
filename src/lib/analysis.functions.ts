import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ANALYSIS_MODEL, ANALYSIS_SYSTEM_PROMPT, IRRELEVANT_MESSAGE } from "./analysis-prompt";

export const runAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { analysisId: string }) => {
    if (!input?.analysisId || typeof input.analysisId !== "string") {
      throw new Error("analysisId is required");
    }
    return { analysisId: input.analysisId.slice(0, 64) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: analysis, error: loadError } = await supabase
      .from("analyses")
      .select("id, image_path, status, credits_used")
      .eq("id", data.analysisId)
      .eq("user_id", userId)
      .maybeSingle();

    if (loadError) throw new Error(loadError.message);
    if (!analysis) throw new Error("Analysis not found");
    if (analysis.status === "completed") return { ok: true, alreadyDone: true, irrelevant: false };

    const cost = analysis.credits_used ?? 1;
    const { error: spendError } = await supabase.rpc("spend_credits", {
      _amount: cost,
      _reason: "Screenshot analysis",
      _ref_id: analysis.id,
    });
    if (spendError) {
      const insufficient = spendError.message.includes("INSUFFICIENT_CREDITS");
      throw new Error(insufficient ? "INSUFFICIENT_CREDITS" : spendError.message);
    }

    await supabase.from("analyses").update({ status: "processing" }).eq("id", analysis.id);

    const fail = async (message: string) => {
      await supabase.rpc("refund_credits", {
        _amount: cost,
        _reason: "Refund: analysis failed",
        _ref_id: analysis.id,
      });
      await supabase
        .from("analyses")
        .update({ status: "failed", error_message: message.slice(0, 400) })
        .eq("id", analysis.id);
      throw new Error(message);
    };

    const { data: signed, error: signError } = await supabase.storage
      .from("screenshots")
      .createSignedUrl(analysis.image_path, 600);
    if (signError || !signed?.signedUrl) return fail("Could not read the uploaded screenshot.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return fail("AI service is not configured.");

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: ANALYSIS_MODEL,
          messages: [
            { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    "Read this screenshot and pick the most likely outcome for every football match you can clearly see. Apply the relevance gate first.",
                },
                { type: "image_url", image_url: { url: signed.signedUrl } },
              ],
            },
          ],
        }),
      });
    } catch {
      return fail("The AI service could not be reached. Please try again.");
    }

    if (response.status === 429) return fail("Rate limit reached. Please try again in a moment.");
    if (!response.ok) return fail(`AI service error (${response.status}).`);

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return fail("Virtu-IQ could not read this screenshot clearly. Please try again.");
    }

    const matches = Array.isArray(parsed["matches"]) ? (parsed["matches"] as unknown[]) : [];

    // Relevance gate: not football => credit stays spent, no refund.
    if (parsed["relevant"] === false || matches.length === 0) {
      const reason = typeof parsed["reason"] === "string" ? String(parsed["reason"]).slice(0, 200) : "";
      await supabase
        .from("analyses")
        .update({
          status: "failed",
          title: "Not a football screenshot",
          summary: reason,
          result: { relevant: false, reason } as never,
          error_message: IRRELEVANT_MESSAGE,
          completed_at: new Date().toISOString(),
        })
        .eq("id", analysis.id);
      return { ok: false, alreadyDone: false, irrelevant: true };
    }

    const title =
      typeof parsed["title"] === "string" && parsed["title"]
        ? String(parsed["title"]).slice(0, 120)
        : "Football prediction";
    const summary = typeof parsed["headline"] === "string" ? String(parsed["headline"]).slice(0, 500) : "";

    const { error: saveError } = await supabase
      .from("analyses")
      .update({
        status: "completed",
        title,
        summary,
        result: parsed as never,
        error_message: null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", analysis.id);
    if (saveError) return fail(saveError.message);

    return { ok: true, alreadyDone: false, irrelevant: false };
  });
