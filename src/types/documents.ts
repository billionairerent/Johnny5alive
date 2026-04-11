// Types for tailored documents (Phase 3: Document Engine).

// ── Source facts from the user's master resume ──
// These are the ONLY things the engine is allowed to reference when
// generating tailored documents. No invention beyond this.

export interface UserFacts {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin_url: string;
  portfolio_url: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: string[];
  languages: string[];
  years_experience: number | null;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface EducationEntry {
  school: string;
  degree: string;
  field: string;
  year: string;
}

// ── Tailored resume content structure ──

export interface TailoredResumeContent {
  // Contact & header (never fabricated)
  name: string;
  headline: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin_url: string;
    portfolio_url: string;
  };
  // Tailored positioning — rewritten from source summary with keyword emphasis
  summary: string;
  // Skills reordered: matched skills first, then remaining
  skills: string[];
  // Experience entries with re-ordered bullets (no invented content)
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: string[];
}

// ── Cover letter content structure ──

export interface CoverLetterContent {
  recipient: {
    company: string;
    role: string;
  };
  greeting: string;
  opening: string;
  body: string[];   // 1–3 grounded paragraphs
  closing: string;
  signature: {
    name: string;
    email: string;
    phone: string;
  };
}

// ── Keyword alignment result ──

export interface KeywordAlignment {
  matched: string[];      // Keywords from job present in user facts
  addressable: string[];  // Keywords the user has but hasn't emphasized
  missing: string[];      // Keywords required by job but absent from facts
  coverage: number;       // 0–100 percentage
}

// ── Generation options & results ──

export interface GenerationOptions {
  label?: string;
  tone?: "confident" | "friendly" | "formal";
}

export type DocumentType = "resume" | "cover_letter" | "intro_email";

export interface TailoredDocumentRecord {
  id: string;
  job_id: string;
  user_id: string;
  doc_type: DocumentType;
  content: TailoredResumeContent | CoverLetterContent;
  label: string;
  version_number: number;
  status: "draft" | "saved" | "exported";
  base_resume_id: string | null;
  keyword_matches: KeywordAlignment | null;
  created_at: string;
  updated_at: string;
}
