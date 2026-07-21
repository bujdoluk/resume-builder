
import { createClient } from "@/lib/supabase/server";
import { blogCategories, createBlogPost } from "@/lib/supabase/blogPosts";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous || user.app_metadata?.role !== "admin") {
    return Response.json({ error: "Admin login required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { category, title, subtitle, content, authorName, authorAvatarUrl, readTime, publishedAt } =
    body ?? {};

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof subtitle !== "string" ||
    !subtitle.trim() ||
    typeof content !== "string" ||
    !content.trim() ||
    typeof authorName !== "string" ||
    !authorName.trim() ||
    typeof readTime !== "string" ||
    !readTime.trim() ||
    typeof publishedAt !== "string" ||
    !publishedAt.trim() ||
    !blogCategories.includes(category)
  ) {
    return Response.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    const post = await createBlogPost(supabase, {
      category,
      title: title.trim(),
      subtitle: subtitle.trim(),
      content: content.trim(),
      authorName: authorName.trim(),
      authorAvatarUrl: typeof authorAvatarUrl === "string" && authorAvatarUrl.trim() ? authorAvatarUrl.trim() : null,
      readTime: readTime.trim(),
      publishedAt,
    });
    return Response.json({ post });
  } catch {
    return Response.json({ error: "Failed to create post." }, { status: 500 });
  }
}
