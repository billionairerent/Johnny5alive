// Deterministic job description parser.
// Extracts structured fields from raw text without AI.

import type { ExtractedJob } from "@/types/jobs";
import {
  normalize,
  lines,
  tokenize,
  parseSalary,
  detectRemoteType,
  detectEmploymentType,
  detectExperienceLevel,
  extractYearsExperience,
  extractSkills,
} from "./normalizer";

/** Section header patterns for splitting job descriptions. */
const SECTION_PATTERNS: Record<string, RegExp> = {
  responsibilities: /^(?:responsibilities|what you['']?ll do|the role|about the role|key duties|duties|job description)/i,
  requirements: /^(?:requirements|qualifications|what we['']?re looking for|who you are|must have|minimum qualifications|basic qualifications)/i,
  preferred: /^(?:preferred|nice to have|bonus|preferred qualifications|desired|plus)/i,
  benefits: /^(?:benefits|perks|what we offer|compensation|pay|salary)/i,
  about: /^(?:about (?:us|the company|the team)|who we are|company overview|our mission)/i,
};

/** Detect which section a line belongs to. */
function detectSection(line: string): string | null {
  for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(line.replace(/[:\-–—]/g, "").trim())) return section;
  }
  return null;
}

/** Split text into labeled sections. */
function splitSections(
  text: string
): Record<string, string[]> {
  const allLines = lines(text);
  const sections: Record<string, string[]> = {
    header: [],
    responsibilities: [],
    requirements: [],
    preferred: [],
    benefits: [],
    about: [],
    other: [],
  };

  let current = "header";
  for (const line of allLines) {
    const detected = detectSection(line);
    if (detected) {
      current = detected;
      continue; // skip the header line itself
    }
    sections[current].push(line);
  }

  return sections;
}

/** Extract bullet points (lines starting with -, *, •, or numbered). */
function extractBullets(sectionLines: string[]): string[] {
  return sectionLines
    .map((l) => l.replace(/^[\s\-\*•●◦▪→>\d.)\]]+\s*/, "").trim())
    .filter((l) => l.length > 5);
}

/** Try to extract location from header lines. */
function extractLocation(headerLines: string[]): string | null {
  for (const line of headerLines) {
    // "San Francisco, CA" or "New York, NY" patterns
    const match = line.match(
      /([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)/
    );
    if (match) return match[1].trim();

    // "Location: ..." pattern
    const locMatch = line.match(/location\s*[:–\-]\s*(.+)/i);
    if (locMatch) return locMatch[1].trim();
  }
  return null;
}

/** Try to extract company name from header. */
function extractCompanyFromHeader(headerLines: string[]): string | null {
  // Common pattern: "Company Name | Job Title" or "at Company Name"
  for (const line of headerLines) {
    const atMatch = line.match(/\bat\s+([A-Z][A-Za-z0-9\s&.,]+)/);
    if (atMatch) return atMatch[1].trim();
  }
  return null;
}

/** Try to extract job title from header. */
function extractTitleFromHeader(headerLines: string[]): string | null {
  // The first line that looks like a title (not too long, capitalized)
  for (const line of headerLines.slice(0, 5)) {
    const clean = line.replace(/^(job\s+title|position|role)\s*[:–\-]\s*/i, "").trim();
    if (clean.length > 3 && clean.length < 100 && /[A-Z]/.test(clean)) {
      return clean;
    }
  }
  return null;
}

/**
 * Parse a raw job description into structured data.
 * This is deterministic — no AI required.
 */
export function parseJobDescription(
  rawText: string,
  overrides?: { company_name?: string; job_title?: string }
): ExtractedJob {
  const sections = splitSections(rawText);
  const allText = rawText;

  const salary = parseSalary(allText);
  const allSkills = extractSkills(allText);
  const reqSkills = extractSkills(sections.requirements.join(" "));
  const prefSkills = extractSkills(sections.preferred.join(" "));

  // Required skills = skills found in requirements section
  // Preferred skills = skills found in preferred section
  // If no sections found, split heuristically
  const requiredSkillsFinal =
    reqSkills.length > 0 ? reqSkills : allSkills.slice(0, Math.ceil(allSkills.length * 0.7));
  const preferredSkillsFinal =
    prefSkills.length > 0
      ? prefSkills
      : allSkills.filter((s) => !requiredSkillsFinal.includes(s));

  return {
    company_name:
      overrides?.company_name || extractCompanyFromHeader(sections.header) || "",
    job_title:
      overrides?.job_title || extractTitleFromHeader(sections.header) || "",
    location: extractLocation(sections.header) || extractLocation(lines(allText)),
    employment_type: detectEmploymentType(allText),
    remote_type: detectRemoteType(allText),
    salary_min: salary.min,
    salary_max: salary.max,
    salary_currency: salary.currency,
    experience_level: detectExperienceLevel(allText),
    responsibilities: extractBullets(sections.responsibilities),
    required_skills: requiredSkillsFinal,
    preferred_skills: preferredSkillsFinal,
    qualifications: extractBullets(sections.requirements),
    keywords: tokenize(allText).slice(0, 50),
    application_url: null,
    visa_requirement: /visa\s+sponsor/i.test(allText)
      ? "sponsorship_available"
      : /\bauthori[sz]ed to work\b/i.test(allText)
        ? "authorization_required"
        : null,
    years_experience: extractYearsExperience(allText),
  };
}
