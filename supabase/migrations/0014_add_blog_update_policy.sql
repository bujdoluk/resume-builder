drop policy if exists "Admins can update blog posts" on public.blog_posts;
create policy "Admins can update blog posts" on public.blog_posts
  for update using (
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
