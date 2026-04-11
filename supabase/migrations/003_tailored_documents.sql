-- AutoApplyAI — Phase 3: Tailored documents enhancements
-- Add versioning, status, and keyword alignment columns to tailored_documents.

alter table public.tailored_documents
  add column if not exists label           text,
  add column if not exists version_number  integer not null default 1,
  add column if not exists status          text not null default 'draft'
    check (status in ('draft','saved','exported')),
  add column if not exists base_resume_id  uuid references public.resumes(id) on delete set null,
  add column if not exists keyword_matches jsonb default '[]',
  add column if not exists updated_at      timestamptz not null default now();

create index if not exists idx_tailored_docs_user on public.tailored_documents(user_id);
create index if not exists idx_tailored_docs_user_job on public.tailored_documents(user_id, job_id);

-- Keep updated_at fresh
drop trigger if exists trg_tailored_docs_updated on public.tailored_documents;
create trigger trg_tailored_docs_updated
  before update on public.tailored_documents
  for each row execute function public.set_updated_at();
