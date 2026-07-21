
import { errorResponse } from "@/lib/apiErrors";
import { HTTP_BAD_REQUEST, HTTP_FORBIDDEN, HTTP_INTERNAL_SERVER_ERROR } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { blogCategories, createBlogPost } from "@/lib/supabase/blogPosts";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous || user.app_metadata?.role !== "admin") {
    return errorResponse(HTTP_FORBIDDEN, "adminLoginRequired", request);
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
    return errorResponse(HTTP_BAD_REQUEST, "invalidInput", request);
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
    return errorResponse(HTTP_INTERNAL_SERVER_ERROR, "failedToCreatePost", request);
  }
}
