/**
 * `/reset-password` route: landing point after a password-reset email link
 * (see `resetPassword` in lib/supabase/auth.ts and the `next` param routed
 * through app/auth/callback/route.ts). Defines page-specific SEO metadata,
 * then renders `ResetPasswordPage`.
 */
import type { Metadata } from "next";
import ResetPasswordPage from "@/components/ResetPasswordPage";

const title = "Reset password — QuickResumeBuilder.com";
const description = "Choose a new password for your account.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/reset-password",
  },
  robots: {
    index: false,
  },
  openGraph: {
    title,
    description,
    url: "/reset-password",
    siteName: "QuickResumeBuilder.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function Page() {
  return <ResetPasswordPage />;
}
