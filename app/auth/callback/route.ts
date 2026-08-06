
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
        // OAuth sign-in only ever establishes aal1 — an account with a
        // verified TOTP factor (currently only admins) must still complete
        // the step-up challenge before reaching `next`, same as password
        // login. LoginPage detects this on mount and shows the code form.
        if (await getStepUpRequired(supabase)) {
          return NextResponse.redirect(`${origin}/login?next=${encodeURIComponent(next)}`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("OAuth code exchange failed:", error);
      Sentry.captureException(error);
    } catch (error) {
      // exchangeCodeForSession only returns known auth failures as `error` —
      // anything else (network blip, stale/replayed code verifier) throws,
      // and would otherwise surface as an unhandled 500 here.
      console.error("OAuth code exchange threw:", error);
      Sentry.captureException(error);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
