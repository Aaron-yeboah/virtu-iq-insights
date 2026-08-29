import { createServerFn } from "@tanstack/react-start";
import { requireAnalysisAuth } from "./auth-bearer";
import { ANALYSIS_MODEL, buildAnalysisSystemPrompt, IRRELEVANT_MESSAGE } from "./analysis-prompt";

export const runAnalysis = createServerFn({ method: "POST" })
  .middleware([requireAnalysisAuth])
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

    // Exactly 1 credit per scan. The plan (max_verdicts) decides how many
    // verdicts the AI returns — verdicts are NOT credits.
    const cost = 1;
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
    const extGuess = (analysis.image_path.split(".").pop() || "png").toLowerCase();
    let mimeType =
      extGuess === "jpg" || extGuess === "jpeg"
        ? "image/jpeg"
        : extGuess === "webp"
          ? "image/webp"
          : extGuess === "avif"
            ? "image/avif"
            : "image/png";
    try {
      const { data: fileBlob } = await supabase.storage
        .from("screenshots")
        .download(analysis.image_path);
      if (fileBlob && fileBlob.size > 0) {
        if (fileBlob.type) mimeType = fileBlob.type;
        const buffer = await fileBlob.arrayBuffer();
        base64Image = Buffer.from(buffer).toString("base64");
      }
    } catch {
      // handled by the signed-URL fallback below
    }

    if (!base64Image) {
      // Fallback: pull the bytes over the signed URL.
      try {
        const fetchRes = await fetch(signed.signedUrl);
        if (fetchRes.ok) {
          const contentType = fetchRes.headers.get("content-type");
          if (contentType && contentType.startsWith("image/")) mimeType = contentType;
          const buffer = await fetchRes.arrayBuffer();
          if (buffer.byteLength > 0) base64Image = Buffer.from(buffer).toString("base64");
        }
      } catch {
        // fall through to the guard below
      }
    }

    // Never let the model answer without actually seeing the screenshot —
    // otherwise it invents placeholder fixtures ("Team A vs Team B").
    if (!base64Image) return fail("Could not read the uploaded screenshot. Please upload it again.");

    // Preferred: Gemini (OpenRouter or Direct), Lovable AI gateway, then OpenAI.
    const lovableKey = process.env["LOVABLE_API_KEY"] || process.env["AI_GATEWAY_API_KEY"];
    const geminiKey = process.env["GEMINI_API_KEY"] || process.env["OPENROUTER_API_KEY"];
    const openAiKey = process.env["OPENAI_API_KEY"];

    const { data: limitData } = await supabase.rpc("my_verdict_limit");
    const verdictLimit = Math.max(1, Number(limitData ?? 1));
    const promptText = buildAnalysisSystemPrompt(verdictLimit);
    const userPrompt = `Apply 1X2 Poisson regression statistical analysis to this instant virtual football screenshot. Return strictly Home Win, Away Win, or Draw for your top ${verdictLimit} fixture(s). Apply relevance gate first.`;

    let raw = "";

    // 25-second serverless timeout guard
    const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 25000): Promise<Response> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
    };

    if (geminiKey) {
      const isOpenRouter = geminiKey.startsWith("sk-");

      if (isOpenRouter) {
        // OpenRouter Gemini Chat Completions API
        const openRouterModels = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite", "google/gemini-3.5-flash"];
        let response: Response | null = null;
        let lastErr = "";

        for (const model of openRouterModels) {
          try {
            response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${geminiKey}`,
                "HTTP-Referer": "https://virtu-iq.com",
                "X-Title": "Virtu-IQ",
              },
              body: JSON.stringify({
                model,
                max_tokens: 1500,
                messages: [
                  { role: "system", content: promptText },
                  {
                    role: "user",
                    content: [
                      { type: "text", text: userPrompt },
                      { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                    ],
                  },
                ],
              }),
            });
          } catch (err: unknown) {
            const isAbort = err instanceof Error && err.name === "AbortError";
            lastErr = isAbort ? "AI processing timed out. Please try a clearer screenshot." : "The AI service could not be reached. Please try again.";
            response = null;
            continue;
          }

          if (response && response.ok) break;
          if (response && (response.status === 429 || response.status === 402)) break;
        }

        if (!response) return fail(lastErr || "The AI service could not be reached. Please try again.");
        if (response.status === 429) return fail("Rate limit reached. Please try again in a moment.");
        if (response.status === 402) return fail("AI credits are exhausted. Please top up your OpenRouter credits.");
        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          return fail(`AI service error (${response.status}): ${errText.slice(0, 150)}`);
        }

        const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
        raw = payload.choices?.[0]?.message?.content ?? "";
      } else {
        // Direct Google Gemini API — retry on 503 with model fallback
        const geminiModels = ["gemini-2.0-flash", "gemini-1.5-flash"];
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

        const requestBody = JSON.stringify({
          contents: [{ parts: contentsParts }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

        let geminiRes: Response | null = null;
        let lastErr = "";

        for (const model of geminiModels) {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          // Up to 3 attempts per model with exponential backoff
          for (let attempt = 0; attempt < 3; attempt++) {
            if (attempt > 0) {
              await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
            }
            try {
              geminiRes = await fetchWithTimeout(geminiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: requestBody,
              });
            } catch (err: unknown) {
              const isAbort = err instanceof Error && err.name === "AbortError";
              lastErr = isAbort ? "AI processing timed out. Please try a clearer screenshot." : "The AI service could not be reached. Please try again.";
              geminiRes = null;
              continue;
            }

            if (geminiRes.status === 503) {
              lastErr = "Model is temporarily overloaded. Retrying...";
              geminiRes = null;
              continue; // retry
            }
            break; // success or non-retryable error
          }
          if (geminiRes && geminiRes.ok) break; // got a good response, stop trying models
          if (geminiRes && geminiRes.status !== 503) break; // non-retryable error
        }

        if (!geminiRes) return fail(lastErr || "The AI service could not be reached after multiple attempts. Please try again.");
        if (geminiRes.status === 429) return fail("Rate limit reached. Please try again in a moment.");
        if (!geminiRes.ok) {
          const errBody = await geminiRes.text().catch(() => "");
          return fail(`AI service error (${geminiRes.status}): ${errBody.slice(0, 150)}`);
        }

        const geminiData = (await geminiRes.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }
    } else if (lovableKey) {
      // Lovable AI Gateway (OpenAI-compatible chat completions)
      const imageUrl = base64Image ? `data:${mimeType};base64,${base64Image}` : signed.signedUrl;
      let response: Response;
      try {
        response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      } catch (err: unknown) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        return fail(isAbort ? "AI processing timed out. Please try a clearer screenshot." : "The AI service could not be reached. Please try again.");
      }

      if (response.status === 429) return fail("Rate limit reached. Please try again in a moment.");
      if (response.status === 402) return fail("AI credits are exhausted. Please top up Lovable AI credits.");
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        return fail(`AI service error (${response.status}): ${errText.slice(0, 150)}`);
      }
      const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      raw = payload.choices?.[0]?.message?.content ?? "";
    } else if (openAiKey) {
      let response: Response;
      try {
        response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
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
                  { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
                ],
              },
            ],
          }),
        });
      } catch (err: unknown) {
        const isAbort = err instanceof Error && err.name === "AbortError";
        return fail(isAbort ? "AI processing timed out. Please try a clearer screenshot." : "The AI service could not be reached. Please try again.");
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
        "AI service is not configured. Set GEMINI_API_KEY (or LOVABLE_API_KEY / OPENAI_API_KEY) in the deployment environment variables."
      );
    }

    let cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    if (!cleaned.startsWith("{")) {
      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");
      if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
    }

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

    // Relevance gate: not instant virtuals => refund the credit.
    if (parsed["relevant"] === false || limited.length === 0) {
      const reason = typeof parsed["reason"] === "string" ? String(parsed["reason"]).slice(0, 200) : "";
      
      // Refund the credit since they didn't get a verdict
      await supabase.rpc("refund_credits", {
        _amount: cost,
        _reason: "Refund: irrelevant screenshot",
        _ref_id: analysis.id,
      });

      await supabase
        .from("analyses")
        .update({
          status: "failed",
          title: "Not an instant virtuals screenshot",
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
        credits_used: cost,
        result: result as never,
        error_message: null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", analysis.id);
    if (saveError) return fail(saveError.message);

    return { ok: true, alreadyDone: false, irrelevant: false };
  });
