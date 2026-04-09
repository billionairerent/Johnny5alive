// Text normalization utilities for job parsing and scoring.

/** Lowercase, trim, collapse whitespace. */
export function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Split a block of text into non-empty trimmed lines. */
export function lines(text: string): string[] {
  return text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Extract unique tokens (words 2+ chars) from text. */
export function tokenize(text: string): string[] {
  const words = normalize(text).match(/[a-z][a-z0-9+#.\-]{1,}/g) || [];
  return [...new Set(words)];
}

/** Parse salary strings like "$90,000", "$90k", "$90,000 - $120,000". */
export function parseSalary(
  text: string
): { min: number | null; max: number | null; currency: string } {
  const result = { min: null as number | null, max: null as number | null, currency: "USD" };

  // Detect currency
  if (/£/.test(text)) result.currency = "GBP";
  else if (/€/.test(text)) result.currency = "EUR";
  else if (/CAD/i.test(text)) result.currency = "CAD";

  // Match numbers like 90000, 90,000, 90k, 90K
  const nums = text.match(/[\d,]+\.?\d*\s*[kK]?/g);
  if (!nums) return result;

  const parsed = nums
    .map((n) => {
      const clean = n.replace(/,/g, "").trim();
      let val = parseFloat(clean);
      if (/[kK]/.test(n)) val *= 1000;
      return isNaN(val) ? null : val;
    })
    .filter((n): n is number => n !== null && n > 1000); // filter noise

  if (parsed.length >= 2) {
    result.min = Math.min(...parsed);
    result.max = Math.max(...parsed);
  } else if (parsed.length === 1) {
    result.min = parsed[0];
  }

  return result;
}

/** Detect remote/hybrid/onsite from text. */
export function detectRemoteType(
  text: string
): "remote" | "hybrid" | "onsite" | null {
  const lower = normalize(text);
  if (/\bfully\s+remote\b|\bremote\s+only\b|\b100%\s+remote\b/.test(lower))
    return "remote";
  if (/\bhybrid\b/.test(lower)) return "hybrid";
  if (/\bon[\s-]?site\b|\bin[\s-]?office\b|\bin[\s-]?person\b/.test(lower))
    return "onsite";
  if (/\bremote\b/.test(lower)) return "remote";
  return null;
}

/** Detect employment type. */
export function detectEmploymentType(
  text: string
): "full-time" | "part-time" | "contract" | "internship" | null {
  const lower = normalize(text);
  if (/\binternship\b|\bintern\b/.test(lower)) return "internship";
  if (/\bcontract\b|\bfreelance\b|\b1099\b/.test(lower)) return "contract";
  if (/\bpart[\s-]?time\b/.test(lower)) return "part-time";
  if (/\bfull[\s-]?time\b/.test(lower)) return "full-time";
  return null;
}

/** Detect experience level. */
export function detectExperienceLevel(
  text: string
): "entry" | "mid" | "senior" | "lead" | "executive" | null {
  const lower = normalize(text);
  if (/\bvp\b|\bchief\b|\bc-suite\b|\bdirector\b|\bexecutive\b/.test(lower))
    return "executive";
  if (/\blead\b|\bprincipal\b|\bstaff\b|\barchitect\b/.test(lower))
    return "lead";
  if (/\bsenior\b|\bsr\.?\b/.test(lower)) return "senior";
  if (/\bjunior\b|\bjr\.?\b|\bentry[\s-]?level\b|\bassociate\b/.test(lower))
    return "entry";
  return "mid";
}

/** Extract years of experience from text. */
export function extractYearsExperience(text: string): number | null {
  // "5+ years", "3-5 years", "minimum 7 years"
  const match = text.match(
    /(\d{1,2})\s*[\+\-–]\s*(?:\d{1,2}\s*)?(?:years?|yrs?)/i
  );
  if (match) return parseInt(match[1], 10);

  const match2 = text.match(
    /(?:at\s+least|minimum|min\.?)\s*(\d{1,2})\s*(?:years?|yrs?)/i
  );
  if (match2) return parseInt(match2[1], 10);

  const match3 = text.match(/(\d{1,2})\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i);
  if (match3) return parseInt(match3[1], 10);

  return null;
}

/** Common tech/business skills to look for. */
const SKILL_PATTERNS = [
  "javascript", "typescript", "python", "java", "go", "golang", "rust",
  "c\\+\\+", "c#", "ruby", "php", "swift", "kotlin", "scala", "r",
  "react", "next\\.?js", "vue", "angular", "svelte", "node\\.?js",
  "express", "django", "flask", "spring", "rails", "laravel",
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
  "terraform", "ci/cd", "jenkins", "github actions",
  "postgres", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
  "graphql", "rest", "api", "microservices", "serverless",
  "machine learning", "ml", "ai", "deep learning", "nlp", "llm",
  "data engineering", "data science", "analytics", "etl",
  "figma", "design systems", "ux", "ui",
  "agile", "scrum", "kanban", "jira",
  "project management", "product management", "stakeholder",
  "sql", "nosql", "html", "css", "tailwind",
  "git", "linux", "bash", "shell",
  "salesforce", "hubspot", "tableau", "power bi",
  "excel", "google sheets", "sap",
];

/** Extract skills found in text. */
export function extractSkills(text: string): string[] {
  const lower = normalize(text);
  const found: string[] = [];
  for (const pattern of SKILL_PATTERNS) {
    const regex = new RegExp(`\\b${pattern}\\b`, "i");
    if (regex.test(lower)) {
      // Use the pattern itself as canonical name
      found.push(pattern.replace(/\\/g, "").replace(/\.\?/g, ""));
    }
  }
  return [...new Set(found)];
}
