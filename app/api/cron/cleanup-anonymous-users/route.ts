
import * as Sentry from "@sentry/nextjs";
import { errorResponse } from "@/lib/apiErrors";
import {
  ANONYMOUS_ACCOUNT_RETENTION_DAYS,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_UNAUTHORIZED,
} from "@/lib/constants";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return errorResponse(HTTP_UNAUTHORIZED, "unauthorized", request);
  }

  const supabase = createServiceRoleClient();
  const { data: staleUsers, error } = await supabase.rpc(
    "get_stale_anonymous_user_ids",
    { retention_days: ANONYMOUS_ACCOUNT_RETENTION_DAYS },
  );
  if (error) {
    Sentry.captureException(error);
    return errorResponse(HTTP_INTERNAL_SERVER_ERROR, "cleanupQueryFailed", request);
  }

  let deleted = 0;
  let failed = 0;
  for (const { id } of (staleUsers ?? []) as { id: string }[]) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
    if (deleteError) {
      failed++;
      Sentry.captureException(deleteError);
    } else {
      deleted++;
    }
  }

  return Response.json({ deleted, failed });
}
