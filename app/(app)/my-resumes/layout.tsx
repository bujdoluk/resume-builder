/**
 * `/my-resumes` is a client component (lists the current user's saved
 * resumes), so its canonical URL must be declared in this sibling
 * server-component layout instead of the page itself. Also marked noindex,
 * matching the `disallow` for this route in `app/robots.ts` — it's
 * user-specific, not a public marketing page.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/my-resumes",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyResumesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
