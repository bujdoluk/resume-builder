/**
 * Creates a Supabase client for use in Server Components/Actions, backed by
 * the request's cookies. Cookie writes are wrapped in a try/catch since
 * Server Components can only read cookies — the middleware in the root
 * `proxy.ts` (via `lib/supabase/proxy.ts`) handles actually refreshing them.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore because
            // proxy.ts refreshes the session on every request.
          }
        },
      },
    },
  );
}
