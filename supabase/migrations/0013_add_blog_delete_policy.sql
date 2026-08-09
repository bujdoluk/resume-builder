drop policy if exists "Admins can delete blog posts" on public.blog_posts;
create policy "Admins can delete blog posts" on public.blog_posts
  for delete using (
    (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
