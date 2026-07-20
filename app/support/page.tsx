/**
 * `/support` route: shows the support email and a live-chat entry point.
 * Linked from the navbar's `AuthButton` dropdown, alongside "My Account"
 * and "Billing". Unlike those two, this page doesn't require login.
 */
import type { Metadata } from "next";
import SupportPage from "@/components/SupportPage";

const title = "Support — QuickResumeBuilder.online";
const description = "Get help with QuickResumeBuilder.online.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    title,
    description,
    url: "/support",
    siteName: "QuickResumeBuilder.online",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function Page() {
  return <SupportPage />;
}
