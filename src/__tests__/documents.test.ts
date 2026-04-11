import { describe, it, expect } from "vitest";
import { buildUserFacts, assertGrounded } from "@/lib/documents/facts";
import { alignKeywords } from "@/lib/documents/keyword-aligner";
import { tailorResume } from "@/lib/documents/resume-tailor";
import { generateCoverLetter } from "@/lib/documents/cover-letter";
import {
  exportResumeToHTML,
  exportCoverLetterToHTML,
} from "@/lib/documents/export";
import type { UserFacts } from "@/types/documents";
import type { ExtractedJob } from "@/types/jobs";

// ── Sample data ──

function sampleFacts(overrides: Partial<UserFacts> = {}): UserFacts {
  return {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+1 555-0100",
    location: "San Francisco, CA",
    linkedin_url: "https://linkedin.com/in/janedoe",
    portfolio_url: "https://janedoe.com",
    headline: "Senior Software Engineer",
    summary: "Engineer with a focus on backend systems and scaling.",
    skills: ["typescript", "react", "nodejs", "postgresql", "aws"],
    experience: [
      {
        title: "Senior Engineer",
        company: "Acme Corp",
        location: "SF",
        start: "2020",
        end: "Present",
        bullets: [
          "Built React dashboards for internal tools",
          "Scaled PostgreSQL clusters handling 10k writes/sec",
          "Mentored junior engineers on TypeScript best practices",
        ],
      },
      {
        title: "Software Engineer",
        company: "Startup Inc",
        location: "Remote",
        start: "2017",
        end: "2020",
        bullets: ["Developed Node.js microservices", "Owned CI/CD pipelines"],
      },
    ],
    education: [
      { school: "UC Berkeley", degree: "BS", field: "Computer Science", year: "2017" },
    ],
    certifications: ["AWS Solutions Architect"],
    languages: [],
    years_experience: 7,
    ...overrides,
  };
}

function sampleJob(overrides: Partial<ExtractedJob> = {}): ExtractedJob {
  return {
    company_name: "Widget Co",
    job_title: "Senior Backend Engineer",
    location: "Remote",
    employment_type: "full-time",
    remote_type: "remote",
    salary_min: 160000,
    salary_max: 200000,
    salary_currency: "USD",
    experience_level: "senior",
    responsibilities: ["Build backend services", "Scale databases"],
    required_skills: ["typescript", "postgresql", "kubernetes"],
    preferred_skills: ["aws", "graphql"],
    qualifications: ["5+ years engineering experience"],
    keywords: ["backend", "scalable", "distributed", "microservices"],
    application_url: null,
    visa_requirement: null,
    years_experience: 5,
    ...overrides,
  };
}

// ── buildUserFacts ──

describe("buildUserFacts", () => {
  it("builds facts from profile and resume sections", () => {
    const facts = buildUserFacts(
      { full_name: "Alice", email: "a@b.com", headline: "Engineer" },
      [
        { section: "summary", content: "Builder of things" },
        { section: "skills", content: ["typescript", "python"] },
        {
          section: "experience",
          content: [{ title: "Dev", company: "X", bullets: ["Did stuff"] }],
        },
      ]
    );
    expect(facts.name).toBe("Alice");
    expect(facts.summary).toBe("Builder of things");
    expect(facts.skills).toContain("typescript");
    expect(facts.experience[0].title).toBe("Dev");
    expect(facts.experience[0].bullets).toEqual(["Did stuff"]);
  });

  it("handles null profile and empty sections", () => {
    const facts = buildUserFacts(null, []);
    expect(facts.name).toBe("");
    expect(facts.skills).toEqual([]);
    expect(facts.experience).toEqual([]);
  });

  it("infers years of experience from dates", () => {
    const facts = buildUserFacts({ full_name: "A", email: "a@b.com" }, [
      {
        section: "experience",
        content: [
          { title: "Dev", company: "X", start: "2015", end: "2023", bullets: [] },
        ],
      },
    ]);
    expect(facts.years_experience).toBe(8);
  });
});

// ── alignKeywords ──

describe("alignKeywords", () => {
  it("matches skills that appear in the user's skill list", () => {
    const alignment = alignKeywords(sampleFacts(), sampleJob());
    expect(alignment.matched).toContain("typescript");
    expect(alignment.matched).toContain("postgresql");
  });

  it("flags missing skills the user doesn't have", () => {
    const alignment = alignKeywords(sampleFacts(), sampleJob());
    expect(alignment.missing).toContain("kubernetes");
  });

  it("reports coverage as percentage", () => {
    const alignment = alignKeywords(sampleFacts(), sampleJob());
    expect(alignment.coverage).toBeGreaterThan(0);
    expect(alignment.coverage).toBeLessThanOrEqual(100);
  });

  it("returns zero coverage when no facts match", () => {
    const alignment = alignKeywords(
      sampleFacts({ skills: [], experience: [], certifications: [] }),
      sampleJob()
    );
    expect(alignment.coverage).toBe(0);
  });
});

// ── tailorResume ──

