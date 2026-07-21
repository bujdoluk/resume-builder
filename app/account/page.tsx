
import type { Metadata } from "next";
import AccountPage from "@/components/AccountPage";

const title = "My Account — QuickResumeBuilder.online";
const description = "View and manage your QuickResumeBuilder.online subscription.";

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
  return <AccountPage />;
}
