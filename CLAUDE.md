# AutoApplyAI — Master Project Instructions

You are the lead architect and implementation agent for a production-grade application called AutoApplyAI.

## MISSION

Build a full-stack, responsive, reliable job-application automation platform that helps a user:
1. find relevant jobs,
2. score them against their background,
3. tailor resumes and cover letters,
4. track every application,
5. automate form filling where appropriate,
6. keep a human-in-the-loop for risky or ambiguous steps,
7. maximize interviews while minimizing bad applications.

The product must be practical, real, maintainable, and built for actual use — not just a mockup.

## CORE PRODUCT NAME

AutoApplyAI

## PRIMARY GOAL

Create a working MVP first, then structure the codebase so it can scale into a SaaS.

## NON-NEGOTIABLE PRODUCT PRINCIPLES

- ATS-friendly outputs always come first.
- Never invent user experience or qualifications.
- Never falsify answers on job applications.
- Human review must be available before final submission on uncertain questions.
- Prefer robust semi-automation over brittle "fake full automation."
- Build for reliability, observability, and maintainability.
- The UX should feel premium, simple, and fast.
- Every key workflow should be traceable in logs and in the database.

## TARGET USER

A job seeker who wants help with repeated application tasks, resume tailoring, and tracking.
Also design the architecture so this can later be sold as a service or SaaS.

## MVP FEATURES

### 1. Authentication
- Email/password auth
- Secure session handling
- User profile

### 2. Job Search Intake
- User enters: desired titles, location, remote/hybrid/on-site preference, salary preferences, industries, target companies, exclude keywords
- Save search preferences

### 3. Resume Vault
- Upload master resume
- Store multiple resume versions
- Parse resume into structured fields: summary, work experience, education, skills, certifications, links
- Allow manual editing after parsing

### 4. Job Import Pipeline
Support import from: pasted job description, job URL, manual entry.
Later architect for: Greenhouse, Lever, Ashby, Workday, LinkedIn Easy Apply-style flows where legally and technically appropriate.

### 5. Fit Scoring Engine
For every job:
- compare job requirements against user profile
- output: fit score 0–100, strengths, gaps, likely interview angle, risk flags
- scoring should be explainable, not black box only

### 6. Resume Tailoring Engine
Generate ATS-safe tailored resume content using the master resume as source truth.
Rules: no fake experience, no fake employers, no fake dates, no fake metrics. Only reframe, reorder, emphasize, compress, and adapt real experience.
Output: revised summary, revised skill stack, revised bullets for relevant roles, keyword alignment notes, PDF-ready and DOC/HTML-ready output structure.

### 7. Cover Letter Generator
Generate: short note, standard cover letter, optional recruiter intro email.
All must stay grounded in user facts and the job description.

### 8. Application Tracker
Track: company, job title, source, job URL, date found, date applied, status, fit score, resume version used, cover letter version used, notes, follow-up date, compensation range if known.

### 9. Automation Layer
Use browser automation carefully via Playwright.
Capabilities: navigate job pages, fill repeated fields, upload documents, save draft applications where possible.
Stop and request user review when: a custom question requires judgment, captcha appears, legal/authorization questions are unclear, compensation expectations are requested and no rule exists, the site presents anti-bot friction.
Never build the system to evade security controls or bypass anti-bot protections.

### 10. Dashboard
Show: jobs imported, jobs scored, applications sent, response rate, interviews, top resume variants, jobs needing review, jobs waiting for follow-up.

### 11. Admin/Debug Logging
Robust logging for: imports, scoring, resume generation, browser actions, submit attempts, failures, user overrides.

## RECOMMENDED STACK

- Frontend: Next.js
- UI: clean modern component system (Tailwind CSS)
- Backend: Next.js server actions or API routes
- Database: Supabase Postgres
- Auth: Supabase Auth
- Storage: Supabase Storage for resumes and generated documents
- Browser automation: Playwright
- AI layer: Claude API
- PDF generation: robust ATS-safe HTML-to-PDF pipeline
- Background jobs: queue-friendly architecture

## DESIGN DIRECTION

The app should feel: clean, modern, high-trust, focused, intelligent, not cluttered, not gimmicky.
Style references: premium SaaS, career tool for serious professionals, clear typography, strong hierarchy, calm confidence.

## KEY USER FLOWS

### FLOW A: New User Onboarding
1. Sign up → 2. Complete profile → 3. Upload master resume → 4. Parse and review resume → 5. Set job preferences → 6. Land on dashboard

### FLOW B: Import and Score Job
1. User pastes job description or URL → 2. System extracts structured job data → 3. System calculates fit score → 4. System displays score, strengths, gaps, recommendation (strong apply / apply with edits / skip)

### FLOW C: Tailor Resume + Generate Letter
1. User selects job → 2. System generates tailored resume → 3. User reviews changes → 4. System generates cover letter → 5. User exports docs or proceeds to assisted apply

### FLOW D: Assisted Apply
1. User launches assisted apply → 2. Playwright navigates target application → 3. System fills repeated known fields → 4. System pauses on custom questions → 5. User confirms → 6. System submits or saves draft → 7. Tracker updates automatically

### FLOW E: Follow-up Management
1. System identifies stale applications → 2. Suggest follow-up timing → 3. Generate follow-up email drafts

## DATABASE SCHEMA

Tables: users, profiles, resumes, resume_versions, parsed_resume_sections, job_search_preferences, jobs, job_imports, job_scores, tailored_documents, cover_letters, applications, application_events, follow_ups, automation_runs, automation_steps, logs.

Each table has: clear primary keys, created_at/updated_at, appropriate foreign keys, indexes for common query patterns.

## AI BEHAVIOR RULES

- Stay faithful to source materials
- Explain why a job scored the way it did
- Tailor for keywords without dishonesty
- Identify missing information instead of making it up
- Default to concise, useful outputs
- Support structured JSON outputs internally where helpful

## BROWSER AUTOMATION RULES

Build as modular adapters: adapter_greenhouse, adapter_lever, adapter_ashby, adapter_workday, adapter_generic.
Each adapter: detect page patterns, map fields, fill known values, surface unknowns for user review, log every action, fail gracefully.
Prefer: label-based targeting, role-based targeting, fallback selector strategies, screenshots on failure, retry logic with limits.

## SECURITY AND PRIVACY

- Secure auth with row-level security
- Encrypted secrets handling
- Careful file access controls
- Auditability for important actions

## DELIVERABLE PHASES

- [x] **PHASE 1 — FOUNDATION**: repo init, auth, database schema, resume upload + parsing, dashboard shell
- [ ] **PHASE 2 — JOB INTELLIGENCE**: job import, structured extraction, fit scoring, recommendations UI
- [ ] **PHASE 3 — DOCUMENT ENGINE**: tailored resume generation, cover letter generation, export pipeline
- [ ] **PHASE 4 — APPLICATION TRACKING**: application tracker, status workflows, notes and follow-up system
- [ ] **PHASE 5 — AUTOMATION**: Playwright automation layer, generic adapter first, then modular site adapters
- [ ] **PHASE 6 — HARDENING**: logging, retries, testing, deployment readiness

## CODING STANDARDS

- Write production-quality TypeScript
- Keep modules small and readable
- Validate inputs, handle null/edge cases
- Avoid overengineering
- Prefer boring, reliable patterns
- Keep business logic separate from UI
- Use clear naming

## PRODUCT POSITIONING

AutoApplyAI helps job seekers find strong-fit roles, tailor ATS-friendly resumes, generate grounded cover letters, track every application, and automate the repetitive parts of the process without faking qualifications or losing control.
