// HTML export for tailored documents.
// ATS-safe: semantic HTML, no images, no columns, no fancy CSS.
// This structure is compatible with any HTML-to-PDF converter.

import type {
  TailoredResumeContent,
  CoverLetterContent,
} from "@/types/documents";

/** Escape HTML special characters. */
function escape(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Shared print-friendly base stylesheet (inline, no external assets). */
const BASE_STYLES = `
  body {
    font-family: -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    color: #111827;
    line-height: 1.5;
    max-width: 720px;
    margin: 2rem auto;
    padding: 0 1.5rem;
    font-size: 14px;
  }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 4px;
    margin: 18px 0 8px;
  }
  h3 { font-size: 14px; margin: 0; }
  p { margin: 4px 0; }
  ul { margin: 4px 0 8px 1.2em; padding: 0; }
  li { margin: 2px 0; }
  .contact { color: #4b5563; font-size: 12px; margin-top: 4px; }
  .contact span { margin-right: 12px; }
  .entry { margin-bottom: 10px; }
  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .dates { color: #6b7280; font-size: 12px; }
  .loc { color: #6b7280; font-size: 12px; }
  @media print {
    body { margin: 0.5in; max-width: none; }
  }
`;

/** Export a tailored resume to standalone ATS-friendly HTML. */
export function exportResumeToHTML(content: TailoredResumeContent): string {
  const contact = [
    content.contact.email,
    content.contact.phone,
    content.contact.location,
    content.contact.linkedin_url,
    content.contact.portfolio_url,
  ]
    .filter(Boolean)
    .map((c) => `<span>${escape(c)}</span>`)
    .join("");

  const summarySection = content.summary
    ? `<section><h2>Summary</h2><p>${escape(content.summary)}</p></section>`
    : "";

  const skillsSection =
    content.skills.length > 0
      ? `<section><h2>Skills</h2><p>${content.skills
          .map(escape)
          .join(" · ")}</p></section>`
      : "";

  const experienceSection =
    content.experience.length > 0
      ? `<section><h2>Experience</h2>${content.experience
          .map(
            (exp) => `
        <div class="entry">
          <div class="entry-header">
            <h3>${escape(exp.title)}${
              exp.company ? ` · ${escape(exp.company)}` : ""
            }</h3>
            <span class="dates">${escape(exp.start)}${
              exp.start && exp.end ? " – " : ""
            }${escape(exp.end)}</span>
          </div>
          ${exp.location ? `<p class="loc">${escape(exp.location)}</p>` : ""}
          ${
            exp.bullets.length > 0
              ? `<ul>${exp.bullets
                  .map((b) => `<li>${escape(b)}</li>`)
                  .join("")}</ul>`
              : ""
          }
        </div>`
          )
          .join("")}</section>`
      : "";

  const educationSection =
    content.education.length > 0
      ? `<section><h2>Education</h2>${content.education
          .map(
            (ed) => `
        <div class="entry">
          <div class="entry-header">
            <h3>${escape(ed.school)}${
              ed.degree ? ` — ${escape(ed.degree)}` : ""
            }${ed.field ? `, ${escape(ed.field)}` : ""}</h3>
            ${ed.year ? `<span class="dates">${escape(ed.year)}</span>` : ""}
          </div>
        </div>`
          )
          .join("")}</section>`
      : "";

  const certsSection =
    content.certifications.length > 0
      ? `<section><h2>Certifications</h2><p>${content.certifications
          .map(escape)
          .join(" · ")}</p></section>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escape(content.name || "Resume")}</title>
<style>${BASE_STYLES}</style>
</head>
<body>
  <header>
    <h1>${escape(content.name || "Your Name")}</h1>
    ${content.headline ? `<p>${escape(content.headline)}</p>` : ""}
    <div class="contact">${contact}</div>
  </header>
  ${summarySection}
  ${skillsSection}
  ${experienceSection}
  ${educationSection}
  ${certsSection}
</body>
</html>`;
}

/** Export a cover letter to standalone ATS-friendly HTML. */
export function exportCoverLetterToHTML(content: CoverLetterContent): string {
  const sigBlock = [
    content.signature.name && `<p><strong>${escape(content.signature.name)}</strong></p>`,
    content.signature.email && `<p>${escape(content.signature.email)}</p>`,
    content.signature.phone && `<p>${escape(content.signature.phone)}</p>`,
  ]
    .filter(Boolean)
    .join("");

  const paragraphs = content.body
    .map((p) => `<p>${escape(p)}</p>`)
    .join("");

  const today = new Date().toLocaleDateString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Cover Letter — ${escape(content.recipient.company || "")}</title>
<style>${BASE_STYLES}</style>
</head>
<body>
  <header>
    ${sigBlock}
    <p style="margin-top:16px;">${escape(today)}</p>
    ${
      content.recipient.company
        ? `<p><strong>${escape(content.recipient.company)}</strong></p>`
        : ""
    }
    ${
      content.recipient.role
        ? `<p>Re: ${escape(content.recipient.role)}</p>`
        : ""
    }
  </header>
  <p>${escape(content.greeting)}</p>
  <p>${escape(content.opening)}</p>
  ${paragraphs}
  <p>${escape(content.closing)}</p>
  <p style="margin-top:16px;">Sincerely,<br />${escape(content.signature.name)}</p>
</body>
</html>`;
}
