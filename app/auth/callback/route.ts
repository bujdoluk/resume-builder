import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getStepUpRequired } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // OAuth only reaches aal1, so accounts with TOTP still need the step-up. LoginPage handles it on mount.
        if (await getStepUpRequired(supabase)) {
          return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(next)}`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("OAuth code exchange failed:", error);
      Sentry.captureException(error);
    } catch (error) {
      // Throws on network errors or a replayed verifier, which would otherwise be a 500.
      console.error("OAuth code exchange threw:", error);
      Sentry.captureException(error);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
