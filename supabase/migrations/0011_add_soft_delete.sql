alter table public.resumes add column if not exists deleted_at timestamptz;
alter table public.cover_letters add column if not exists deleted_at timestamptz;

drop policy if exists "Users can insert their own resumes" on public.resumes;
create policy "Users can insert their own resumes" on public.resumes
  for insert with check (
    auth.uid() = user_id
    and (
      exists (
        select 1 from public.subscriptions
        where subscriptions.user_id = auth.uid()
          and subscriptions.plan <> 'free'
          and subscriptions.status in ('active', 'trialing')
      )
      or (
        select count(*) from public.resumes
        where resumes.user_id = auth.uid() and resumes.deleted_at is null
      ) < 2
    )
  );

drop policy if exists "Users can insert their own cover letters" on public.cover_letters;
create policy "Users can insert their own cover letters" on public.cover_letters
  for insert with check (
    auth.uid() = user_id
    and (
      exists (
        select 1 from public.subscriptions
        where subscriptions.user_id = auth.uid()
          and subscriptions.plan <> 'free'
          and subscriptions.status in ('active', 'trialing')
      )
      or (
        select count(*) from public.cover_letters
        where cover_letters.user_id = auth.uid() and cover_letters.deleted_at is null
      ) < 2
    )
  );
