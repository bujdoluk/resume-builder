/**
 * `/account` route: shows the logged-in user's plan and lets them cancel
 * or resume a paid subscription in-app. Linked from the navbar's
 * `AuthButton` dropdown. Defines page-specific SEO metadata, then renders
 * `AccountPage`.
 */
import type { Metadata } from "next";
import AccountPage from "@/components/AccountPage";

const title = "My Account — QuickResumeBuilder.com";
const description = "View and manage your QuickResumeBuilder.com subscription.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/account",
  },
  robots: {
    index: false,
  },
  openGraph: {
    title,
    description,
    url: "/account",
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
  return <AccountPage />;
}
