// Job extraction provider interface.
// Uses deterministic parser by default.
// AI providers (Claude API) can be plugged in later.

import type { ExtractedJob } from "@/types/jobs";
import { parseJobDescription } from "./parser";

export type ExtractionMethod = "deterministic" | "ai_claude";

export interface ExtractionResult {
  data: ExtractedJob;
  method: ExtractionMethod;
  confidence: number; // 0–100
}

/**
 * Extract structured job data from raw text.
 *
 * Currently uses the deterministic parser.
 * When ANTHROPIC_API_KEY is configured, this will attempt AI extraction
 * first and fall back to deterministic on failure.
 */
export async function extractJobStructuredData(
  rawText: string,
  overrides?: { company_name?: string; job_title?: string }
): Promise<ExtractionResult> {
  // TODO: When ANTHROPIC_API_KEY is set, try AI extraction first:
  // if (process.env.ANTHROPIC_API_KEY) {
  //   try {
  //     return await extractWithClaude(rawText, overrides);
  //   } catch (err) {
  //     console.warn("AI extraction failed, falling back to deterministic:", err);
  //   }
  // }

  const data = parseJobDescription(rawText, overrides);

  // Confidence based on how much data we were able to extract
  let confidence = 30; // base for having any text
  if (data.job_title) confidence += 15;
  if (data.company_name) confidence += 10;
  if (data.required_skills.length > 0) confidence += 15;
  if (data.responsibilities.length > 0) confidence += 10;
  if (data.qualifications.length > 0) confidence += 10;
  if (data.location || data.remote_type) confidence += 5;
  if (data.salary_min) confidence += 5;

  return {
    data,
    method: "deterministic",
    confidence: Math.min(confidence, 100),
  };
}
