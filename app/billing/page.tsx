/**
 * `/billing` route: shows the logged-in user's plan and lets them cancel or
 * resume a paid subscription in-app. Linked from the navbar's `AuthButton`
 * dropdown, alongside "My Account". Defines page-specific SEO metadata,
 * then renders `BillingPage`.
 */
import type { Metadata } from "next";
import BillingPage from "@/components/BillingPage";

const title = "Billing — QuickResumeBuilder.online";
const description = "View and manage your QuickResumeBuilder.online subscription.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/billing",
  },
  robots: {
    index: false,
  },
  openGraph: {
    title,
    description,
    url: "/billing",
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
  return <BillingPage />;
}
