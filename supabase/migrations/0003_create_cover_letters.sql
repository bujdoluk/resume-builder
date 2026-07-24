create table if not exists public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Untitled cover letter',
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cover_letters enable row level security;

drop policy if exists "Users can view their own cover letters" on public.cover_letters;
create policy "Users can view their own cover letters" on public.cover_letters
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own cover letters" on public.cover_letters;
create policy "Users can insert their own cover letters" on public.cover_letters
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own cover letters" on public.cover_letters;
create policy "Users can update their own cover letters" on public.cover_letters
  for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own cover letters" on public.cover_letters;
create policy "Users can delete their own cover letters" on public.cover_letters
  for delete using (auth.uid() = user_id);
