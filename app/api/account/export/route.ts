/**
 * Returns everything tied to the current user's account as one JSON
 * payload — used by the "Export my data" control on
 * components/AccountPage.tsx, which turns this response into a downloaded
 * file client-side (same blob-download pattern as DownloadButton.tsx)
 * rather than this route driving the download itself.
 *
 * No service-role client needed — every read here goes through the normal
 * session-scoped client, and RLS already scopes `resumes`/`cover_letters`/
 * `subscriptions` reads to the caller's own rows.
 */
import { Temporal } from "temporal-polyfill";
import { createClient } from "@/lib/supabase/server";
import { listAllCoverLetters } from "@/lib/supabase/coverLetters";
import { listAllResumes } from "@/lib/supabase/resumes";
import { getSubscription } from "@/lib/supabase/subscriptions";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    return Response.json({ error: "Login required." }, { status: 401 });
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
