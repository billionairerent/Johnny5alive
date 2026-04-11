// Resume tailoring engine — deterministic, grounded in user facts.
//
// Core rules:
// 1. Never invent experience, dates, metrics, companies, or titles.
// 2. Only reorder, emphasize, and compress real content.
// 3. Skills are reordered so matched skills appear first.
// 4. Experience bullets are scored by keyword relevance and reordered.
// 5. The summary is assembled from the user's existing summary plus
//    matched skills — nothing fabricated.

import type {
  UserFacts,
  TailoredResumeContent,
  ExperienceEntry,
  KeywordAlignment,
} from "@/types/documents";
import type { ExtractedJob } from "@/types/jobs";
import { normalize } from "@/lib/jobs/normalizer";
import { alignKeywords } from "./keyword-aligner";

/** Score a text string by the number of job keywords it contains. */
function scoreByKeywords(text: string, keywords: string[]): number {
  const norm = normalize(text);
  let count = 0;
  for (const kw of keywords) {
    if (!kw) continue;
    if (norm.includes(normalize(kw))) count++;
  }
  return count;
}

/** Reorder skills so matched job skills come first (preserving the rest). */
function reorderSkills(
  skills: string[],
  matched: string[]
): string[] {
  const matchedSet = new Set(matched.map(normalize));
  const front: string[] = [];
  const back: string[] = [];

  for (const skill of skills) {
    const norm = normalize(skill);
    let isMatched = false;
    for (const m of matchedSet) {
      if (norm.includes(m) || m.includes(norm)) {
        isMatched = true;
        break;
      }
    }
    if (isMatched) front.push(skill);
    else back.push(skill);
  }

  return [...front, ...back];
}

/**
 * Reorder bullets within an experience entry by relevance to the job.
 * Does NOT remove or rewrite bullets.
 */
function tailorExperience(
  exp: ExperienceEntry,
  keywords: string[]
): ExperienceEntry {
  const scored = exp.bullets.map((b) => ({
    text: b,
    score: scoreByKeywords(b, keywords),
  }));
  // Sort by score desc, stable for equal scores (preserve original order)
  scored.sort((a, b) => b.score - a.score);
  return {
    ...exp,
    bullets: scored.map((s) => s.text),
  };
}

/**
 * Build a tailored summary using ONLY the user's existing summary as a base,
 * then append a keyword-aligned phrase if matched skills exist.
 * No new facts are introduced.
 */
function buildTailoredSummary(
  facts: UserFacts,
  alignment: KeywordAlignment,
  jobTitle: string
): string {
  const base = facts.summary.trim();
  const topMatched = alignment.matched.slice(0, 5);

  // If the user has no summary at all, synthesize a minimal one from
  // ONLY the data we know: headline, years experience, matched skills.
  if (!base) {
    const parts: string[] = [];
    if (facts.headline) parts.push(facts.headline + ".");
    if (facts.years_experience !== null && facts.years_experience > 0) {
      parts.push(`${facts.years_experience}+ years of experience.`);
    }
    if (topMatched.length > 0) {
      parts.push(`Core skills: ${topMatched.join(", ")}.`);
    }
    return parts.join(" ").trim();
  }

  // Append a keyword-aligned sentence without altering the base summary.
  if (topMatched.length > 0 && jobTitle) {
    const addition = ` Targeting ${jobTitle} roles leveraging ${topMatched
      .slice(0, 3)
      .join(", ")}.`;
    // Avoid duplicate append if already there
    if (!base.includes(addition)) return base + addition;
  }
  return base;
}

/**
 * Tailor a resume for a specific job.
 * Returns a TailoredResumeContent plus the keyword alignment used.
 */
export function tailorResume(
  facts: UserFacts,
  job: ExtractedJob
): { content: TailoredResumeContent; alignment: KeywordAlignment } {
  const alignment = alignKeywords(facts, job);
  const jobKeywords = [
    ...job.required_skills,
    ...job.preferred_skills,
    ...job.keywords.slice(0, 30),
  ];

  const skills = reorderSkills(facts.skills, [
    ...alignment.matched,
    ...alignment.addressable,
  ]);

  const experience = facts.experience.map((exp) =>
    tailorExperience(exp, jobKeywords)
  );

  const summary = buildTailoredSummary(facts, alignment, job.job_title);

  const content: TailoredResumeContent = {
    name: facts.name,
    headline: facts.headline || job.job_title,
    contact: {
      email: facts.email,
      phone: facts.phone,
      location: facts.location,
      linkedin_url: facts.linkedin_url,
      portfolio_url: facts.portfolio_url,
    },
    summary,
    skills,
    experience,
    education: facts.education,
    certifications: facts.certifications,
  };

  return { content, alignment };
}
