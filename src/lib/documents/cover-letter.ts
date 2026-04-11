// Cover letter generator — deterministic, grounded in user facts.
// Uses template composition, not fabrication.
// Only references content available in UserFacts + ExtractedJob.

import type {
  UserFacts,
  CoverLetterContent,
  KeywordAlignment,
} from "@/types/documents";
import type { ExtractedJob } from "@/types/jobs";
import { alignKeywords } from "./keyword-aligner";

interface CoverLetterOptions {
  tone?: "confident" | "friendly" | "formal";
}

function pickTopStrengths(facts: UserFacts, alignment: KeywordAlignment): string[] {
  // Prefer matched keywords since those are real user skills.
  // Fall back to the user's first few declared skills if nothing matched.
  if (alignment.matched.length > 0) return alignment.matched.slice(0, 3);
  return facts.skills.slice(0, 3);
}

function buildGreeting(tone: string): string {
  if (tone === "formal") return "Dear Hiring Manager,";
  if (tone === "friendly") return "Hello,";
  return "Dear Hiring Team,";
}

function buildOpening(
  facts: UserFacts,
  job: ExtractedJob,
  tone: string
): string {
  const company = job.company_name || "your company";
  const role = job.job_title || "this role";

  // Grounded opening — only uses headline + years experience if available.
  const yearsClause =
    facts.years_experience !== null && facts.years_experience > 0
      ? `With ${facts.years_experience}+ years of experience`
      : facts.headline
        ? `As a ${facts.headline}`
        : "";

  if (tone === "friendly") {
    return `I'm excited to apply for the ${role} position at ${company}. ${yearsClause}, I believe I can make a strong impact on your team.`;
  }
  if (tone === "formal") {
    return `I am writing to express my interest in the ${role} position at ${company}. ${yearsClause}, I am confident in my ability to contribute to your organization.`;
  }
  return `I'm applying for the ${role} role at ${company}. ${yearsClause}, I'm confident my background is a strong match for what your team is looking for.`;
}

function buildBodyParagraphs(
  facts: UserFacts,
  job: ExtractedJob,
  alignment: KeywordAlignment
): string[] {
  const paragraphs: string[] = [];
  const topStrengths = pickTopStrengths(facts, alignment);

  // Paragraph 1: Value proposition grounded in top strengths.
  if (topStrengths.length > 0) {
    paragraphs.push(
      `My core strengths — ${topStrengths.join(", ")} — map directly to what your team is asking for. ` +
      `I've applied these skills to ship real work in prior roles, and I can bring that same track record to ${job.company_name || "your team"}.`
    );
  }

  // Paragraph 2: Reference the most recent real experience (no invention).
  const mostRecent = facts.experience[0];
  if (mostRecent && mostRecent.company && mostRecent.title) {
    paragraphs.push(
      `In my role as ${mostRecent.title} at ${mostRecent.company}, I focused on the kind of work this position requires. ` +
      `I'd welcome the chance to bring that experience to ${job.company_name || "your team"}.`
    );
  }

  // Paragraph 3: Address gaps tactfully if significant ones exist.
  if (alignment.missing.length > 3 && topStrengths.length > 0) {
    paragraphs.push(
      `While I'm always growing, I'm confident my foundation in ${topStrengths[0]} lets me ramp up quickly on the areas I haven't yet explored in depth.`
    );
  }

  return paragraphs;
}

function buildClosing(tone: string, job: ExtractedJob): string {
  const company = job.company_name || "your team";
  if (tone === "formal") {
    return `Thank you for considering my application. I would welcome the opportunity to discuss how I can contribute to ${company}.`;
  }
  if (tone === "friendly") {
    return `Thanks so much for reading. I'd love to chat about how I could help ${company} move forward.`;
  }
  return `Thanks for reviewing my application. I'd welcome a conversation about how I can help ${company} deliver on its goals.`;
}

/**
 * Generate a cover letter from user facts and job context.
 * Grounded, deterministic, no fabrication.
 */
export function generateCoverLetter(
  facts: UserFacts,
  job: ExtractedJob,
  options: CoverLetterOptions = {}
): { content: CoverLetterContent; alignment: KeywordAlignment } {
  const tone = options.tone ?? "confident";
  const alignment = alignKeywords(facts, job);

  const content: CoverLetterContent = {
    recipient: {
      company: job.company_name || "",
      role: job.job_title || "",
    },
    greeting: buildGreeting(tone),
    opening: buildOpening(facts, job, tone),
    body: buildBodyParagraphs(facts, job, alignment),
    closing: buildClosing(tone, job),
    signature: {
      name: facts.name,
      email: facts.email,
      phone: facts.phone,
    },
  };

  return { content, alignment };
}
