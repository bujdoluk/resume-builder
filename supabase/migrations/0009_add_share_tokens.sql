alter table public.resumes add column if not exists share_token text unique;
alter table public.cover_letters add column if not exists share_token text unique;
