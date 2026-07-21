
import { Temporal } from "temporal-polyfill";
import { errorResponse } from "@/lib/apiErrors";
import { HTTP_UNAUTHORIZED } from "@/lib/constants";
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