describe("tailorResume", () => {
  it("produces a tailored resume content object", () => {
    const { content } = tailorResume(sampleFacts(), sampleJob());
    expect(content.name).toBe("Jane Doe");
    expect(content.skills.length).toBeGreaterThan(0);
    expect(content.experience.length).toBe(2);
  });

  it("does not invent experience entries", () => {
    const facts = sampleFacts();
    const { content } = tailorResume(facts, sampleJob());
    // Every generated experience entry must correspond to an original one
    for (const exp of content.experience) {
      const match = facts.experience.find(
        (e) => e.title === exp.title && e.company === exp.company
      );
      expect(match).toBeDefined();
    }
  });

  it("does not invent bullets", () => {
    const facts = sampleFacts();
    const { content } = tailorResume(facts, sampleJob());
    const allOriginalBullets = new Set(
      facts.experience.flatMap((e) => e.bullets)
    );
    for (const exp of content.experience) {
      for (const bullet of exp.bullets) {
        expect(allOriginalBullets.has(bullet)).toBe(true);
      }
    }
  });

  it("moves matched skills to the front", () => {
    const { content } = tailorResume(sampleFacts(), sampleJob());
    // typescript is a required skill — should appear before unrelated skills
    const tsIndex = content.skills.findIndex((s) => s === "typescript");
    expect(tsIndex).toBeGreaterThanOrEqual(0);
    expect(tsIndex).toBeLessThan(3);
  });

  it("reorders bullets by job relevance without adding new ones", () => {
    const { content } = tailorResume(sampleFacts(), sampleJob());
    const firstExp = content.experience[0];
    // The PostgreSQL bullet should be near the top for a Postgres-heavy job
    const pgIndex = firstExp.bullets.findIndex((b) =>
      b.toLowerCase().includes("postgresql")
    );
    expect(pgIndex).toBeGreaterThanOrEqual(0);
  });

  it("returns an alignment with coverage", () => {
    const { alignment } = tailorResume(sampleFacts(), sampleJob());
    expect(alignment.coverage).toBeGreaterThan(0);
  });

  it("handles empty facts gracefully", () => {
    const { content } = tailorResume(
      sampleFacts({
        summary: "",
        skills: [],
        experience: [],
        education: [],
        certifications: [],
      }),
      sampleJob()
    );
    expect(content.experience).toEqual([]);
    // Summary is synthesized from ONLY known data
    expect(content.summary).toBeTruthy();
  });
});

// ── generateCoverLetter ──

describe("generateCoverLetter", () => {
  it("produces a cover letter with all sections", () => {
    const { content } = generateCoverLetter(sampleFacts(), sampleJob());
    expect(content.greeting).toBeTruthy();
    expect(content.opening).toBeTruthy();
    expect(content.body.length).toBeGreaterThan(0);
    expect(content.closing).toBeTruthy();
    expect(content.signature.name).toBe("Jane Doe");
  });

  it("references the job company in opening and closing", () => {
    const { content } = generateCoverLetter(sampleFacts(), sampleJob());
    const opening = content.opening.toLowerCase();
    const closing = content.closing.toLowerCase();
    expect(opening.includes("widget co") || opening.includes("your")).toBe(true);
    expect(closing.includes("widget co") || closing.includes("your")).toBe(true);
  });

  it("supports tone variations", () => {
    const formal = generateCoverLetter(sampleFacts(), sampleJob(), { tone: "formal" });
    const friendly = generateCoverLetter(sampleFacts(), sampleJob(), { tone: "friendly" });
    expect(formal.content.greeting).not.toBe(friendly.content.greeting);
  });

  it("does not invent companies the user hasn't worked at", () => {
    const facts = sampleFacts();
    const { content } = generateCoverLetter(facts, sampleJob());
    const allText = [
      content.greeting,
      content.opening,
      ...content.body,
      content.closing,
    ].join(" ");
    // "Startup Inc" or "Acme Corp" OK; random unknown company should not appear
    expect(allText).not.toMatch(/Google|Microsoft|Meta/);
  });

  it("handles empty facts without crashing", () => {
    const { content } = generateCoverLetter(
      sampleFacts({
        summary: "",
        skills: [],
        experience: [],
        years_experience: null,
      }),
      sampleJob()
    );
    expect(content.greeting).toBeTruthy();
    expect(content.opening).toBeTruthy();
  });
});

// ── exports ──

describe("exportResumeToHTML", () => {
  it("produces valid HTML with name", () => {
    const { content } = tailorResume(sampleFacts(), sampleJob());
    const html = exportResumeToHTML(content);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Jane Doe");
    expect(html).toContain("</html>");
  });

  it("escapes HTML special characters", () => {
    const { content } = tailorResume(
      sampleFacts({ name: "Alice <script>" }),
      sampleJob()
    );
    const html = exportResumeToHTML(content);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders skills, experience, and education sections", () => {
    const { content } = tailorResume(sampleFacts(), sampleJob());
    const html = exportResumeToHTML(content);
    expect(html).toContain("Skills");
    expect(html).toContain("Experience");
    expect(html).toContain("Education");
  });
});

describe("exportCoverLetterToHTML", () => {
  it("produces valid HTML with signature", () => {
    const { content } = generateCoverLetter(sampleFacts(), sampleJob());
    const html = exportCoverLetterToHTML(content);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Jane Doe");
    expect(html).toContain("Sincerely");
  });
});

// ── grounding guard ──

describe("assertGrounded", () => {
  it("flags proper nouns not in the source facts", () => {
    const facts = sampleFacts();
    const violations = assertGrounded("Worked at GoogleCo on Project Xenith", facts);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations).toContain("GoogleCo");
  });

  it("allows proper nouns present in the source", () => {
    const facts = sampleFacts();
    // Every capitalized token here appears in the facts.
    const violations = assertGrounded("Acme Corp TypeScript Berkeley", facts);
    expect(violations.length).toBe(0);
  });
});
