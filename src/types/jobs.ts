// ── Structured job data extracted from raw text ──

export interface ExtractedJob {
  company_name: string;
  job_title: string;
  location: string | null;
  employment_type: string | null; // full-time, part-time, contract, internship
  remote_type: string | null; // remote, hybrid, onsite
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  experience_level: string | null; // entry, mid, senior, lead, executive
  responsibilities: string[];
  required_skills: string[];
  preferred_skills: string[];
  qualifications: string[];
  keywords: string[];
  application_url: string | null;
  visa_requirement: string | null;
  years_experience: number | null;
}

// ── Import form input ──

export interface JobImportInput {
  raw_text: string;
  company_name?: string;
  job_title?: string;
  source_url?: string;
}

// ── Scoring output ──

export interface FitScore {
  overall_score: number; // 0–100
  recommendation: "strong_apply" | "apply_with_edits" | "skip";
  strengths: string[];
  gaps: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  breakdown: {
    title_alignment: number; // 0–100
    skill_overlap: number;
    experience_overlap: number;
    education_match: number;
    keyword_relevance: number;
  };
  confidence: number; // 0–100, how much data we had to score on
  notes: string;
}

// ── Scoring thresholds (configurable) ──

export const SCORE_THRESHOLDS = {
  strong_apply: 80,
  apply_with_edits: 60,
} as const;

// ── Scoring weights ──

export const SCORE_WEIGHTS = {
  title_alignment: 0.2,
  skill_overlap: 0.35,
  experience_overlap: 0.2,
  education_match: 0.1,
  keyword_relevance: 0.15,
} as const;

// ── User profile snapshot for scoring ──

export interface UserProfileSnapshot {
  headline: string | null;
  skills: string[];
  job_titles: string[];
  years_experience: number | null;
  education: string[];
  certifications: string[];
  keywords: string[]; // aggregated from resume sections
}
