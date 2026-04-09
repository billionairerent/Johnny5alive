// Server-compatible actions for the job import pipeline.
// import → extract → save → score → save score

import type { JobImportInput, UserProfileSnapshot, FitScore, ExtractedJob } from "@/types/jobs";
import { extractJobStructuredData } from "./extractor";
import { scoreJobFit } from "./scorer";

// ── Types for action results ──

export interface ImportResult {
  success: boolean;
  jobId?: string;
  importId?: string;
  extracted?: ExtractedJob;
  score?: FitScore;
  error?: string;
}

// ── Build user profile snapshot from demo/supabase data ──

export function buildProfileSnapshot(
  profile: { headline?: string | null } | null,
  resumeSections: Array<{ section: string; content: unknown }>,
): UserProfileSnapshot {
  const skills: string[] = [];
  const jobTitles: string[] = [];
  const education: string[] = [];
  const certifications: string[] = [];
  const keywords: string[] = [];

  for (const sec of resumeSections) {
    const content = sec.content;
    if (Array.isArray(content)) {
      if (sec.section === "skills") skills.push(...content.map(String));
      else if (sec.section === "experience") {
        for (const item of content) {
          if (typeof item === "object" && item !== null && "title" in item) {
            jobTitles.push(String((item as { title: string }).title));
          } else if (typeof item === "string") {
            keywords.push(item);
          }
        }
      } else if (sec.section === "education") education.push(...content.map(String));
      else if (sec.section === "certifications") certifications.push(...content.map(String));
    }
  }

  // If profile has a headline, use it as a job title hint
  if (profile?.headline) {
    jobTitles.unshift(profile.headline);
  }

  // Aggregate keywords from all sections
  for (const sec of resumeSections) {
    if (typeof sec.content === "string") {
      keywords.push(sec.content);
    }
  }

  return {
    headline: profile?.headline ?? null,
    skills,
    job_titles: jobTitles,
    years_experience: null, // TODO: infer from resume dates
    education,
    certifications,
    keywords,
  };
}

// ── Main import pipeline (runs client-side for demo mode) ──

export async function importAndScoreJob(
  input: JobImportInput,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<ImportResult> {
  if (!input.raw_text.trim()) {
    return { success: false, error: "Job description cannot be empty." };
  }

  if (input.raw_text.trim().length < 50) {
    return { success: false, error: "Job description is too short. Paste the full listing." };
  }

  try {
    // 1. Extract structured data
    const extraction = await extractJobStructuredData(input.raw_text, {
      company_name: input.company_name,
      job_title: input.job_title,
    });

    const extracted = extraction.data;

    // Use overrides or extracted values
    const company = input.company_name || extracted.company_name || "Unknown Company";
    const title = input.job_title || extracted.job_title || "Unknown Position";

    // 2. Save job record
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        user_id: userId,
        title,
        company,
        location: extracted.location,
        work_mode: extracted.remote_type,
        description: input.raw_text,
        requirements: extracted,
        salary_min: extracted.salary_min,
        salary_max: extracted.salary_max,
        salary_currency: extracted.salary_currency,
        source: input.source_url ? "url" : "pasted",
        source_url: input.source_url || null,
        status: "imported",
      })
      .select()
      .single();

    if (jobError) {
      return { success: false, error: "Failed to save job." };
    }

    const jobId = job.id;

    // 3. Save import record
    const { data: importRec } = await supabase
      .from("job_imports")
      .insert({
        user_id: userId,
        job_id: jobId,
        source: input.source_url ? "url" : "pasted",
        raw_text: input.raw_text,
        source_url: input.source_url || null,
        extracted_data: extracted,
        extraction_method: extraction.method,
        status: "extracted",
      })
      .select()
      .single();

    // 4. Build user profile snapshot for scoring
    const { data: profile } = await supabase
      .from("profiles")
      .select("headline")
      .eq("id", userId)
      .single();

    const { data: sections } = await supabase
      .from("parsed_resume_sections")
      .select("section, content")
      .eq("user_id", userId);

    const snapshot = buildProfileSnapshot(profile, sections || []);

    // 5. Score
    const score = scoreJobFit(extracted, snapshot);

    // 6. Save score
    await supabase.from("job_scores").insert({
      job_id: jobId,
      user_id: userId,
      fit_score: score.overall_score,
      strengths: score.strengths,
      gaps: score.gaps,
      risk_flags: score.missing_keywords.slice(0, 10),
      interview_angle: score.strengths[0] || null,
      recommendation: score.recommendation,
      explanation: score.notes,
    });

    // 7. Update job status
    await supabase
      .from("jobs")
      .update({ status: "scored" })
      .eq("id", jobId);

    // 8. Update import status
    if (importRec) {
      await supabase
        .from("job_imports")
        .update({ status: "scored" })
        .eq("id", importRec.id);
    }

    return {
      success: true,
      jobId,
      importId: importRec?.id,
      extracted,
      score,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during import.";
    return { success: false, error: message };
  }
}
