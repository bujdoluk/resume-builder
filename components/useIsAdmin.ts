"use client";

/**
 * Whether the current session belongs to an admin (app_metadata.role,
 * granted via scripts/set-admin.mjs) — gates the "Add Blog" button on
 * /blog. Mirrors the session-read/subscribe pattern in
 * components/navbar/AuthButton.tsx, kept separate since admin status is
 * only needed on the blog page, not the navbar. This is a UI convenience
 * only — the real authorization boundary is the `blog_posts` insert RLS
 * policy plus the server-side check in app/api/blog/route.ts.
 */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useIsAdmin(): boolean {
  const [supabase] = useState(() => createClient());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(session?.user?.app_metadata?.role === "admin");
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user?.app_metadata?.role === "admin");
    });

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  return isAdmin;
}
