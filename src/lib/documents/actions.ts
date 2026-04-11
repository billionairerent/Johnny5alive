// Document actions: fetch facts + job, generate, save, list, load.
// Designed to work with either the real Supabase client or the demo client.

import type { ExtractedJob } from "@/types/jobs";
import type {
  TailoredDocumentRecord,
  TailoredResumeContent,
  CoverLetterContent,
  UserFacts,
} from "@/types/documents";
import { buildUserFacts } from "./facts";
import { tailorResume } from "./resume-tailor";
import { generateCoverLetter } from "./cover-letter";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = any;

export interface GenerateResult<T> {
  success: boolean;
  document?: TailoredDocumentRecord;
  content?: T;
  error?: string;
}

/** Build a UserFacts object from Supabase for a given user. */
export async function loadUserFacts(
  supabase: Supabase,
  userId: string
): Promise<UserFacts> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: sections } = await supabase
    .from("parsed_resume_sections")
    .select("section, content, sort_order")
    .eq("user_id", userId);

  return buildUserFacts(profile, sections || []);
}

/** Load a job record and its extracted data from Supabase. */
export async function loadJob(
  supabase: Supabase,
  jobId: string
): Promise<{ id: string; requirements: ExtractedJob | null; title: string; company: string } | null> {
  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, company, requirements")
    .eq("id", jobId)
    .single();
  if (!job) return null;
  return job;
}

/** Find the next version number for a doc type for a given job. */
async function nextVersion(
  supabase: Supabase,
  userId: string,
  jobId: string,
  docType: string
): Promise<number> {
  const { data } = await supabase
    .from("tailored_documents")
    .select("version_number")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .eq("doc_type", docType);
  if (!Array.isArray(data) || data.length === 0) return 1;
  const max = data.reduce(
    (m: number, row: { version_number?: number }) =>
      Math.max(m, row.version_number ?? 0),
    0
  );
  return max + 1;
}

/** Generate and save a tailored resume for a given job. */
export async function generateTailoredResume(
  supabase: Supabase,
  userId: string,
  jobId: string,
  label?: string
): Promise<GenerateResult<TailoredResumeContent>> {
  try {
    const facts = await loadUserFacts(supabase, userId);
    const job = await loadJob(supabase, jobId);
    if (!job || !job.requirements) {
      return { success: false, error: "Job has no extracted data yet." };
    }

    const { content, alignment } = tailorResume(facts, job.requirements);
    const version = await nextVersion(supabase, userId, jobId, "resume");

    const { data: saved } = await supabase
      .from("tailored_documents")
      .insert({
        job_id: jobId,
        user_id: userId,
        doc_type: "resume",
        content,
        label: label || `Resume v${version} for ${job.title}`,
        version_number: version,
        status: "draft",
        keyword_matches: alignment,
      })
      .select()
      .single();

    return {
      success: true,
      document: saved as TailoredDocumentRecord,
      content,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Resume generation failed.",
    };
  }
}

/** Generate and save a cover letter for a given job. */
export async function generateTailoredCoverLetter(
  supabase: Supabase,
  userId: string,
  jobId: string,
  label?: string,
  tone: "confident" | "friendly" | "formal" = "confident"
): Promise<GenerateResult<CoverLetterContent>> {
  try {
    const facts = await loadUserFacts(supabase, userId);
    const job = await loadJob(supabase, jobId);
    if (!job || !job.requirements) {
      return { success: false, error: "Job has no extracted data yet." };
    }

    const { content, alignment } = generateCoverLetter(facts, job.requirements, { tone });
    const version = await nextVersion(supabase, userId, jobId, "cover_letter");

    const { data: saved } = await supabase
      .from("tailored_documents")
      .insert({
        job_id: jobId,
        user_id: userId,
        doc_type: "cover_letter",
        content,
        label: label || `Cover Letter v${version} for ${job.title}`,
        version_number: version,
        status: "draft",
        keyword_matches: alignment,
      })
      .select()
      .single();

    return {
      success: true,
      document: saved as TailoredDocumentRecord,
      content,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Cover letter generation failed.",
    };
  }
}

/** List all tailored documents for a given job. */
export async function listJobDocuments(
  supabase: Supabase,
  userId: string,
  jobId: string
): Promise<TailoredDocumentRecord[]> {
  const { data } = await supabase
    .from("tailored_documents")
    .select("*")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  return (data || []) as TailoredDocumentRecord[];
}

/** Load a single document by id. */
export async function getDocument(
  supabase: Supabase,
  documentId: string
): Promise<TailoredDocumentRecord | null> {
  const { data } = await supabase
    .from("tailored_documents")
    .select("*")
    .eq("id", documentId)
    .single();
  return (data as TailoredDocumentRecord) || null;
}

/** Mark a document as saved (approved by the user). */
export async function saveDocumentVersion(
  supabase: Supabase,
  documentId: string
): Promise<void> {
  await supabase
    .from("tailored_documents")
    .update({ status: "saved" })
    .eq("id", documentId);
}
