
import type { Metadata } from "next";
import PrivacyContent from "@/components/landing-page/PrivacyContent";

const title = "Privacy Policy — QuickResumeBuilder.online";
const description = "How QuickResumeBuilder.online collects, uses, and protects your information.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title,
    description,
    url: "/privacy",
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
  return <PrivacyContent />;
}
