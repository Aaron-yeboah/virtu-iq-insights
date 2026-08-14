import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ANALYSIS_MODEL, buildAnalysisSystemPrompt, IRRELEVANT_MESSAGE } from "./analysis-prompt";

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

    // Retrieve image data for AI processing
    let base64Image = "";
    let mimeType = "image/png";
    try {
      const { data: fileBlob } = await supabase.storage
        .from("screenshots")
        .download(analysis.image_path);
      if (fileBlob) {
        mimeType = fileBlob.type || "image/png";
        const buffer = await fileBlob.arrayBuffer();
        base64Image = Buffer.from(buffer).toString("base64");
      }
    } catch {
      // If direct download fails, fetch from signedUrl
      try {
        const fetchRes = await fetch(signed.signedUrl);
        if (fetchRes.ok) {
          const contentType = fetchRes.headers.get("content-type");
          if (contentType) mimeType = contentType;
          const buffer = await fetchRes.arrayBuffer();
          base64Image = Buffer.from(buffer).toString("base64");
        }
      } catch {}
    }

    // Preferred: Lovable AI gateway (LOVABLE_API_KEY). Fallbacks: direct Gemini, then OpenAI.
    const lovableKey = process.env["LOVABLE_API_KEY"] || process.env["AI_GATEWAY_API_KEY"];
    const geminiKey = process.env["GEMINI_API_KEY"];
    const openAiKey = process.env["OPENAI_API_KEY"];

    const { data: limitData } = await supabase.rpc("my_verdict_limit");
    const verdictLimit = Math.max(1, Number(limitData ?? 1));
    const promptText = buildAnalysisSystemPrompt(verdictLimit);
    const userPrompt = `Read this instant/virtual football screenshot and pick the most likely outcome for your ${verdictLimit} highest-confidence fixture(s) only. Apply the relevance gate first.`;

    let raw = "";

    if (lovableKey) {
      // Lovable AI Gateway (OpenAI-compatible chat completions)
      const imageUrl = base64Image ? `data:${mimeType};base64,${base64Image}` : signed.signedUrl;
      let response: Response;
      try {
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": lovableKey,
          },
          body: JSON.stringify({
            model: ANALYSIS_MODEL,
            messages: [
              { role: "system", content: promptText },
              {
                role: "user",
                content: [
                  { type: "text", text: userPrompt },
                  { type: "image_url", image_url: { url: imageUrl } },
                ],
              },
            ],
          }),
        });
      } catch {
        return fail("The AI service could not be reached. Please try again.");
      }

      if (response.status === 429) return fail("Rate limit reached. Please try again in a moment.");
      if (response.status === 402) return fail("AI credits are exhausted. Please top up Lovable AI credits.");
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        return fail(`AI service error (${response.status}): ${errText.slice(0, 150)}`);
      }
      const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      raw = payload.choices?.[0]?.message?.content ?? "";
    } else if (geminiKey) {
      // Use Google Gemini API directly
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;
      const contentsParts: Record<string, unknown>[] = [
        { text: `${promptText}\n\n${userPrompt}` },
      ];
      if (base64Image) {
        contentsParts.push({
          inlineData: {
            mimeType,
            data: base64Image,
          },
        });
      }

      let geminiRes: Response;
      try {
        geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: contentsParts }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        });
      } catch {
        return fail("The AI service could not be reached. Please try again.");
      }

      if (geminiRes.status === 429) return fail("Rate limit reached. Please try again in a moment.");
      if (!geminiRes.ok) {
        const errBody = await geminiRes.text().catch(() => "");
        return fail(`AI service error (${geminiRes.status}): ${errBody.slice(0, 150)}`);
      }

      const geminiData = (await geminiRes.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    } else if (openAiKey) {
      let response: Response;
      try {
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${openAiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: promptText },
              {
                role: "user",
                content: [
                  { type: "text", text: userPrompt },
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
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        return fail(`AI service error (${response.status}): ${errText.slice(0, 150)}`);
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      raw = payload.choices?.[0]?.message?.content ?? "";
    } else {
      return fail(
        "AI service is not configured. Set LOVABLE_API_KEY (or GEMINI_API_KEY / OPENAI_API_KEY) in the deployment environment variables."
      );
    }

    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return fail("Virtu-IQ could not read this screenshot clearly. Please try again.");
    }

    const matches = Array.isArray(parsed["matches"]) ? (parsed["matches"] as Record<string, unknown>[]) : [];
    const limited = matches.slice(0, verdictLimit).map((m) => ({
      fixture: typeof m["fixture"] === "string" ? m["fixture"] : "",
      competition: typeof m["competition"] === "string" ? m["competition"] : "",
      kickoff: typeof m["kickoff"] === "string" ? m["kickoff"] : "",
      pick: typeof m["pick"] === "string" ? m["pick"] : "",
      market: typeof m["market"] === "string" ? m["market"] : "",
      odds: typeof m["odds"] === "string" ? m["odds"] : "",
      confidence: typeof m["confidence"] === "number" ? m["confidence"] : undefined,
    }));

    // Relevance gate: not football => credit stays spent, no refund.
    if (parsed["relevant"] === false || limited.length === 0) {
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
    const result = {
      relevant: true,
      title,
      headline: summary,
      confidence: typeof parsed["confidence"] === "number" ? parsed["confidence"] : undefined,
      matches: limited,
      verdict_limit: verdictLimit,
    };

    const { error: saveError } = await supabase
      .from("analyses")
      .update({
        status: "completed",
        title,
        summary,
        result: result as never,
        error_message: null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", analysis.id);
    if (saveError) return fail(saveError.message);

    return { ok: true, alreadyDone: false, irrelevant: false };
  });
