
import { requireAdmin } from "@/lib/adminAuth";
import { errorResponse } from "@/lib/apiErrors";
import { AUDIT_ACTIONS, logAuditEvent } from "@/lib/auditLog";
import { HTTP_INTERNAL_SERVER_ERROR } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { deleteBlogPost } from "@/lib/supabase/blogPosts";

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
