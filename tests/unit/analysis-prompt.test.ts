import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAnalysisSystemPrompt,
  ANALYSIS_MODEL,
  IRRELEVANT_MESSAGE,
} from "../../src/lib/analysis-prompt.ts";

test("Analysis Prompt Generator - verdict limits", () => {
  // Starter tier (1 or 2 verdicts)
  const prompt1 = buildAnalysisSystemPrompt(1);
  assert.match(prompt1, /exactly 1 verdict/i);
  assert.match(prompt1, /EXACTLY 1 object/);
  assert.match(prompt1, /RELEVANCE GATE/);

  const prompt2 = buildAnalysisSystemPrompt(2);
  assert.match(prompt2, /exactly 2 verdicts/i);
  assert.match(prompt2, /EXACTLY 2 objects/);

  // Plus tier (4 verdicts)
  const prompt4 = buildAnalysisSystemPrompt(4);
  assert.match(prompt4, /exactly 4 verdicts/i);
  assert.match(prompt4, /EXACTLY 4 objects/);

  // Premium tier (8 verdicts)
  const prompt8 = buildAnalysisSystemPrompt(8);
  assert.match(prompt8, /exactly 8 verdicts/i);
  assert.match(prompt8, /EXACTLY 8 objects/);
});

test("Analysis Prompt Generator - model & schema integrity", () => {
  assert.ok(ANALYSIS_MODEL.length > 0, "Model identifier should not be empty");
  assert.match(IRRELEVANT_MESSAGE, /instant virtuals screenshot/i);

  const prompt = buildAnalysisSystemPrompt(4);
  assert.match(prompt, /"matches"/);
  assert.match(prompt, /"fixture"/);
  assert.match(prompt, /"pick"/);
  assert.match(prompt, /"confidence"/);
  assert.match(prompt, /"headline"/);
});
