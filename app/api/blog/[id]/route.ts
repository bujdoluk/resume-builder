
import { requireAdmin } from "@/lib/adminAuth";
import { errorResponse } from "@/lib/apiErrors";
import { validateBody } from "@/lib/apiValidation";
import { AUDIT_ACTIONS, logAuditEvent } from "@/lib/auditLog";
import { HTTP_BAD_REQUEST, HTTP_INTERNAL_SERVER_ERROR } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { deleteBlogPost, updateBlogPost, type BlogCategoryKey } from "@/lib/supabase/blogPosts";
import { blogPostBodySchema } from "@/lib/validation/blog";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase, request);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const deletedPost = await deleteBlogPost(supabase, id);
    if (!deletedPost) {
      return errorResponse(HTTP_INTERNAL_SERVER_ERROR, "failedToDeletePost", request);
    }
    await logAuditEvent({
      userId: auth.id,
      actorEmail: auth.email ?? null,
      action: AUDIT_ACTIONS.BLOG_DELETE,
      target: deletedPost.slug,
      metadata: { title: deletedPost.title, category: deletedPost.category },
    });
    return Response.json({ ok: true });
  } catch {
    return errorResponse(HTTP_INTERNAL_SERVER_ERROR, "failedToDeletePost", request);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase, request);
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = validateBody(blogPostBodySchema, body ?? {});
  if (!parsed.success) {
    return errorResponse(HTTP_BAD_REQUEST, parsed.key, request);
  }
  const { category, title, subtitle, content, authorName, authorAvatarUrl, readTime, publishedAt } =
    parsed.data;

  try {
    const updatedPost = await updateBlogPost(supabase, id, {
      category: category as BlogCategoryKey,
      title,
      subtitle,
      content,
      authorName,
      authorAvatarUrl,
      readTime,
      publishedAt,
    });
    if (!updatedPost) {
      return errorResponse(HTTP_INTERNAL_SERVER_ERROR, "failedToUpdatePost", request);
    }
    await logAuditEvent({
      userId: auth.id,
      actorEmail: auth.email ?? null,
      action: AUDIT_ACTIONS.BLOG_UPDATE,
      target: updatedPost.slug,
      metadata: { title: updatedPost.title, category: updatedPost.category },
    });
    return Response.json({ post: updatedPost });
  } catch {
    return errorResponse(HTTP_INTERNAL_SERVER_ERROR, "failedToUpdatePost", request);
  }
}
