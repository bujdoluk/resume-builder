
import { Temporal } from "temporal-polyfill";
import { errorResponse } from "@/lib/apiErrors";
import {
  HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED,
  RATE_LIMIT_ACCOUNT_EXPORT_REQUESTS,
  RATE_LIMIT_ACCOUNT_EXPORT_WINDOW,
} from "@/lib/constants";
import { checkRateLimit } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/server";
import { listAllCoverLetters } from "@/lib/supabase/coverLetters";
import { listAllResumes } from "@/lib/supabase/resumes";
import { getSubscription } from "@/lib/supabase/subscriptions";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    return errorResponse(HTTP_UNAUTHORIZED, "loginRequired", request);
  }

  const allowed = await checkRateLimit(
    "account-export",
    user.id,
    RATE_LIMIT_ACCOUNT_EXPORT_REQUESTS,
    RATE_LIMIT_ACCOUNT_EXPORT_WINDOW,
  );
  if (!allowed) {
    return errorResponse(HTTP_TOO_MANY_REQUESTS, "rateLimited", request);
  }

  const [resumes, coverLetters, subscription] = await Promise.all([
    listAllResumes(supabase, user.id),
    listAllCoverLetters(supabase, user.id),
    getSubscription(supabase, user.id),
  ]);

  return Response.json({
    exportedAt: Temporal.Now.instant().toString(),
    account: { email: user.email, createdAt: user.created_at },
    subscription,
    resumes,
    coverLetters,
  });
}
