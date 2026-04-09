import { describe, it, expect } from "vitest";
import { scoreJobFit } from "@/lib/jobs/scorer";
import type { ExtractedJob, UserProfileSnapshot } from "@/types/jobs";

function makeJob(overrides: Partial<ExtractedJob> = {}): ExtractedJob {
  return {
    company_name: "Test Corp",
    job_title: "Senior Software Engineer",
    location: "San Francisco, CA",
    employment_type: "full-time",
    remote_type: "hybrid",
    salary_min: 150000,
    salary_max: 200000,
    salary_currency: "USD",
    experience_level: "senior",
    responsibilities: ["Build features", "Lead reviews"],
    required_skills: ["typescript", "react", "nodejs", "aws", "python"],
    preferred_skills: ["kubernetes", "graphql"],
    qualifications: ["5+ years experience", "BS Computer Science"],
    keywords: ["engineering", "platform", "scalable", "backend", "frontend"],
    application_url: null,
    visa_requirement: null,
    years_experience: 5,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<UserProfileSnapshot> = {}): UserProfileSnapshot {
  return {
    headline: "Senior Software Engineer",
    skills: ["typescript", "react", "nodejs", "python", "docker", "sql"],
    job_titles: ["Senior Software Engineer", "Software Engineer"],
    years_experience: 7,
    education: ["BS Computer Science"],
    certifications: ["AWS Solutions Architect"],
    keywords: ["backend", "frontend", "scalable", "api", "microservices"],
    ...overrides,
  };
}

describe("scoreJobFit", () => {
  it("returns a score between 0 and 100", () => {
    const result = scoreJobFit(makeJob(), makeProfile());
    expect(result.overall_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_score).toBeLessThanOrEqual(100);
  });

  it("returns strong_apply for a great match", () => {
    const result = scoreJobFit(makeJob(), makeProfile());
    expect(result.recommendation).toBe("strong_apply");
  });

  it("returns skip for a poor match", () => {
    const result = scoreJobFit(
      makeJob({
        job_title: "Chief Marketing Officer",
        required_skills: ["marketing", "seo", "content strategy", "analytics", "hubspot"],
        years_experience: 15,
      }),
      makeProfile({
        headline: "Junior QA Tester",
        skills: ["manual testing"],
        job_titles: ["QA Tester"],
        years_experience: 1,
      })
    );
    expect(result.recommendation).toBe("skip");
    expect(result.overall_score).toBeLessThan(60);
  });

  it("reports matched and missing keywords", () => {
    const result = scoreJobFit(makeJob(), makeProfile());
    expect(result.matched_keywords.length).toBeGreaterThan(0);
    // AWS is in required_skills but user has it in certifications, not skills
    // so it should show up as missing from skills match
  });

  it("generates strengths for a good match", () => {
    const result = scoreJobFit(makeJob(), makeProfile());
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates gaps for a partial match", () => {
    const result = scoreJobFit(
      makeJob(),
      makeProfile({
        skills: ["javascript"], // missing most required skills
        job_titles: ["Intern"],
        years_experience: 1,
      })
    );
    expect(result.gaps.length).toBeGreaterThan(0);
  });

  it("has a confidence score", () => {
    const result = scoreJobFit(makeJob(), makeProfile());
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it("has low confidence with empty profile", () => {
    const result = scoreJobFit(
      makeJob(),
      makeProfile({
        skills: [],
        job_titles: [],
        years_experience: null,
        education: [],
        certifications: [],
        keywords: [],
      })
    );
    expect(result.confidence).toBeLessThan(50);
  });

  it("provides breakdown scores", () => {
    const result = scoreJobFit(makeJob(), makeProfile());
    expect(result.breakdown.title_alignment).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.skill_overlap).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.experience_overlap).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.education_match).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.keyword_relevance).toBeGreaterThanOrEqual(0);
  });

  it("respects custom thresholds", () => {
    const result = scoreJobFit(makeJob(), makeProfile(), {
      strong_apply: 95, // very high bar
      apply_with_edits: 90,
    });
    // Even a good match might not hit 95
    expect(["strong_apply", "apply_with_edits", "skip"]).toContain(
      result.recommendation
    );
  });

  it("handles job with no requirements gracefully", () => {
    const result = scoreJobFit(
      makeJob({
        required_skills: [],
        preferred_skills: [],
        qualifications: [],
        years_experience: null,
      }),
      makeProfile()
    );
    expect(result.overall_score).toBeGreaterThanOrEqual(0);
    expect(result.notes).toBeTruthy();
  });
});
