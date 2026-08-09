
import { requireAdmin } from "@/lib/adminAuth";
import { errorResponse } from "@/lib/apiErrors";
import { validateBody } from "@/lib/apiValidation";
import { AUDIT_ACTIONS, logAuditEvent } from "@/lib/auditLog";
import { HTTP_BAD_REQUEST, HTTP_INTERNAL_SERVER_ERROR } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { createBlogPost, type BlogCategoryKey } from "@/lib/supabase/blogPosts";
import { blogPostBodySchema } from "@/lib/validation/blog";

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase, request);
  if (auth instanceof Response) return auth;

  const body = await request.json().catch(() => null);
  const parsed = validateBody(blogPostBodySchema, body ?? {});
  if (!parsed.success) {
    return errorResponse(HTTP_BAD_REQUEST, parsed.key, request);
  }
  const { category, title, subtitle, content, authorName, authorAvatarUrl, readTime, publishedAt } =
    parsed.data;

  try {
    const post = await createBlogPost(supabase, {
      category: category as BlogCategoryKey,
      title,
      subtitle,
      content,
      authorName,
      authorAvatarUrl,
      readTime,
      publishedAt,
    });
    await logAuditEvent({
      userId: auth.id,
      actorEmail: auth.email ?? null,
      action: AUDIT_ACTIONS.BLOG_CREATE,
      target: post.slug,
      metadata: { title: post.title, category: post.category },
    });
    return Response.json({ post });
  } catch {
    return errorResponse(HTTP_INTERNAL_SERVER_ERROR, "failedToCreatePost", request);
  }
}
