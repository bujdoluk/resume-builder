/**
 * `ensureUserId` returns the current anonymous Supabase user's id, silently
 * creating an anonymous session on first use — there's no login screen, so
 * saved resumes are scoped to this anonymous identity via RLS.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

// "My resumes" doesn't have a login screen — a Supabase anonymous session is
// created silently on first save/visit, and resumes are scoped to that
// anonymous user via RLS (auth.uid() = user_id).
export async function ensureUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) return session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw error ?? new Error("Failed to start anonymous session");
  }
  return data.user.id;
}
