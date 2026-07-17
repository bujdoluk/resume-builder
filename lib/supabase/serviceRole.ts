/**
 * Creates a Supabase client authenticated with the service-role key, which
 * bypasses Row Level Security entirely. Server-only — never import this
 * from a Client Component or anywhere its output could reach the browser.
 * Used exclusively by the Stripe webhook route to write `subscriptions`
 * rows, since that table intentionally has no insert/update policies for
 * regular users (see supabase/migrations/0004_create_subscriptions.sql) —
 * subscription state must only ever reflect what Stripe confirms server-side.
 */
import { createClient } from "@supabase/supabase-js";

export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
