create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Untitled resume',
  template_id text not null default 'basic',
  color text,
  font text,
  font_size text,
  section_order jsonb not null default '[]'::jsonb,
  visible_fields jsonb not null default '[]'::jsonb,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resumes enable row level security;

drop policy if exists "Users can view their own resumes" on public.resumes;
create policy "Users can view their own resumes" on public.resumes
  for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own resumes" on public.resumes;
create policy "Users can insert their own resumes" on public.resumes
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own resumes" on public.resumes;
create policy "Users can update their own resumes" on public.resumes
  for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their own resumes" on public.resumes;
create policy "Users can delete their own resumes" on public.resumes
  for delete using (auth.uid() = user_id);
