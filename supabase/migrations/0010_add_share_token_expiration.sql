alter table public.resumes add column if not exists share_token_expires_at timestamptz;
alter table public.cover_letters add column if not exists share_token_expires_at timestamptz;

update public.resumes
  set share_token_expires_at = now() + interval '30 days'
  where share_token is not null and share_token_expires_at is null;

update public.cover_letters
  set share_token_expires_at = now() + interval '30 days'
  where share_token is not null and share_token_expires_at is null;
