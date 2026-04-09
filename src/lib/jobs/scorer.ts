// Fit scoring engine.
// Compares extracted job data against user profile/resume.
// Deterministic, explainable, no hallucination.

import type {
  ExtractedJob,
  FitScore,
  UserProfileSnapshot,
} from "@/types/jobs";
import { SCORE_THRESHOLDS, SCORE_WEIGHTS } from "@/types/jobs";
import { normalize } from "./normalizer";

/** Jaccard-like overlap between two string arrays. */
function overlapScore(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  if (b.length === 0) return 0; // nothing required = no signal

  const setA = new Set(a.map(normalize));
  const setB = new Set(b.map(normalize));
  let matches = 0;
  for (const item of setB) {
    // Check if any item in A contains or is contained by item in B
    for (const aItem of setA) {
      if (aItem.includes(item) || item.includes(aItem)) {
        matches++;
        break;
      }
    }
  }
  return Math.round((matches / setB.size) * 100);
}

/** Find matched and missing items between user skills and job skills. */
function findMatches(
  userItems: string[],
  jobItems: string[]
): { matched: string[]; missing: string[] } {
  const userSet = new Set(userItems.map(normalize));
  const matched: string[] = [];
  const missing: string[] = [];

  for (const item of jobItems) {
    const norm = normalize(item);
    let found = false;
    for (const uItem of userSet) {
      if (uItem.includes(norm) || norm.includes(uItem)) {
        matched.push(item);
        found = true;
        break;
      }
    }
    if (!found) missing.push(item);
  }

  return { matched, missing };
}

/** Score title alignment between user's titles and the job title. */
function scoreTitleAlignment(
  userTitles: string[],
  jobTitle: string
): number {
  if (!jobTitle) return 50; // no title = neutral
  const normJob = normalize(jobTitle);
  const jobWords = normJob.split(/\s+/);

  let bestScore = 0;
  for (const ut of userTitles) {
    const normUser = normalize(ut);

    // Exact match
    if (normUser === normJob) return 100;

    // Word overlap
    const userWords = normUser.split(/\s+/);
    const common = userWords.filter((w) => jobWords.includes(w));
    const score = Math.round(
      (common.length / Math.max(jobWords.length, 1)) * 100
    );
    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
}

/** Score experience level alignment. */
function scoreExperience(
  userYears: number | null,
  jobYears: number | null
): number {
  if (jobYears === null) return 70; // no requirement stated = slightly positive
  if (userYears === null) return 40; // can't confirm = low confidence

  if (userYears >= jobYears) return 100;
  if (userYears >= jobYears - 1) return 80; // close enough
  if (userYears >= jobYears - 2) return 60;
  return Math.max(20, 100 - (jobYears - userYears) * 15);
}

/** Score education/certification match. */
function scoreEducation(
  userEd: string[],
  jobQualifications: string[]
): number {
  if (jobQualifications.length === 0) return 70; // nothing specified
  if (userEd.length === 0) return 30; // we have no data

  return overlapScore(userEd, jobQualifications);
}

/** Generate human-readable strength/gap descriptions. */
function generateInsights(
  breakdown: FitScore["breakdown"],
  matched: string[],
  missing: string[],
  job: ExtractedJob,
  profile: UserProfileSnapshot
): { strengths: string[]; gaps: string[]; notes: string } {
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (breakdown.title_alignment >= 80)
    strengths.push("Strong title alignment with your experience");
  else if (breakdown.title_alignment < 50)
    gaps.push("Job title doesn't closely match your background");

  if (breakdown.skill_overlap >= 80)
    strengths.push(`You match ${matched.length} of the required skills`);
  else if (breakdown.skill_overlap < 50)
    gaps.push(`Missing ${missing.length} required skills: ${missing.slice(0, 5).join(", ")}`);

  if (breakdown.experience_overlap >= 80)
    strengths.push("Your experience level is a strong fit");
  else if (breakdown.experience_overlap < 50 && job.years_experience)
    gaps.push(`Role asks for ${job.years_experience}+ years of experience`);

  if (matched.length > 0)
    strengths.push(`Key skill matches: ${matched.slice(0, 5).join(", ")}`);

  if (job.preferred_skills.length > 0) {
    const prefMatched = findMatches(profile.skills, job.preferred_skills).matched;
    if (prefMatched.length > 0)
      strengths.push(`Also match preferred skills: ${prefMatched.slice(0, 3).join(", ")}`);
  }

  const notes =
    strengths.length === 0 && gaps.length === 0
      ? "Limited data available for scoring. Upload your resume and complete your profile for better results."
      : `Scored based on ${profile.skills.length} known skills and ${profile.job_titles.length} job titles from your profile.`;

  return { strengths, gaps, notes };
}

/**
 * Score how well a job fits the user's profile.
 *
 * Returns an explainable FitScore with breakdown, strengths, gaps,
 * matched/missing keywords, and a recommendation.
 */
export function scoreJobFit(
  job: ExtractedJob,
  profile: UserProfileSnapshot,
  thresholds: { strong_apply: number; apply_with_edits: number } = SCORE_THRESHOLDS,
  weights: Record<string, number> = SCORE_WEIGHTS
): FitScore {
  // Calculate each dimension
  const title_alignment = scoreTitleAlignment(
    profile.job_titles,
    job.job_title
  );

  const allJobSkills = [...job.required_skills, ...job.preferred_skills];
  const skill_overlap = overlapScore(profile.skills, job.required_skills);

  const experience_overlap = scoreExperience(
    profile.years_experience,
    job.years_experience
  );

  const education_match = scoreEducation(
    [...profile.education, ...profile.certifications],
    job.qualifications
  );

  const keyword_relevance = overlapScore(profile.keywords, job.keywords.slice(0, 20));

  const breakdown = {
    title_alignment,
    skill_overlap,
    experience_overlap,
    education_match,
    keyword_relevance,
  };

  // Weighted overall score
  const overall_score = Math.round(
    title_alignment * weights.title_alignment +
    skill_overlap * weights.skill_overlap +
    experience_overlap * weights.experience_overlap +
    education_match * weights.education_match +
    keyword_relevance * weights.keyword_relevance
  );

  // Recommendation
  let recommendation: FitScore["recommendation"];
  if (overall_score >= thresholds.strong_apply) recommendation = "strong_apply";
  else if (overall_score >= thresholds.apply_with_edits)
    recommendation = "apply_with_edits";
  else recommendation = "skip";

  // Matched/missing keywords
  const { matched: matched_keywords, missing: missing_keywords } = findMatches(
    profile.skills,
    allJobSkills
  );

  // Confidence = how much data we actually have
  let confidence = 20;
  if (profile.skills.length > 0) confidence += 25;
  if (profile.job_titles.length > 0) confidence += 20;
  if (profile.years_experience !== null) confidence += 15;
  if (profile.education.length > 0) confidence += 10;
  if (job.required_skills.length > 0) confidence += 10;
  confidence = Math.min(confidence, 100);

  const { strengths, gaps, notes } = generateInsights(
    breakdown,
    matched_keywords,
    missing_keywords,
    job,
    profile
  );

  return {
    overall_score,
    recommendation,
    strengths,
    gaps,
    matched_keywords,
    missing_keywords,
    breakdown,
    confidence,
    notes,
  };
}
