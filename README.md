# AutoApplyAI

Find strong-fit roles, tailor ATS-friendly resumes, generate grounded cover letters, track every application, and automate the repetitive parts of the process — without faking qualifications or losing control.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Icons | Lucide React |
| Browser automation | Playwright (Phase 5) |
| AI | Claude API (Phase 2+) |

## Local Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/billionairerent/johnny5alive.git
cd johnny5alive
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key |

### 3. Set up the database

Run the SQL migration in `supabase/migrations/001_initial_schema.sql`:

**Option A — Supabase CLI:**
```bash
npx supabase db push
```

**Option B — SQL Editor:**
1. Open your Supabase Dashboard → SQL Editor
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Run

### 4. Create a storage bucket

In Supabase Dashboard → Storage:
1. Create a new bucket called `resumes`
2. Set it to **private**
3. Add a policy so authenticated users can upload to their own folder:
   - Policy name: `Users can upload own resumes`
   - Operation: INSERT
   - Policy: `(bucket_id = 'resumes') AND (auth.uid()::text = (storage.foldername(name))[1])`

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/        # Protected pages with sidebar layout
│   │   ├── dashboard/      # Main dashboard
│   │   ├── resume/         # Resume vault & upload
│   │   ├── jobs/           # Job import & scoring (Phase 2)
│   │   ├── applications/   # Application tracker (Phase 4)
│   │   └── settings/       # Profile settings
│   ├── auth/callback/      # Supabase auth callback handler
│   └── api/resume/upload/  # Resume upload API route
├── components/             # Shared UI components
│   └── ui/                 # Primitives (Button, Input, Card)
├── lib/
│   ├── supabase/           # Supabase client helpers
│   └── constants.ts        # App-wide constants
└── types/
    └── database.ts         # Database type definitions
```

## Database Schema

The full schema lives in `supabase/migrations/001_initial_schema.sql` and includes tables for:

- `profiles` — user profiles (extends Supabase auth)
- `resumes` / `resume_versions` / `parsed_resume_sections` — resume vault
- `job_search_preferences` — saved search criteria
- `jobs` / `job_scores` — imported jobs and fit scoring
- `tailored_documents` — generated resumes and cover letters
- `applications` / `application_events` — application tracker
- `follow_ups` — follow-up management
- `automation_runs` / `automation_steps` — browser automation logs
- `logs` — audit and debug logging

All tables use row-level security so users can only access their own data.

## Roadmap

- [x] **Phase 1** — Foundation (auth, schema, resume upload, dashboard)
- [ ] **Phase 2** — Job Intelligence (import, scoring, recommendations)
- [ ] **Phase 3** — Document Engine (tailored resumes, cover letters, export)
- [ ] **Phase 4** — Application Tracking (status workflows, follow-ups)
- [ ] **Phase 5** — Automation (Playwright adapters)
- [ ] **Phase 6** — Hardening (logging, testing, deployment)

## License

Private — not yet licensed for distribution.
