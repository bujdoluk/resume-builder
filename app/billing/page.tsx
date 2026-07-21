
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
