export const ANALYSIS_MODEL = "google/gemini-2.5-flash";

export const ANALYSIS_SYSTEM_PROMPT = `You are Virtu-IQ, a visual analytics engine.
You receive a screenshot and must extract structured, decision-ready insight.
Reply with ONLY valid minified JSON matching this shape:
{
  "title": string,
  "category": string,
  "summary": string,
  "extracted_text": string,
  "key_findings": string[],
  "data_points": [{ "label": string, "value": string }],
  "recommendations": string[],
  "confidence": number
}
Rules: confidence is 0-1. Never invent data that is not visible. Keep summary under 90 words.`;

export type AnalysisResult = {
  title: string;
  category: string;
  summary: string;
  extracted_text: string;
  key_findings: string[];
  data_points: { label: string; value: string }[];
  recommendations: string[];
  confidence: number;
};
