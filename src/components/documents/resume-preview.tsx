// ATS-friendly resume preview.
// Semantic HTML only — no icons, no images, no columns.

import type { TailoredResumeContent } from "@/types/documents";

interface Props {
  content: TailoredResumeContent;
}

export function ResumePreview({ content }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-8 py-10 text-gray-900 font-sans text-sm leading-relaxed">
      {/* Header */}
      <header className="mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold">{content.name || "Your Name"}</h1>
        {content.headline && (
          <p className="text-base text-gray-700 mt-1">{content.headline}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
          {content.contact.email && <span>{content.contact.email}</span>}
          {content.contact.phone && <span>{content.contact.phone}</span>}
          {content.contact.location && <span>{content.contact.location}</span>}
          {content.contact.linkedin_url && <span>{content.contact.linkedin_url}</span>}
          {content.contact.portfolio_url && <span>{content.contact.portfolio_url}</span>}
        </div>
      </header>

      {/* Summary */}
      {content.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Summary
          </h2>
          <p className="text-sm">{content.summary}</p>
        </section>
      )}

      {/* Skills */}
      {content.skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Skills
          </h2>
          <p className="text-sm">{content.skills.join(" · ")}</p>
        </section>
      )}

      {/* Experience */}
      {content.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Experience
          </h2>
          <div className="space-y-4">
            {content.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="font-semibold">{exp.title}</span>
                    {exp.company && <span> · {exp.company}</span>}
                  </div>
                  <div className="text-xs text-gray-600 shrink-0 ml-2">
                    {exp.start}
                    {exp.start && exp.end && " – "}
                    {exp.end}
                  </div>
                </div>
                {exp.location && (
                  <p className="text-xs text-gray-600">{exp.location}</p>
                )}
                {exp.bullets.length > 0 && (
                  <ul className="mt-1 ml-4 list-disc space-y-0.5 text-sm">
                    {exp.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {content.education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Education
          </h2>
          <div className="space-y-2">
            {content.education.map((ed, i) => (
              <div key={i} className="flex items-baseline justify-between">
                <div>
                  <span className="font-semibold">{ed.school}</span>
                  {ed.degree && <span> — {ed.degree}</span>}
                  {ed.field && <span>, {ed.field}</span>}
                </div>
                {ed.year && <span className="text-xs text-gray-600">{ed.year}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {content.certifications.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Certifications
          </h2>
          <p className="text-sm">{content.certifications.join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
