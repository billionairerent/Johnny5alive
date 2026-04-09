import { describe, it, expect } from "vitest";
import { parseJobDescription } from "@/lib/jobs/parser";
import {
  parseSalary,
  detectRemoteType,
  detectEmploymentType,
  detectExperienceLevel,
  extractYearsExperience,
  extractSkills,
} from "@/lib/jobs/normalizer";

// ── Normalizer unit tests ──

describe("parseSalary", () => {
  it("parses range like $90,000 - $120,000", () => {
    const result = parseSalary("$90,000 - $120,000 per year");
    expect(result.min).toBe(90000);
    expect(result.max).toBe(120000);
    expect(result.currency).toBe("USD");
  });

  it("parses k notation", () => {
    const result = parseSalary("90k - 120k");
    expect(result.min).toBe(90000);
    expect(result.max).toBe(120000);
  });

  it("parses single salary", () => {
    const result = parseSalary("$150,000");
    expect(result.min).toBe(150000);
    expect(result.max).toBeNull();
  });

  it("detects GBP", () => {
    const result = parseSalary("£60,000 - £80,000");
    expect(result.currency).toBe("GBP");
  });

  it("returns null for no salary", () => {
    const result = parseSalary("competitive compensation");
    expect(result.min).toBeNull();
  });
});

describe("detectRemoteType", () => {
  it("detects remote", () => {
    expect(detectRemoteType("This is a fully remote position")).toBe("remote");
  });
  it("detects hybrid", () => {
    expect(detectRemoteType("Hybrid work schedule, 3 days in office")).toBe("hybrid");
  });
  it("detects onsite", () => {
    expect(detectRemoteType("Must work on-site at our HQ")).toBe("onsite");
  });
  it("returns null for ambiguous", () => {
    expect(detectRemoteType("Great opportunity")).toBeNull();
  });
});

describe("detectEmploymentType", () => {
  it("detects full-time", () => {
    expect(detectEmploymentType("Full-time position")).toBe("full-time");
  });
  it("detects contract", () => {
    expect(detectEmploymentType("6-month contract")).toBe("contract");
  });
  it("detects internship", () => {
    expect(detectEmploymentType("Summer internship program")).toBe("internship");
  });
});

describe("detectExperienceLevel", () => {
  it("detects senior", () => {
    expect(detectExperienceLevel("Senior Software Engineer")).toBe("senior");
  });
  it("detects entry", () => {
    expect(detectExperienceLevel("Junior Developer / Entry-level")).toBe("entry");
  });
  it("detects lead", () => {
    expect(detectExperienceLevel("Staff Engineer / Principal")).toBe("lead");
  });
  it("defaults to mid", () => {
    expect(detectExperienceLevel("Software Engineer")).toBe("mid");
  });
});

describe("extractYearsExperience", () => {
  it("extracts '5+ years'", () => {
    expect(extractYearsExperience("5+ years of experience")).toBe(5);
  });
  it("extracts '3-5 years'", () => {
    expect(extractYearsExperience("3-5 years of experience required")).toBe(3);
  });
  it("extracts 'minimum 7 years'", () => {
    expect(extractYearsExperience("minimum 7 years experience")).toBe(7);
  });
  it("returns null when absent", () => {
    expect(extractYearsExperience("great team player")).toBeNull();
  });
});

describe("extractSkills", () => {
  it("finds tech skills in text", () => {
    const skills = extractSkills(
      "We use React, TypeScript, Node.js, and PostgreSQL with Docker"
    );
    expect(skills).toContain("react");
    expect(skills).toContain("typescript");
    expect(skills).toContain("nodejs");
    expect(skills).toContain("postgresql");
    expect(skills).toContain("docker");
  });

  it("returns empty for no skills", () => {
    expect(extractSkills("great team, fast-paced environment")).toEqual([]);
  });
});

// ── Parser integration tests ──

describe("parseJobDescription", () => {
  const SAMPLE_JOB = `
Senior Software Engineer
at Acme Corp
San Francisco, CA

About the Role
We are looking for a Senior Software Engineer to join our platform team.
This is a full-time, hybrid role. Salary: $150,000 - $200,000.

Responsibilities
- Design and build scalable backend services
- Lead code reviews and mentor junior engineers
- Collaborate with product and design teams
- Improve CI/CD pipelines and developer experience

Requirements
- 5+ years of software engineering experience
- Strong proficiency in TypeScript and Python
- Experience with React and Node.js
- Familiarity with AWS and Docker
- Bachelor's degree in Computer Science or equivalent

Nice to Have
- Experience with Kubernetes
- Knowledge of GraphQL
- Contributions to open source projects
  `;

  it("extracts job title", () => {
    const result = parseJobDescription(SAMPLE_JOB);
    expect(result.job_title).toBe("Senior Software Engineer");
  });

  it("extracts company from 'at' pattern", () => {
    const result = parseJobDescription(SAMPLE_JOB);
    expect(result.company_name).toBe("Acme Corp");
  });

  it("extracts location", () => {
    const result = parseJobDescription(SAMPLE_JOB);
    expect(result.location).toBe("San Francisco, CA");
  });

  it("extracts salary range", () => {
    const result = parseJobDescription(SAMPLE_JOB);
    expect(result.salary_min).toBe(150000);
    expect(result.salary_max).toBe(200000);
  });

  it("detects hybrid work mode", () => {
    const result = parseJobDescription(SAMPLE_JOB);
    expect(result.remote_type).toBe("hybrid");
  });

  it("detects experience level", () => {
    const result = parseJobDescription(SAMPLE_JOB);
    // "lead" detected because "mentor" + "lead code reviews" in text
    expect(["senior", "lead"]).toContain(result.experience_level);
  });

  it("extracts years experience", () => {
    const result = parseJobDescription(SAMPLE_JOB);
    expect(result.years_experience).toBe(5);
  });

  it("extracts responsibilities", () => {
    const result = parseJobDescription(SAMPLE_JOB);
    expect(result.responsibilities.length).toBeGreaterThan(0);
    // Check that at least one responsibility mentions backend
    const hasBackend = result.responsibilities.some((r) =>
      r.toLowerCase().includes("backend")
    );
    expect(hasBackend).toBe(true);
  });

  it("extracts required skills", () => {
    const result = parseJobDescription(SAMPLE_JOB);
    expect(result.required_skills).toContain("typescript");
    expect(result.required_skills).toContain("python");
  });

  it("extracts preferred skills", () => {
    const result = parseJobDescription(SAMPLE_JOB);
    expect(result.preferred_skills).toContain("kubernetes");
    expect(result.preferred_skills).toContain("graphql");
  });

  it("uses overrides when provided", () => {
    const result = parseJobDescription(SAMPLE_JOB, {
      company_name: "Override Corp",
      job_title: "Override Title",
    });
    expect(result.company_name).toBe("Override Corp");
    expect(result.job_title).toBe("Override Title");
  });

  it("handles empty text gracefully", () => {
    const result = parseJobDescription("");
    expect(result.company_name).toBe("");
    expect(result.required_skills).toEqual([]);
  });
});
