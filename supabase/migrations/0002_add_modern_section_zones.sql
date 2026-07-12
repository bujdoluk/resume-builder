alter table public.resumes
  add column if not exists modern_section_zones jsonb not null default '{}'::jsonb;
