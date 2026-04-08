-- AutoApplyAI — Phase 1 initial schema
-- Run via: supabase db push  OR  paste into Supabase SQL editor

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES  (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  email         text not null,
  phone         text,
  location      text,
  linkedin_url  text,
  portfolio_url text,
  headline      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RESUMES
-- ============================================================
create table public.resumes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  is_master   boolean not null default false,
  file_path   text,
  file_type   text,
  file_size   integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_resumes_user on public.resumes(user_id);
alter table public.resumes enable row level security;

create policy "Users can manage own resumes"
  on public.resumes for all using (auth.uid() = user_id);

-- ============================================================
-- RESUME VERSIONS  (each tailored variant)
-- ============================================================
create table public.resume_versions (
  id          uuid primary key default uuid_generate_v4(),
  resume_id   uuid not null references public.resumes(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  label       text,
  content     jsonb,
  file_path   text,
  created_at  timestamptz not null default now()
);

create index idx_resume_versions_resume on public.resume_versions(resume_id);
alter table public.resume_versions enable row level security;

create policy "Users can manage own resume versions"
  on public.resume_versions for all using (auth.uid() = user_id);

-- ============================================================
-- PARSED RESUME SECTIONS
-- ============================================================
create table public.parsed_resume_sections (
  id          uuid primary key default uuid_generate_v4(),
  resume_id   uuid not null references public.resumes(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  section     text not null,  -- summary, experience, education, skills, certifications, links
  content     jsonb not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_parsed_sections_resume on public.parsed_resume_sections(resume_id);
alter table public.parsed_resume_sections enable row level security;

create policy "Users can manage own parsed sections"
  on public.parsed_resume_sections for all using (auth.uid() = user_id);

-- ============================================================
-- JOB SEARCH PREFERENCES
-- ============================================================
create table public.job_search_preferences (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  titles            text[] default '{}',
  locations         text[] default '{}',
  work_mode         text check (work_mode in ('remote','hybrid','onsite','any')) default 'any',
  salary_min        integer,
  salary_max        integer,
  salary_currency   text default 'USD',
  industries        text[] default '{}',
  target_companies  text[] default '{}',
  exclude_keywords  text[] default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_job_prefs_user on public.job_search_preferences(user_id);
alter table public.job_search_preferences enable row level security;

create policy "Users can manage own job preferences"
  on public.job_search_preferences for all using (auth.uid() = user_id);

-- ============================================================
-- JOBS
-- ============================================================
create table public.jobs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  company         text not null,
  location        text,
  work_mode       text,
  description     text,
  requirements    jsonb,
  salary_min      integer,
  salary_max      integer,
  salary_currency text default 'USD',
  source          text,     -- url, pasted, manual
  source_url      text,
  ats_platform    text,     -- greenhouse, lever, ashby, workday, unknown
  raw_data        jsonb,
  status          text not null default 'imported' check (status in ('imported','scored','applied','archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_jobs_user on public.jobs(user_id);
create index idx_jobs_status on public.jobs(user_id, status);
alter table public.jobs enable row level security;

create policy "Users can manage own jobs"
  on public.jobs for all using (auth.uid() = user_id);

-- ============================================================
-- JOB SCORES
-- ============================================================
create table public.job_scores (
  id              uuid primary key default uuid_generate_v4(),
  job_id          uuid not null references public.jobs(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  fit_score       integer not null check (fit_score between 0 and 100),
  strengths       jsonb default '[]',
  gaps            jsonb default '[]',
  risk_flags      jsonb default '[]',
  interview_angle text,
  recommendation  text check (recommendation in ('strong_apply','apply_with_edits','skip')),
  explanation     text,
  created_at      timestamptz not null default now()
);

create index idx_job_scores_job on public.job_scores(job_id);
alter table public.job_scores enable row level security;

create policy "Users can manage own job scores"
  on public.job_scores for all using (auth.uid() = user_id);

-- ============================================================
-- TAILORED DOCUMENTS
-- ============================================================
create table public.tailored_documents (
  id              uuid primary key default uuid_generate_v4(),
  job_id          uuid not null references public.jobs(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  doc_type        text not null check (doc_type in ('resume','cover_letter','intro_email')),
  content         jsonb not null,
  file_path       text,
  created_at      timestamptz not null default now()
);

create index idx_tailored_docs_job on public.tailored_documents(job_id);
alter table public.tailored_documents enable row level security;

create policy "Users can manage own tailored documents"
  on public.tailored_documents for all using (auth.uid() = user_id);

-- ============================================================
-- APPLICATIONS
-- ============================================================
create table public.applications (
  id                  uuid primary key default uuid_generate_v4(),
  job_id              uuid not null references public.jobs(id) on delete cascade,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  status              text not null default 'draft' check (status in (
                        'draft','submitted','viewed','phone_screen',
                        'interview','offer','rejected','withdrawn'
                      )),
  resume_version_id   uuid references public.resume_versions(id),
  cover_letter_id     uuid references public.tailored_documents(id),
  applied_at          timestamptz,
  follow_up_date      timestamptz,
  compensation_notes  text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_applications_user on public.applications(user_id);
create index idx_applications_status on public.applications(user_id, status);
alter table public.applications enable row level security;

create policy "Users can manage own applications"
  on public.applications for all using (auth.uid() = user_id);

-- ============================================================
-- APPLICATION EVENTS  (status change log)
-- ============================================================
create table public.application_events (
  id              uuid primary key default uuid_generate_v4(),
  application_id  uuid not null references public.applications(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  event_type      text not null,
  details         jsonb,
  created_at      timestamptz not null default now()
);

create index idx_app_events_app on public.application_events(application_id);
alter table public.application_events enable row level security;

create policy "Users can manage own application events"
  on public.application_events for all using (auth.uid() = user_id);

-- ============================================================
-- FOLLOW-UPS
-- ============================================================
create table public.follow_ups (
  id              uuid primary key default uuid_generate_v4(),
  application_id  uuid not null references public.applications(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  due_date        timestamptz not null,
  message_draft   text,
  status          text not null default 'pending' check (status in ('pending','sent','skipped')),
  created_at      timestamptz not null default now()
);

create index idx_follow_ups_user on public.follow_ups(user_id, status);
alter table public.follow_ups enable row level security;

create policy "Users can manage own follow-ups"
  on public.follow_ups for all using (auth.uid() = user_id);

-- ============================================================
-- AUTOMATION RUNS
-- ============================================================
create table public.automation_runs (
  id              uuid primary key default uuid_generate_v4(),
  application_id  uuid references public.applications(id) on delete set null,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  adapter         text not null,
  status          text not null default 'pending' check (status in (
                    'pending','running','paused','completed','failed'
                  )),
  started_at      timestamptz,
  finished_at     timestamptz,
  error           text,
  created_at      timestamptz not null default now()
);

create index idx_auto_runs_user on public.automation_runs(user_id);
alter table public.automation_runs enable row level security;

create policy "Users can manage own automation runs"
  on public.automation_runs for all using (auth.uid() = user_id);

-- ============================================================
-- AUTOMATION STEPS  (per-action log within a run)
-- ============================================================
create table public.automation_steps (
  id              uuid primary key default uuid_generate_v4(),
  run_id          uuid not null references public.automation_runs(id) on delete cascade,
  step_order      integer not null,
  action          text not null,
  selector        text,
  value           text,
  status          text not null default 'pending' check (status in (
                    'pending','completed','failed','skipped','needs_review'
                  )),
  screenshot_path text,
  error           text,
  created_at      timestamptz not null default now()
);

create index idx_auto_steps_run on public.automation_steps(run_id);
alter table public.automation_steps enable row level security;

create policy "Users can view own automation steps"
  on public.automation_steps for select
  using (
    exists (
      select 1 from public.automation_runs r
      where r.id = run_id and r.user_id = auth.uid()
    )
  );

-- ============================================================
-- LOGS  (general audit / debug log)
-- ============================================================
create table public.logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete set null,
  category    text not null,  -- import, scoring, resume_gen, automation, auth, error
  level       text not null default 'info' check (level in ('debug','info','warn','error')),
  message     text not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index idx_logs_user on public.logs(user_id);
create index idx_logs_category on public.logs(category);
alter table public.logs enable row level security;

create policy "Users can view own logs"
  on public.logs for select using (auth.uid() = user_id);
create policy "Service can insert logs"
  on public.logs for insert with check (true);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- apply to all tables with updated_at
do $$
declare
  t text;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I '
      'for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;
