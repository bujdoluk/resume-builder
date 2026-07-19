/**
 * `ensureUserId` returns the current anonymous Supabase user's id, silently
 * creating an anonymous session on first use — there's no login screen, so
 * saved resumes are scoped to this anonymous identity via RLS.
 */
import type { AuthError, SupabaseClient } from "@supabase/supabase-js";
import { getAnonymousCaptchaToken } from "@/lib/supabase/invisibleCaptcha";

// "My resumes" doesn't have a login screen — a Supabase anonymous session is
// created silently on first save/visit, and resumes are scoped to that
// anonymous user via RLS (auth.uid() = user_id). Once Supabase's CAPTCHA
// protection is turned on it applies to every auth endpoint, including this
// silent one — captchaToken comes from the invisible widget in
// components/InvisibleCaptcha.tsx, resolving to undefined (harmlessly
// ignored by Supabase) until that's configured.
//
// Deduplicated via a shared in-flight promise: Sidebar.tsx calls this twice
// on mount (once each for the resume/cover-letter counts), and without this
// both calls would race to call the invisible widget's execute() at the
// same time — hCaptcha cancels whichever execute() call was already
// pending the moment a second one starts ("hcaptcha-execute-replaced"),
// so both attempts failed. Every concurrent caller now shares the exact
// same sign-in attempt instead of each starting their own.
let inFlightSignIn: Promise<string> | null = null;

const CAPTCHA_RETRY_DELAY_MS = 750;

function isCaptchaFailure(error: AuthError | null): boolean {
  return error?.code === "captcha_failed";
}

async function attemptAnonymousSignIn(supabase: SupabaseClient) {
  const captchaToken = await getAnonymousCaptchaToken();
  return supabase.auth.signInAnonymously({ options: { captchaToken } });
}

export async function ensureUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) return session.user.id;

  if (!inFlightSignIn) {
    inFlightSignIn = (async () => {
      try {
        let { data, error } = await attemptAnonymousSignIn(supabase);

        // A captcha failure on the very first attempt is often just a
        // timing issue — the invisible widget's script or first
        // verification pass hadn't finished yet. One retry after a short
        // pause, with a freshly-fetched token, resolves most of those
        // instead of failing outright on a visitor's very first page load.
        if (isCaptchaFailure(error)) {
          await new Promise((resolve) => setTimeout(resolve, CAPTCHA_RETRY_DELAY_MS));
          ({ data, error } = await attemptAnonymousSignIn(supabase));
        }

        if (error || !data.user) {
          throw error ?? new Error("Failed to start anonymous session");
        }
        return data.user.id;
      } finally {
        inFlightSignIn = null;
      }
    })();
  }
  return inFlightSignIn;
}
