-- AutoApplyAI — Phase 2: job_imports table
-- Stores the raw import event before extraction/scoring.

create table if not exists public.job_imports (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  job_id          uuid references public.jobs(id) on delete set null,
  source          text not null check (source in ('pasted','url','manual')),
  raw_text        text not null,
  source_url      text,
  extracted_data  jsonb,
  extraction_method text, -- 'deterministic', 'ai_claude', etc.
  status          text not null default 'pending' check (status in ('pending','extracted','scored','failed')),
  error           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_job_imports_user on public.job_imports(user_id);
create index idx_job_imports_status on public.job_imports(user_id, status);
alter table public.job_imports enable row level security;

create policy "Users can manage own job imports"
  on public.job_imports for all using (auth.uid() = user_id);

-- Apply updated_at trigger
create trigger set_updated_at before update on public.job_imports
  for each row execute function public.set_updated_at();
