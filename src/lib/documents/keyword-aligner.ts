// Keyword alignment: compares job keywords against user facts.
// Returns what's matched, what's addressable (user has it but not highlighted),
// and what's genuinely missing.

import type { UserFacts, KeywordAlignment } from "@/types/documents";
import type { ExtractedJob } from "@/types/jobs";
import { normalize } from "@/lib/jobs/normalizer";

/** Collect all text from user facts for matching. */
function collectFactText(facts: UserFacts): string {
  return [
    facts.headline,
    facts.summary,
    ...facts.skills,
    ...facts.certifications,
    ...facts.experience.flatMap((e) => [
      e.title,
      e.company,
      ...e.bullets,
    ]),
    ...facts.education.flatMap((e) => [e.school, e.degree, e.field]),
  ]
    .map((s) => normalize(String(s || "")))
    .join(" ");
}

/** Collect the user's skill set (normalized). */
function factSkillSet(facts: UserFacts): Set<string> {
  return new Set(facts.skills.map((s) => normalize(s)));
}

/**
 * Compare job requirements to user facts.
 *
 * - matched: keywords present in the user's explicit skills list
 * - addressable: keywords present anywhere in facts but NOT in skills list
 *   (the user has them, they're just not highlighted)
 * - missing: keywords absent from all user facts
 */
export function alignKeywords(
  facts: UserFacts,
  job: ExtractedJob
): KeywordAlignment {
  const allKeywords = [
    ...job.required_skills,
    ...job.preferred_skills,
  ];
  const uniqueKeywords = [...new Set(allKeywords.map((k) => normalize(k)))];

  const skillSet = factSkillSet(facts);
  const factText = collectFactText(facts);

  const matched: string[] = [];
  const addressable: string[] = [];
  const missing: string[] = [];

  for (const kw of uniqueKeywords) {
    if (!kw) continue;

    // Matched: present in user's explicit skill list (substring match)
    let inSkills = false;
    for (const s of skillSet) {
      if (s.includes(kw) || kw.includes(s)) {
        inSkills = true;
        break;
      }
    }

    if (inSkills) {
      matched.push(kw);
    } else if (factText.includes(kw)) {
      addressable.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const total = uniqueKeywords.length || 1;
  const covered = matched.length + addressable.length;
  const coverage = Math.round((covered / total) * 100);

  return { matched, addressable, missing, coverage };
}
