// User facts service — reads the master resume and profile, and returns
// a UserFacts object that is the ONLY source of truth for document generation.
// Nothing downstream is allowed to invent information beyond what appears here.

import type {
  UserFacts,
  ExperienceEntry,
  EducationEntry,
} from "@/types/documents";

interface ProfileRow {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  headline?: string | null;
}

interface ResumeSectionRow {
  section: string;
  content: unknown;
  sort_order?: number;
}

/** Safely coerce unknown into a string. */
function str(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return fallback;
  return String(v);
}

/** Parse a single experience entry from raw section content. */
function parseExperience(raw: unknown): ExperienceEntry | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const title = str(r.title);
  const company = str(r.company);
  if (!title && !company) return null;

  const bulletsRaw = r.bullets;
  const bullets: string[] = Array.isArray(bulletsRaw)
    ? bulletsRaw.map((b) => str(b)).filter(Boolean)
    : [];

  return {
    title,
    company,
    location: str(r.location),
    start: str(r.start),
    end: str(r.end),
    bullets,
  };
}

/** Parse a single education entry from raw section content. */
function parseEducation(raw: unknown): EducationEntry | null {
  if (typeof raw === "string") {
    return { school: raw, degree: "", field: "", year: "" };
  }
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  return {
    school: str(r.school),
    degree: str(r.degree),
    field: str(r.field),
    year: str(r.year),
  };
}

/**
 * Build a UserFacts object from profile and parsed resume sections.
 * Returns a minimal but valid object even when data is missing.
 */
export function buildUserFacts(
  profile: ProfileRow | null,
  sections: ResumeSectionRow[]
): UserFacts {
  const facts: UserFacts = {
    name: str(profile?.full_name),
    email: str(profile?.email),
    phone: str(profile?.phone),
    location: str(profile?.location),
    linkedin_url: str(profile?.linkedin_url),
    portfolio_url: str(profile?.portfolio_url),
    headline: str(profile?.headline),
    summary: "",
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    languages: [],
    years_experience: null,
  };

  // Sort sections for deterministic output
  const sorted = [...sections].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  for (const sec of sorted) {
    const c = sec.content;
    switch (sec.section) {
      case "summary":
        if (typeof c === "string") facts.summary = c;
        else if (Array.isArray(c)) facts.summary = c.map((v) => str(v)).join(" ");
        break;
      case "skills":
        if (Array.isArray(c)) facts.skills.push(...c.map((v) => str(v)).filter(Boolean));
        break;
      case "experience":
        if (Array.isArray(c)) {
          for (const item of c) {
            const exp = parseExperience(item);
            if (exp) facts.experience.push(exp);
          }
        }
        break;
      case "education":
        if (Array.isArray(c)) {
          for (const item of c) {
            const ed = parseEducation(item);
            if (ed) facts.education.push(ed);
          }
        }
        break;
      case "certifications":
        if (Array.isArray(c))
          facts.certifications.push(...c.map((v) => str(v)).filter(Boolean));
        break;
      case "languages":
        if (Array.isArray(c))
          facts.languages.push(...c.map((v) => str(v)).filter(Boolean));
        break;
    }
  }

  // Infer years of experience from experience dates if possible
  facts.years_experience = inferYearsExperience(facts.experience);

  return facts;
}

/** Estimate years of professional experience from the experience entries. */
function inferYearsExperience(experience: ExperienceEntry[]): number | null {
  if (experience.length === 0) return null;
  let earliest = new Date().getFullYear();
  let latest = 0;
  let found = false;
  for (const exp of experience) {
    const startYear = parseInt(exp.start.match(/\d{4}/)?.[0] || "0", 10);
    const endToken = exp.end.toLowerCase();
    const isPresent = /present|current/.test(endToken);
    const endYear = isPresent
      ? new Date().getFullYear()
      : parseInt(endToken.match(/\d{4}/)?.[0] || "0", 10);
    if (startYear > 1900) {
      earliest = Math.min(earliest, startYear);
      found = true;
    }
    if (endYear > 1900) latest = Math.max(latest, endYear);
  }
  if (!found || latest === 0) return null;
  return Math.max(0, latest - earliest);
}

/**
 * Assert that a generated text only references substrings found in the
 * source facts. Used as a guard in tests and generation pipelines.
 */
export function assertGrounded(generated: string, facts: UserFacts): string[] {
  const allFactText = [
    facts.name,
    facts.headline,
    facts.summary,
    ...facts.skills,
    ...facts.certifications,
    ...facts.experience.flatMap((e) => [e.title, e.company, ...e.bullets]),
    ...facts.education.flatMap((e) => [e.school, e.degree, e.field]),
  ]
    .join(" ")
    .toLowerCase();

  const violations: string[] = [];
  // Very simple check: any capitalized proper noun in generated that doesn't
  // appear in the facts is flagged. This is a best-effort guard.
  const properNouns = generated.match(/\b[A-Z][A-Za-z0-9]{2,}\b/g) || [];
  for (const noun of properNouns) {
    if (!allFactText.includes(noun.toLowerCase())) {
      violations.push(noun);
    }
  }
  return violations;
}
